"use client";

import { useCart } from "@/context/CartContext";
import type { Product } from "@/types";

export default function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart();

  return (
    <button type="button" onClick={() => addItem(product)} className="btn-primary flex-1 py-3">
      Add to Cart — {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(product.price)}
    </button>
  );
}
