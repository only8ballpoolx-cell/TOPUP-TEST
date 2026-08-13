import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FF TOPUP",
  description: "Free Fire UID topup",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <body className="min-h-screen bg-surface text-slate-100">
        <div className="mx-auto min-h-screen max-w-md bg-surface">{children}</div>
      </body>
    </html>
  );
}
