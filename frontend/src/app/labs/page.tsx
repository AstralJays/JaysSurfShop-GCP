import Link from "next/link";
import { LAB_CATEGORIES, labsForCategory, OWASP_LABS } from "@/lib/owaspLabs";

export const metadata = {
  title: "Labs | Jay's Surf Shop",
};

export default function LabsIndexPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-teal-700">
          Damn Vulnerable Surf Shop
        </p>
        <h1 className="font-display text-3xl font-bold text-ocean-900 mt-1">OWASP labs</h1>
        <p className="mt-3 text-ocean-600 leading-relaxed max-w-2xl">
          Like DVWA: pick one lab, exercise it once, wait for detections. Labs are tagged by where
          they run — <span className="font-medium text-amber-800">GKE</span> (cluster nodes) vs{" "}
          <span className="font-medium text-violet-800">Cloud Run</span> (order-webhook) — so you
          know which Upwind workload to open.
        </p>
        <p className="mt-2 text-sm text-ocean-500">{OWASP_LABS.length} labs · one at a time</p>
      </header>

      <div className="space-y-10">
        {LAB_CATEGORIES.map((cat) => {
          const labs = labsForCategory(cat.id);
          return (
            <section key={cat.id}>
              <h2 className="font-display text-xl font-bold text-ocean-900">{cat.label}</h2>
              <p className="text-sm text-ocean-600 mt-1 mb-4">{cat.blurb}</p>
              <ul className="grid sm:grid-cols-2 gap-3">
                {labs.map((lab) => (
                  <li key={lab.slug}>
                    <Link
                      href={`/labs/${lab.slug}`}
                      className="block rounded-xl border border-ocean-100 bg-white p-4 hover:border-ocean-300 transition h-full"
                    >
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-[10px] font-mono font-semibold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded">
                          {lab.ref}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            lab.runtime === "cloud-run"
                              ? "bg-violet-100 text-violet-900"
                              : lab.runtime === "gke"
                                ? "bg-amber-100 text-amber-900"
                                : "bg-ocean-100 text-ocean-800"
                          }`}
                        >
                          {lab.runtime === "cloud-run"
                            ? "Cloud Run"
                            : lab.runtime === "gke"
                              ? "GKE"
                              : "GCP"}
                        </span>
                        <span className="text-[10px] text-ocean-500">{lab.severity}</span>
                      </div>
                      <p className="font-medium text-ocean-900 mt-2 text-sm">{lab.title}</p>
                      <p className="text-[10px] text-ocean-500 mt-0.5">{lab.workload}</p>
                      <p className="text-xs text-ocean-600 mt-1 leading-relaxed line-clamp-2">
                        {lab.summary}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <p className="mt-12 text-center text-sm text-ocean-500">
        Storefront still at{" "}
        <Link href="/shop" className="text-teal-700 underline">
          /shop
        </Link>
        .
      </p>
    </div>
  );
}
