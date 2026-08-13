/**
 * FF TOPUP — Cloud Functions Backend
 * ------------------------------------------------------------------
 * All secrets (payment SMS-forwarder secret, Free Fire provider API key)
 * live here on the server, never in the browser bundle.
 *
 * Deploy: firebase deploy --only functions
 * Set secrets first:
 *   firebase functions:secrets:set SMS_FORWARDER_SECRET
 *   firebase functions:secrets:set FF_PROVIDER_API_KEY
 */

const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

admin.initializeApp();
const db = admin.firestore();

const SMS_FORWARDER_SECRET = defineSecret("SMS_FORWARDER_SECRET");
const FF_PROVIDER_API_KEY = defineSecret("FF_PROVIDER_API_KEY");

/* ------------------------------------------------------------------
 * 1) INCOMING PAYMENT WEBHOOK
 * ------------------------------------------------------------------
 * Your SMS-forwarder app (running on the phone that receives bKash/
 * Nagad "cash in" texts) POSTs each parsed SMS here instead of writing
 * straight to a public Realtime Database node (which is how the old
 * site did it — that let anyone with the DB rules read/write payment
 * records). This endpoint checks a shared secret, then stores the
 * payment as "unclaimed" for a user to match against.
 *
 * Expected body: { secret, trxId, amount, sender, method }
 * ------------------------------------------------------------------ */
exports.receivePayment = onRequest(
  { secrets: [SMS_FORWARDER_SECRET] },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).send("Method not allowed");

    const { secret, trxId, amount, sender, method } = req.body || {};
    if (secret !== SMS_FORWARDER_SECRET.value()) {
      return res.status(401).send("Unauthorized");
    }
    if (!trxId || !amount) {
      return res.status(400).send("Missing trxId or amount");
    }

    const trxIdNorm = String(trxId).trim().toUpperCase();

    // Idempotent write — same trxId always maps to same doc, so a
    // retried webhook can't create duplicate "unclaimed" credits.
    await db.collection("incomingPayments").doc(trxIdNorm).set(
      {
        trxId: trxIdNorm,
        amount: Number(amount),
        sender: sender || null,
        method: method || "unknown",
        status: "unclaimed", // unclaimed -> claimed
        receivedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return res.status(200).json({ ok: true });
  }
);

/* ------------------------------------------------------------------
 * 2) USER CLAIMS A PAYMENT (called from the site after user submits
 *    the trxId they paid with)
 * ------------------------------------------------------------------ */
exports.claimDeposit = onRequest(
  { cors: true },
  async (req, res) => {
    try {
      const idToken = (req.headers.authorization || "").replace("Bearer ", "");
      const decoded = await admin.auth().verifyIdToken(idToken);
      const uid = decoded.uid;

      const { trxId, amount } = req.body || {};
      if (!trxId || !amount) return res.status(400).json({ error: "Missing fields" });
      const trxIdNorm = String(trxId).trim().toUpperCase();

      const result = await db.runTransaction(async (t) => {
        const payRef = db.collection("incomingPayments").doc(trxIdNorm);
        const paySnap = await t.get(payRef);

        if (!paySnap.exists) throw new Error("NOT_FOUND");
        const pay = paySnap.data();
        if (pay.status === "claimed") throw new Error("ALREADY_CLAIMED");
        if (Number(pay.amount) !== Number(amount)) throw new Error("AMOUNT_MISMATCH");

        const userRef = db.collection("users").doc(uid);
        const userSnap = await t.get(userRef);
        const newBalance = (userSnap.data()?.balance || 0) + Number(pay.amount);

        t.update(userRef, { balance: newBalance });
        t.update(payRef, {
          status: "claimed",
          claimedBy: uid,
          claimedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        t.set(db.collection("deposits").doc(), {
          userId: uid,
          amount: Number(pay.amount),
          trxId: trxIdNorm,
          method: pay.method,
          status: "approved",
          date: admin.firestore.FieldValue.serverTimestamp(),
        });

        return newBalance;
      });

      return res.status(200).json({ ok: true, balance: result });
    } catch (e) {
      const map = {
        NOT_FOUND: [404, "Transaction not found yet. Please wait a few seconds and try again."],
        ALREADY_CLAIMED: [409, "This transaction has already been used."],
        AMOUNT_MISMATCH: [409, "The amount doesn't match what we received."],
      };
      const [code, msg] = map[e.message] || [500, "Server error"];
      return res.status(code).json({ error: msg });
    }
  }
);

/* ------------------------------------------------------------------
 * 3) AUTO TOPUP — triggered when an order document is created with
 *    status "pending". Deducts balance, then calls the Free Fire
 *    provider's API server-side (key never touches the browser).
 * ------------------------------------------------------------------ */
exports.processTopupOrder = onDocumentCreated(
  { document: "orders/{orderId}", secrets: [FF_PROVIDER_API_KEY] },
  async (event) => {
    const orderRef = event.data.ref;
    const order = event.data.data();
    if (order.status !== "pending") return;

    const userRef = db.collection("users").doc(order.userId);

    try {
      // Deduct balance atomically, fail closed on insufficient funds.
      await db.runTransaction(async (t) => {
        const userSnap = await t.get(userRef);
        const balance = userSnap.data()?.balance || 0;
        if (balance < order.price) throw new Error("INSUFFICIENT_BALANCE");
        t.update(userRef, { balance: balance - order.price });
      });

      const settingsSnap = await db.collection("settings").doc("general").get();
      const settings = settingsSnap.data() || {};
      const apiUrl = settings.autoTopUpApiUrl;
      if (!apiUrl) throw new Error("NOT_CONFIGURED");

      const resp = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api: FF_PROVIDER_API_KEY.value(),
          playerid: order.playerId,
          productId: order.productId,
          orderid: orderRef.id,
        }),
      });
      const providerResult = await resp.json().catch(() => ({}));

      if (resp.ok && providerResult.success !== false) {
        await orderRef.update({ status: "success", providerResponse: providerResult });
      } else {
        // Provider failed — refund the user automatically.
        await db.runTransaction(async (t) => {
          const userSnap = await t.get(userRef);
          const balance = userSnap.data()?.balance || 0;
          t.update(userRef, { balance: balance + order.price });
        });
        await orderRef.update({ status: "failed", providerResponse: providerResult });
      }
    } catch (e) {
      await orderRef.update({ status: "failed", error: e.message });
    }
  }
);
