import Link from "next/link";
import { notFound } from "next/navigation";
import ProductIllustration from "@/components/ProductIllustration";
import { productDetailImageClass } from "@/lib/productImages";
import ProductCard from "@/components/ProductCard";
import AddToCartButton from "@/components/AddToCartButton";
import { StarRating } from "@/components/StarRating";
import {
  CATEGORY_GRADIENTS,
  formatPrice,
  getProductById,
  getProductRating,
  getRelatedProducts,
  SPEC_LABELS,
} from "@/lib/products";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const { getProducts } = await import("@/lib/products");
  return getProducts().map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const product = getProductById(id);
  if (!product) return { title: "Product Not Found" };
  return {
    title: `${product.name} | Jay's Surf Shop`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const product = getProductById(id);
  if (!product) notFound();

  const { rating, reviewCount } = getProductRating(product.id);
  const related = getRelatedProducts(product);
  const gradient = CATEGORY_GRADIENTS[product.category];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav className="text-sm text-ocean-500 mb-6">
        <Link href="/" className="hover:text-ocean-700">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/shop" className="hover:text-ocean-700">Shop</Link>
        <span className="mx-2">/</span>
        <Link href={`/shop?category=${product.category}`} className="hover:text-ocean-700 capitalize">
          {product.category}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ocean-800">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
        <div className={`card aspect-square flex items-center justify-center bg-gradient-to-br ${gradient} p-8 sm:p-12`}>
          <ProductIllustration
            product={product}
            className={productDetailImageClass(product.category)}
          />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-ocean-500 capitalize">
            {product.category}
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-ocean-900 mt-2">
            {product.name}
          </h1>
          <div className="flex items-center gap-3 mt-3">
            <StarRating rating={rating} />
            <span className="text-sm text-ocean-600">{rating} · {reviewCount} reviews</span>
          </div>
          <p className="text-3xl font-bold text-ocean-800 mt-6">{formatPrice(product.price)}</p>
          <p className="text-ocean-600 mt-4 leading-relaxed">{product.description}</p>

          <div className="mt-6 flex gap-3">
            <AddToCartButton product={product} />
          </div>

          <p className="text-xs text-ocean-500 mt-3">
            Free in-store pickup · 14-day returns on unused boards
          </p>

          <div className="mt-8 border-t border-ocean-100 pt-8">
            <h2 className="font-semibold text-ocean-900 mb-4">Specifications</h2>
            <dl className="grid grid-cols-2 gap-4">
              {Object.entries(product.specs).map(([key, val]) => (
                <div key={key} className="rounded-xl bg-ocean-50 px-4 py-3">
                  <dt className="text-xs text-ocean-500 uppercase tracking-wide">
                    {SPEC_LABELS[key] || key}
                  </dt>
                  <dd className="font-semibold text-ocean-900 mt-0.5">{val}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold text-ocean-900 mb-6">You may also like</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
