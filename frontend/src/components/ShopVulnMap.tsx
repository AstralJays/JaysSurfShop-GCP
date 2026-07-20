"use client";

import Link from "next/link";
import {
  SHOP_AREAS,
  vulnsForArea,
  type ShopVulnerability,
} from "@/lib/shopVulnerabilities";

const PLANE_COLORS: Record<string, string> = {
  container: "bg-amber-100 text-amber-900",
  serverless: "bg-violet-100 text-violet-900",
  ai: "bg-teal-100 text-teal-900",
  "cloud-xdr": "bg-rose-100 text-rose-900",
  app: "bg-ocean-100 text-ocean-900",
};

function VulnCard({
  vuln,
  selected,
  onSelect,
}: {
  vuln: ShopVulnerability;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <article
      className={`rounded-lg border p-4 transition ${
        selected
          ? "border-ocean-400 bg-ocean-50/80 ring-1 ring-ocean-200"
          : "border-ocean-100 bg-white hover:border-ocean-200"
      }`}
    >
      <button type="button" onClick={onSelect} className="w-full text-left">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h4 className="font-medium text-ocean-900 text-sm">{vuln.title}</h4>
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-ocean-50 text-ocean-600">
              {vuln.tag}
            </span>
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${PLANE_COLORS[vuln.plane]}`}
            >
              {vuln.plane}
            </span>
            <span className="text-[10px] text-ocean-500">{vuln.severity}</span>
          </div>
        </div>
        <p className="text-xs text-ocean-700 mt-2 leading-relaxed">{vuln.whatsWrong}</p>
      </button>

      {selected && (
        <div className="mt-4 pt-3 border-t border-ocean-100 space-y-3">
          <p className="text-xs text-ocean-500">
            <span className="font-medium text-ocean-600">In the shop: </span>
            {vuln.shopperExperience}
          </p>
          <ol className="space-y-2">
            {vuln.walkthrough.map((step, i) => (
              <li key={i} className="flex gap-2 text-xs text-ocean-800 leading-relaxed">
                <span className="font-mono text-ocean-400 shrink-0 w-5">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <p className="text-xs text-ocean-500">
            <span className="font-medium text-ocean-700">Look for: </span>
            {vuln.lookFor}
          </p>
          {vuln.openPath && (
            <Link
              href={vuln.openPath}
              className="inline-flex btn-primary text-[11px] px-3 py-1.5"
              target="_blank"
              rel="noreferrer"
            >
              Open {vuln.openPath} →
            </Link>
          )}
        </div>
      )}
    </article>
  );
}

export default function ShopVulnMap({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-8">
      <p className="text-sm text-ocean-600 leading-relaxed">
        Pick one weakness, open the shop page, walk the steps, then wait for Upwind before the next
        item. No auto-run — detections should come from real storefront traffic only.
      </p>

      {SHOP_AREAS.map((area) => {
        const vulns = vulnsForArea(area.id);
        if (vulns.length === 0) return null;
        return (
          <section key={area.id} className="border border-ocean-100 rounded-xl overflow-hidden">
            <header className="bg-ocean-50 px-5 py-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-bold text-ocean-900">{area.label}</h3>
                <p className="text-sm text-ocean-600 mt-0.5">{area.blurb}</p>
              </div>
              <div className="text-right text-xs text-ocean-500">
                <Link href={area.shopperPath} className="font-medium text-teal-700 hover:underline">
                  {area.shopperPath} →
                </Link>
                <p className="mt-0.5">{area.workload}</p>
              </div>
            </header>
            <div className="p-4 grid gap-3 sm:grid-cols-2">
              {vulns.map((vuln) => (
                <VulnCard
                  key={vuln.id}
                  vuln={vuln}
                  selected={selectedId === vuln.id}
                  onSelect={() => onSelect(vuln.id === selectedId ? "" : vuln.id)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
