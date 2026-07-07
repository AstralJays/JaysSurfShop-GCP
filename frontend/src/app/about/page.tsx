import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Our Story | Jay's Surf Shop",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex flex-col sm:flex-row items-center gap-8 mb-10">
        <Image src="/logo.png" alt="Jay's Surf Shop" width={140} height={140} className="rounded-full shadow-lg" />
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-ocean-900">Our Story</h1>
          <p className="text-ocean-600 mt-2">Huntington Beach · Est. 1987</p>
        </div>
      </div>

      <div className="prose prose-ocean max-w-none space-y-6 text-ocean-700 leading-relaxed">
        <p>
          Jay Perkins opened this shop with one board shaped in his garage and a belief that
          everyone deserves the right gear for their wave. Thirty-seven years later, we&apos;re
          still on Ocean Drive — same stoke, better wetsuits.
        </p>
        <p>
          We carry boards for every level, wax for every water temp, and wetsuits fitted by
          staff who actually surf. When you&apos;re not sure what you need, our AI assistant
          can help — or just walk in and talk to Jay Jr. at the counter.
        </p>
        <p>
          Whether you&apos;re picking up your first funboard or designing a custom paint job
          with our board designer, we&apos;re here to get you in the water.
        </p>
      </div>

      <div className="mt-10 grid sm:grid-cols-3 gap-4">
        {[
          { stat: "37+", label: "Years in business" },
          { stat: "2,400+", label: "Boards sold" },
          { stat: "4.9★", label: "Average rating" },
        ].map((item) => (
          <div key={item.label} className="card p-5 text-center">
            <p className="font-display text-2xl font-bold text-ocean-800">{item.stat}</p>
            <p className="text-sm text-ocean-600 mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/shop" className="btn-primary">Browse the Shop</Link>
        <Link href="/chat" className="btn-secondary">Ask Our AI Assistant</Link>
      </div>
    </div>
  );
}
