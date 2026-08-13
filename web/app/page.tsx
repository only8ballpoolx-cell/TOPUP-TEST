"use client";
import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";
import Header from "@/components/Header";
import AuthModal from "@/components/AuthModal";
import DepositModal from "@/components/DepositModal";
import ProductList, { Product } from "@/components/ProductList";

export default function Home() {
  const { user, balance } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [playerId, setPlayerId] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [placing, setPlacing] = useState(false);
  const [notice, setNotice] = useState("");

  async function placeOrder() {
    if (!user) return setShowAuth(true);
    if (!playerId) return setNotice("UID লিখুন");
    if (!selected) return setNotice("একটি প্যাকেজ বেছে নিন");

    setPlacing(true);
    setNotice("");
    try {
      // Created as "pending" only. The processTopupOrder Cloud Function
      // re-validates balance/price and calls the FF provider API server-side.
      await addDoc(collection(db, "orders"), {
        userId: user.uid,
        playerId,
        productId: selected.id,
        productName: selected.name,
        price: selected.price,
        status: "pending",
        date: serverTimestamp(),
      });
      setNotice("অর্ডার জমা হয়েছে, প্রসেসিং চলছে...");
    } finally {
      setPlacing(false);
    }
  }

  return (
    <>
      <Header user={user} balance={balance} onLoginClick={() => setShowAuth(true)} />

      <section className="space-y-5 p-5">
        <div className="rounded-xl bg-card p-4">
          <label className="text-sm text-slate-400">Free Fire Player UID</label>
          <input
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            placeholder="UID লিখুন"
            className="mt-1 w-full rounded-lg bg-slate-700 p-3 text-white outline-none"
          />
        </div>

        <div>
          <h3 className="mb-2 text-sm text-slate-400">প্যাকেজ বেছে নিন</h3>
          <ProductList selected={selected} onSelect={setSelected} />
        </div>

        {notice && <p className="text-sm text-brand">{notice}</p>}

        <button
          onClick={placeOrder}
          disabled={placing}
          className="w-full rounded-lg bg-gradient-to-r from-brand to-brand-dark py-3 font-bold text-white disabled:opacity-60"
        >
          {placing ? "প্রসেসিং..." : "অর্ডার করুন"}
        </button>
      </section>

      <section className="p-5">
        <button
          onClick={() => (user ? setShowDeposit(true) : setShowAuth(true))}
          className="w-full rounded-lg bg-card py-3 font-semibold text-white"
        >
          + ব্যালেন্স যোগ করুন
        </button>
      </section>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showDeposit && user && (
        <DepositModal user={user} onClose={() => setShowDeposit(false)} />
      )}
    </>
  );
}
