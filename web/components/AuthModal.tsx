"use client";
import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  async function handleLogin() {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      onClose();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleSignup() {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await setDoc(doc(db, "users", cred.user.uid), { email, balance: 0 });
      onClose();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 p-5">
      <div className="w-full max-w-sm rounded-xl bg-card p-5 shadow-xl">
        <h2 className="mb-4 font-bold text-white">লগইন / রেজিস্টার</h2>
        {error && <p className="mb-2 text-sm text-red-400">{error}</p>}
        <input
          placeholder="ইমেইল"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-2 w-full rounded-lg bg-slate-700 p-3 text-white outline-none"
        />
        <input
          placeholder="পাসওয়ার্ড"
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          className="mb-4 w-full rounded-lg bg-slate-700 p-3 text-white outline-none"
        />
        <button
          onClick={handleLogin}
          className="mb-2 w-full rounded-lg bg-gradient-to-r from-brand to-brand-dark py-3 font-bold text-white"
        >
          লগইন
        </button>
        <button
          onClick={handleSignup}
          className="w-full rounded-lg bg-slate-700 py-3 font-bold text-white"
        >
          নতুন অ্যাকাউন্ট
        </button>
        <button onClick={onClose} className="mt-3 w-full text-sm text-slate-400">
          বন্ধ করুন
        </button>
      </div>
    </div>
  );
}
