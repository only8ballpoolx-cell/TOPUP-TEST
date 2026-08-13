"use client";
import { useState } from "react";
import { User } from "firebase/auth";
import { CLAIM_DEPOSIT_URL } from "@/lib/firebase";

export default function DepositModal({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  const [trxId, setTrxId] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [message, setMessage] = useState("");

  async function verify() {
    if (!trxId || !amount) {
      setStatus("error");
      setMessage("উভয় ফিল্ড পূরণ করুন");
      return;
    }
    setStatus("loading");
    try {
      const idToken = await user.getIdToken();
      const resp = await fetch(CLAIM_DEPOSIT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ trxId, amount }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "ভেরিফিকেশন ব্যর্থ");
      setStatus("success");
      setMessage("ব্যালেন্স যোগ হয়েছে!");
    } catch (e: any) {
      setStatus("error");
      setMessage(e.message);
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 p-5">
      <div className="w-full max-w-sm rounded-xl bg-card p-5 shadow-xl">
        <h2 className="mb-4 font-bold text-white">ব্যালেন্স যোগ করুন</h2>
        <p className="mb-3 text-sm text-slate-400">
          bKash/Nagad নাম্বারে টাকা পাঠিয়ে নিচে Transaction ID ও Amount দিন।
        </p>
        <input
          placeholder="Transaction ID"
          value={trxId}
          onChange={(e) => setTrxId(e.target.value)}
          className="mb-2 w-full rounded-lg bg-slate-700 p-3 text-white outline-none"
        />
        <input
          placeholder="Amount (৳)"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mb-3 w-full rounded-lg bg-slate-700 p-3 text-white outline-none"
        />
        {message && (
          <p className={`mb-3 text-sm ${status === "error" ? "text-red-400" : "text-emerald-400"}`}>
            {message}
          </p>
        )}
        <button
          onClick={verify}
          disabled={status === "loading"}
          className="mb-2 w-full rounded-lg bg-gradient-to-r from-brand to-brand-dark py-3 font-bold text-white disabled:opacity-60"
        >
          {status === "loading" ? "যাচাই হচ্ছে..." : "ভেরিফাই করুন"}
        </button>
        <button onClick={onClose} className="w-full text-sm text-slate-400">
          বন্ধ করুন
        </button>
      </div>
    </div>
  );
}
