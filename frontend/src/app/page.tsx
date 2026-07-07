import Link from "next/link";
import Image from "next/image";
import ProductCard from "@/components/ProductCard";
import { getCategories, getFeaturedProducts } from "@/lib/products";

export default function HomePage() {
  const featured = getFeaturedProducts();
  const categories = getCategories();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-ocean-600 via-ocean-700 to-ocean-900 text-white">
        <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28 flex flex-col sm:flex-row items-center gap-10">
          <div className="flex-1">
            <p className="text-ocean-200 text-sm font-semibold tracking-widest uppercase">
              Huntington Beach since 1987
            </p>
            <h1 className="font-display mt-3 text-4xl sm:text-6xl font-bold leading-tight max-w-2xl">
              Gear up. Paddle out. Ride your wave.
            </h1>
            <p className="mt-4 text-lg text-ocean-100 max-w-xl">
              Premium surfboards, wax, and wetsuits — hand-picked by locals who surf every morning.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="btn-primary bg-white text-ocean-800 hover:bg-ocean-50">
                Shop All Gear
              </Link>
            <Link href="/design" className="btn-secondary border-white text-white hover:bg-white/10">
              Create-A-Board
            </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-6 text-sm text-ocean-200">
              <span>✓ Free wax with every board</span>
              <span>✓ Expert fittings</span>
              <span>✓ 14-day board returns</span>
            </div>
          </div>
          <Image
            src="/logo.png"
            alt="Jay's Surf Shop logo"
            width={220}
            height={220}
            className="hidden sm:block rounded-full shadow-2xl ring-4 ring-white/20"
            priority
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-ocean-50 to-transparent" />
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 -mt-8 relative z-10">
        <div className="grid sm:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.id}`}
              className="card p-6 text-center group hover:shadow-xl transition hover:-translate-y-0.5"
            >
              <span className="text-3xl">
                {cat.id === "surfboards" ? "🏄" : cat.id === "wax" ? "🕯️" : "🤿"}
              </span>
              <h3 className="mt-2 font-display font-bold text-ocean-900 group-hover:text-ocean-600 transition">
                {cat.name}
              </h3>
              <p className="text-sm text-ocean-600 mt-1">{cat.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl font-bold text-ocean-900">Staff Picks</h2>
            <p className="text-ocean-600 mt-1">What we&apos;re riding and recommending this season</p>
          </div>
          <Link href="/shop" className="text-sm font-semibold text-ocean-600 hover:text-ocean-800 transition hidden sm:block">
            View all →
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Testimonial + CTA */}
      <section className="bg-white border-y border-ocean-100">
        <div className="mx-auto max-w-6xl px-4 py-16 grid lg:grid-cols-2 gap-12 items-center">
          <blockquote className="relative">
            <span className="font-display text-6xl text-ocean-200 absolute -top-4 -left-2">&ldquo;</span>
            <p className="text-xl text-ocean-800 leading-relaxed pl-8">
              Jay&apos;s helped me find the perfect 3/2 for Pacifica winters. The staff knows
              their stuff and the AI assistant nailed my board size on the first try.
            </p>
            <footer className="mt-4 pl-8 text-sm text-ocean-500">
              — Maria T., San Francisco · Verified customer
            </footer>
          </blockquote>
          <div className="card p-8 bg-gradient-to-br from-ocean-50 to-sand-50">
            <h3 className="font-display text-2xl font-bold text-ocean-900">Build your board or talk to Jay</h3>
            <p className="text-ocean-600 mt-2">
              Create-A-Board lets you stat out a custom stick. Shop Crew is Jay — your in-store advisor for gear picks.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/design" className="btn-primary">Create-A-Board</Link>
              <Link href="/chat" className="btn-secondary">Shop Crew</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
