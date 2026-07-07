"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import ProductIllustration from "@/components/ProductIllustration";
import { productImageClass } from "@/lib/productImages";
import { StarRating } from "@/components/StarRating";
import {
  CATEGORY_GRADIENTS,
  formatPrice,
  getProductRating,
} from "@/lib/products";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const gradient = CATEGORY_GRADIENTS[product.category] || "from-ocean-500 to-ocean-700";
  const { rating, reviewCount } = getProductRating(product.id);

  return (
    <article className="card group overflow-hidden transition hover:shadow-xl hover:-translate-y-1">
      <Link href={`/products/${product.id}`} className="block">
        <div
          className={`relative h-52 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden px-4 py-3`}
        >
          <ProductIllustration
            product={product}
            className={`${productImageClass(product.category)} transition duration-300 group-hover:scale-105`}
          />
          <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ocean-800">
            {product.category}
          </span>
        </div>
      </Link>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <StarRating rating={rating} />
          <span className="text-xs text-ocean-500">({reviewCount})</span>
        </div>
        <Link href={`/products/${product.id}`}>
          <h3 className="font-display text-lg font-bold text-ocean-900 hover:text-ocean-600 transition">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1 text-sm text-ocean-600 line-clamp-2">{product.description}</p>
        <div className="mt-3 flex flex-wrap gap-1">
          {Object.entries(product.specs).slice(0, 2).map(([, val]) => (
            <span
              key={val}
              className="rounded-full bg-ocean-50 px-2 py-0.5 text-xs text-ocean-700"
            >
              {val}
            </span>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="text-xl font-bold text-ocean-800">
            {formatPrice(product.price)}
          </span>
          <button
            type="button"
            onClick={() => addItem(product)}
            className="btn-primary text-xs px-4 py-2 shrink-0"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </article>
  );
}
