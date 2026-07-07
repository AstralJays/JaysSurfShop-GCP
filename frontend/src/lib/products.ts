import type { Category, Product } from "@/types";
import catalogData from "@/data/products.json";

interface Catalog {
  categories: Category[];
  products: Product[];
}

const catalog = catalogData as unknown as Catalog;

export function getProducts(): Product[] {
  return catalog.products;
}

export function getCategories(): Category[] {
  return catalog.categories;
}

export function getProductsByCategory(categoryId: string): Product[] {
  return getProducts().filter((p) => p.category === categoryId);
}

export function getProductById(id: string): Product | undefined {
  return getProducts().find((p) => p.id === id);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

export const CATEGORY_ICONS: Record<string, string> = {
  surfboards: "🏄",
  wax: "🕯️",
  wetsuits: "🤿",
};

export const CATEGORY_GRADIENTS: Record<string, string> = {
  surfboards: "from-ocean-600 to-ocean-800",
  wax: "from-sand-400 to-sand-500",
  wetsuits: "from-slate-100 via-ocean-50 to-slate-200",
};

export function getFeaturedProducts(): Product[] {
  const ids = ["board-pipeline-pro", "board-fish-twin", "wetsuit-32-full", "wax-tropical"];
  return ids.map((id) => getProductById(id)).filter(Boolean) as Product[];
}

export function getProductRating(productId: string): { rating: number; reviewCount: number } {
  let hash = 0;
  for (const char of productId) hash = (hash + char.charCodeAt(0) * 17) % 1000;
  const rating = 4 + (hash % 10) / 10;
  const reviewCount = 12 + (hash % 180);
  return { rating: Math.round(rating * 10) / 10, reviewCount };
}

export function getRelatedProducts(product: Product, limit = 3): Product[] {
  return getProducts()
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, limit);
}

export const SPEC_LABELS: Record<string, string> = {
  length: "Length",
  volume: "Volume",
  finSetup: "Fin Setup",
  tempRange: "Temp Range",
  type: "Type",
  thickness: "Thickness",
  style: "Style",
  zip: "Zip",
};
