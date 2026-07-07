"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import ProductIllustration from "@/components/ProductIllustration";
import { CATEGORY_GRADIENTS, formatPrice } from "@/lib/products";

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    subtotal,
    itemCount,
    clearCart,
  } = useCart();

  const [checkingOut, setCheckingOut] = useState(false);
  const [orderResult, setOrderResult] = useState<{
    orderId?: string;
    message?: string;
    error?: string;
  } | null>(null);

  if (!isOpen) return null;

  async function handleCheckout() {
    setCheckingOut(true);
    setOrderResult(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(({ product, quantity }) => ({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity,
          })),
          subtotal,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOrderResult({ error: data.detail || "Checkout failed" });
        return;
      }
      setOrderResult({ orderId: data.orderId, message: data.message });
      clearCart();
    } catch (err) {
      setOrderResult({
        error: err instanceof Error ? err.message : "Checkout failed",
      });
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-ocean-950/40 backdrop-blur-sm"
        onClick={closeCart}
        aria-hidden
      />
      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
        role="dialog"
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between border-b border-ocean-100 px-6 py-4">
          <h2 className="font-display text-xl font-bold text-ocean-900">
            Your Cart ({itemCount})
          </h2>
          <button
            type="button"
            onClick={closeCart}
            className="rounded-full p-2 text-ocean-500 hover:bg-ocean-50"
            aria-label="Close cart"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-ocean-500">
              <span className="text-5xl mb-4">🏄</span>
              {orderResult?.orderId ? (
                <>
                  <p className="font-medium text-teal-700">Order placed!</p>
                  <p className="text-sm mt-1 font-mono">{orderResult.orderId}</p>
                  <p className="text-xs mt-2 text-ocean-500">{orderResult.message}</p>
                </>
              ) : (
                <>
                  <p className="font-medium">Your cart is empty</p>
                  <p className="text-sm mt-1">Add some gear and catch a wave!</p>
                </>
              )}
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map(({ product, quantity }) => {
                const gradient = CATEGORY_GRADIENTS[product.category] || "from-ocean-500 to-ocean-700";
                return (
                <li key={product.id} className="flex gap-4 border-b border-ocean-50 pb-4">
                  <Link
                    href={`/products/${product.id}`}
                    onClick={closeCart}
                    className={`h-16 w-16 shrink-0 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center p-2`}
                  >
                    <ProductIllustration product={product} className="h-11 w-auto max-w-[36px]" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${product.id}`}
                      onClick={closeCart}
                      className="font-semibold text-ocean-900 truncate block hover:text-ocean-600"
                    >
                      {product.name}
                    </Link>
                    <p className="text-sm text-ocean-600">{formatPrice(product.price)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="h-7 w-7 rounded-full border border-ocean-200 text-ocean-600 hover:bg-ocean-50"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        className="h-7 w-7 rounded-full border border-ocean-200 text-ocean-600 hover:bg-ocean-50"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(product.id)}
                        className="ml-auto text-xs text-coral-500 hover:text-coral-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              );})}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-ocean-100 px-6 py-4 space-y-3">
            <div className="flex justify-between text-lg font-semibold">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {orderResult?.error && (
              <p className="text-xs text-coral-600 text-center">{orderResult.error}</p>
            )}
            <p className="text-xs text-ocean-500 text-center">
              Checkout posts to the order webhook (API Gateway + Lambda on AWS).
            </p>
            <button
              type="button"
              disabled={checkingOut}
              onClick={handleCheckout}
              className="btn-primary w-full disabled:opacity-60"
            >
              {checkingOut ? "Placing order…" : "Checkout"}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
