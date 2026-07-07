import { Suspense } from "react";
import ShopCatalog from "@/components/ShopCatalog";

export const metadata = {
  title: "Shop | Jay's Surf Shop",
  description: "Browse surfboards, surf wax, and wetsuits.",
};

export default function ShopPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-ocean-900">Shop</h1>
        <p className="text-ocean-600 mt-2">
          Hand-picked gear for every session — from first-timers to dawn patrol regulars.
        </p>
      </div>
      <Suspense fallback={<p className="text-ocean-500">Loading catalog...</p>}>
        <ShopCatalog />
      </Suspense>
    </div>
  );
}
