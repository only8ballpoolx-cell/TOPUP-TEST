"use client";
import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";
import { isAdminEmail } from "@/lib/admin";
import AuthModal from "@/components/AuthModal";

type Product = { id: string; name: string; price: number };
type Settings = { autoTopUpApiUrl?: string; autoPayEnabled?: boolean };

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  if (loading) return null;

  if (!user || !isAdminEmail(user.email)) {
    return (
      <div className="p-5 text-center text-white">
        <p className="mb-4">এই পেজ শুধু admin-দের জন্য।</p>
        <button
          onClick={() => setShowAuth(true)}
          className="rounded-lg bg-brand px-4 py-2 font-semibold text-white"
        >
          Admin দিয়ে লগইন করুন
        </button>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </div>
    );
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
  return (
    <div className="space-y-8 p-5 text-white">
      <h1 className="text-xl font-bold">⚙️ Admin Panel</h1>
      <ProductManager />
      <SettingsManager />
    </div>
  );
}

function ProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const productsRef = collection(db, "services", "freefire", "products");

  async function load() {
    const q = query(productsRef, orderBy("price"));
    const snap = await getDocs(q);
    setProducts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
  }

  useEffect(() => {
    load();
  }, []);

  async function addProduct() {
    if (!name || !price) return;
    await addDoc(productsRef, { name, price: Number(price) });
    setName("");
    setPrice("");
    load();
  }

  async function removeProduct(id: string) {
    await deleteDoc(doc(db, "services", "freefire", "products", id));
    load();
  }

  return (
    <section className="rounded-xl bg-card p-4">
      <h2 className="mb-3 font-bold">প্যাকেজ ম্যানেজমেন্ট</h2>

      <div className="mb-4 space-y-2">
        {products.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-lg bg-slate-700 p-3">
            <span>
              {p.name} — ৳{p.price}
            </span>
            <button onClick={() => removeProduct(p.id)} className="text-sm text-red-400">
              ডিলিট
            </button>
          </div>
        ))}
        {products.length === 0 && (
          <p className="text-sm text-slate-400">এখনো কোনো প্যাকেজ যোগ করা হয়নি।</p>
        )}
      </div>

      <div className="flex gap-2">
        <input
          placeholder="নাম (যেমন: 100 Diamond)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded-lg bg-slate-700 p-2 outline-none"
        />
        <input
          placeholder="দাম"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-24 rounded-lg bg-slate-700 p-2 outline-none"
        />
        <button onClick={addProduct} className="rounded-lg bg-brand px-4 font-semibold">
          যোগ করুন
        </button>
      </div>
    </section>
  );
}

function SettingsManager() {
  const [settings, setSettings] = useState<Settings>({});
  const [saved, setSaved] = useState(false);
  const settingsRef = doc(db, "settings", "general");

  useEffect(() => {
    const unsub = onSnapshot(settingsRef, (snap) => {
      setSettings((snap.data() as Settings) || {});
    });
    return unsub;
  }, []);

  async function save() {
    await setDoc(settingsRef, settings, { merge: true });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <section className="rounded-xl bg-card p-4">
      <h2 className="mb-3 font-bold">সেটিংস</h2>

      <label className="mb-1 block text-sm text-slate-400">
        Free Fire Provider API URL
      </label>
      <input
        value={settings.autoTopUpApiUrl || ""}
        onChange={(e) => setSettings({ ...settings, autoTopUpApiUrl: e.target.value })}
        placeholder="https://provider.example.com/api/order"
        className="mb-3 w-full rounded-lg bg-slate-700 p-3 outline-none"
      />

      <p className="mb-3 text-xs text-slate-400">
        API Key এখানে বসাবেন না — সেটা টার্মিনাল থেকে সেট করুন:{" "}
        <code className="rounded bg-slate-700 px-1">
          firebase functions:secrets:set FF_PROVIDER_API_KEY
        </code>
      </p>

      <label className="mb-3 flex items-center gap-2">
        <input
          type="checkbox"
          checked={!!settings.autoPayEnabled}
          onChange={(e) => setSettings({ ...settings, autoPayEnabled: e.target.checked })}
        />
        <span>Auto Pay এনাবল</span>
      </label>

      <button onClick={save} className="rounded-lg bg-brand px-4 py-2 font-semibold">
        সেভ করুন
      </button>
      {saved && <span className="ml-3 text-sm text-emerald-400">সেভ হয়েছে ✓</span>}
    </section>
  );
}
