"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type Product = { id: string; name: string; price: number };

export default function ProductList({
  selected,
  onSelect,
}: {
  selected: Product | null;
  onSelect: (p: Product) => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    (async () => {
      const q = query(
        collection(db, "services", "freefire", "products"),
        orderBy("price")
      );
      const snap = await getDocs(q);
      setProducts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    })();
  }, []);

  return (
    <div className="space-y-2">
      {products.map((p) => (
        <button
          key={p.id}
          onClick={() => onSelect(p)}
          className={`flex w-full items-center justify-between rounded-lg bg-card p-3 text-left text-white ${
            selected?.id === p.id ? "ring-2 ring-brand" : ""
          }`}
        >
          <span>{p.name}</span>
          <span className="font-bold text-brand">৳{p.price}</span>
        </button>
      ))}
      {products.length === 0 && (
        <p className="text-sm text-slate-400">
          কোনো প্যাকেজ পাওয়া যায়নি — Admin panel থেকে যোগ করুন।
        </p>
      )}
    </div>
  );
}
