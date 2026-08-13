"use client";
import { User } from "firebase/auth";

export default function Header({
  user,
  balance,
  onLoginClick,
}: {
  user: User | null;
  balance: number;
  onLoginClick: () => void;
}) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between bg-gradient-to-r from-brand to-brand-dark px-4 py-3">
      <h1 className="text-lg font-bold text-white">⚡ FF TOPUP</h1>
      {user ? (
        <div className="rounded-full bg-black/25 px-3 py-1 text-sm font-semibold text-white">
          ৳ {balance}
        </div>
      ) : (
        <button
          onClick={onLoginClick}
          className="rounded-full bg-black/25 px-3 py-1 text-sm font-semibold text-white"
        >
          লগইন
        </button>
      )}
    </header>
  );
}
