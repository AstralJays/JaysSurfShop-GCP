import Link from "next/link";
import { notFound } from "next/navigation";
import LabInteractionPanel from "@/components/LabInteractionPanel";
import {
  LAB_CATEGORIES,
  OWASP_LABS,
  labBySlug,
  labsForCategory,
} from "@/lib/owaspLabs";

export function generateStaticParams() {
  return OWASP_LABS.map((l) => ({ slug: l.slug }));
}

export default async function LabPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lab = labBySlug(slug);
  if (!lab) notFound();

  const category = LAB_CATEGORIES.find((c) => c.id === lab.category);
  const siblings = labsForCategory(lab.category);
  const idx = siblings.findIndex((l) => l.slug === lab.slug);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="grid lg:grid-cols-[220px_1fr] gap-8">
        <aside className="lg:sticky lg:top-24 self-start space-y-4">
          <Link href="/labs" className="text-xs font-medium text-teal-700 hover:underline">
            ← All labs
          </Link>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-ocean-500">
              {category?.label}
            </p>
            <ul className="mt-2 space-y-1">
              {siblings.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/labs/${s.slug}`}
                    className={`block text-xs rounded-md px-2 py-1.5 ${
                      s.slug === lab.slug
                        ? "bg-ocean-900 text-white"
                        : "text-ocean-700 hover:bg-ocean-50"
                    }`}
                  >
                    <span className="font-mono text-[10px] opacity-70">{s.ref}</span>
                    <span className="block truncate">{s.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <article>
          <header className="mb-6">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[11px] font-mono font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                {lab.ref}
              </span>
              <span className="text-[11px] text-ocean-500">{lab.severity}</span>
            </div>
            <h1 className="font-display text-3xl font-bold text-ocean-900 mt-2">{lab.title}</h1>
            <p className="mt-3 text-ocean-600 leading-relaxed">{lab.summary}</p>
          </header>

          <section className="rounded-xl border border-ocean-100 bg-ocean-50/40 p-5 mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ocean-500 mb-2">
              Objective
            </h2>
            <p className="text-sm text-ocean-800">{lab.objective}</p>
            <ol className="mt-4 space-y-2">
              {lab.steps.map((step, i) => (
                <li key={i} className="flex gap-2 text-sm text-ocean-700">
                  <span className="font-mono text-ocean-400 shrink-0">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-ocean-500">
              <span className="font-medium text-ocean-700">Look for: </span>
              {lab.lookFor}
            </p>
            {lab.shopPath && (
              <p className="mt-2 text-xs">
                Storefront surface:{" "}
                <Link href={lab.shopPath} className="text-teal-700 underline">
                  {lab.shopPath}
                </Link>
              </p>
            )}
          </section>

          <section className="rounded-xl border border-ocean-200 bg-white p-5 mb-8">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ocean-500 mb-3">
              Lab form
            </h2>
            <LabInteractionPanel interaction={lab.interaction} />
          </section>

          <nav className="flex justify-between gap-4 text-sm border-t border-ocean-100 pt-4">
            {prev ? (
              <Link href={`/labs/${prev.slug}`} className="text-ocean-600 hover:text-ocean-900">
                ← {prev.title}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link href={`/labs/${next.slug}`} className="text-ocean-600 hover:text-ocean-900 text-right">
                {next.title} →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </article>
      </div>
    </div>
  );
}
