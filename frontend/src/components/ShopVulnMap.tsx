"use client";

import Link from "next/link";
import {
  SHOP_AREAS,
  vulnsForArea,
  type ShopVulnerability,
} from "@/lib/shopVulnerabilities";
import type { SecurityPoc } from "@/lib/securityPocs";

const PLANE_COLORS: Record<string, string> = {
  container: "bg-amber-100 text-amber-900",
  serverless: "bg-violet-100 text-violet-900",
  ai: "bg-teal-100 text-teal-900",
  "cloud-xdr": "bg-rose-100 text-rose-900",
  app: "bg-ocean-100 text-ocean-900",
};

function VulnCard({
  vuln,
  pocById,
  onRunPoc,
  running,
}: {
  vuln: ShopVulnerability;
  pocById: Map<string, SecurityPoc>;
  onRunPoc: (poc: SecurityPoc) => void;
  running: string | null;
}) {
  const runnable = (vuln.pocIds ?? [])
    .map((id) => pocById.get(id))
    .filter((p): p is SecurityPoc => p != null);

  return (
    <article className="rounded-lg border border-ocean-100 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="font-medium text-ocean-900 text-sm">{vuln.title}</h4>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
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
      </div>
      <p className="text-xs text-ocean-700 mt-2 leading-relaxed">{vuln.whatsWrong}</p>
      <p className="text-xs text-ocean-500 mt-2">
        <span className="font-medium text-ocean-600">In the shop: </span>
        {vuln.shopperExperience}
      </p>
      <p className="text-xs text-ocean-500 mt-1">
        <span className="font-medium text-ocean-600">Try it: </span>
        {vuln.manualTry}
      </p>
      {runnable.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {runnable.map((poc) => (
            <button
              key={poc.id}
              type="button"
              disabled={running != null}
              onClick={() => onRunPoc(poc)}
              className="btn-secondary text-[11px] px-2.5 py-1 disabled:opacity-40"
            >
              {running === poc.id ? "Running…" : `Auto-run: ${poc.title}`}
            </button>
          ))}
        </div>
      )}
    </article>
  );
}

export default function ShopVulnMap({
  pocById,
  onRunPoc,
  running,
}: {
  pocById: Map<string, SecurityPoc>;
  onRunPoc: (poc: SecurityPoc) => void;
  running: string | null;
}) {
  return (
    <div className="space-y-8">
      <p className="text-sm text-ocean-600 leading-relaxed">
        Like DVWA, but you can actually buy a board. Every storefront area has an intentional
        weakness — shoppers use the normal site; this map shows what is wrong where. Use{" "}
        <strong className="font-medium text-ocean-800">Attack stories</strong> below to auto-run
        full chains.
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
                  pocById={pocById}
                  onRunPoc={onRunPoc}
                  running={running}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
