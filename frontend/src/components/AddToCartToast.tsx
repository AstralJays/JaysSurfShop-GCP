"use client";

import { useEffect } from "react";
import { useCart } from "@/context/CartContext";

export default function AddToCartToast() {
  const { toast, clearToast, openCart } = useCart();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(clearToast, 4000);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  if (!toast) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-slide-up"
      role="status"
    >
      <div className="flex items-center gap-3 rounded-2xl bg-ocean-900 px-4 py-3 text-white shadow-xl ring-1 ring-white/10 sm:px-5">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500 text-sm">✓</span>
        <span className="text-sm font-medium">{toast}</span>
        <button
          type="button"
          onClick={() => { openCart(); clearToast(); }}
          className="text-xs font-semibold text-ocean-300 hover:text-white underline underline-offset-2"
        >
          View cart
        </button>
        <button
          type="button"
          onClick={clearToast}
          className="text-ocean-400 hover:text-white pl-1"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
