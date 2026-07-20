"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ShopVulnMap from "@/components/ShopVulnMap";
import {
  FEATURED_WALKTHROUGHS,
  SHOP_VULNERABILITIES,
  vulnById,
} from "@/lib/shopVulnerabilities";

interface PostureData {
  application: string;
  environment: string;
  deployment_id: string;
  compute: string;
  attack_surface: {
    public: Array<{ path: string; note: string }>;
    private: Array<{ path: string; note: string }>;
    external: string[];
    secrets: string[];
  };
  findings: {
    exploit_lab_enabled: boolean;
    gcp_runtime: boolean;
    function_enabled: boolean;
    eicar_present: boolean;
    is_local: boolean;
    cspm_misconfigurations: Array<{
      id: string;
      finding: string;
      severity: string;
      active: boolean;
      trigger: string;
    }>;
    active_cves: Array<{
      cve: string;
      package: string;
      severity: string;
      service: string;
      active: boolean;
      exploitable: boolean;
    }>;
    iam_misconfigurations: Array<{
      role: string;
      finding: string;
      details: string;
      severity: string;
      active: boolean;
      trigger: string;
    }>;
  };
}

function Severity({ level }: { level: string }) {
  const colors: Record<string, string> = {
    Critical: "text-coral-700",
    High: "text-amber-700",
    Medium: "text-yellow-700",
    Info: "text-ocean-500",
  };
  return <span className={`text-xs font-medium ${colors[level] || "text-ocean-600"}`}>{level}</span>;
}

type LabView = "walkthrough" | "guides" | "posture";

export default function SecurityPage() {
  const [posture, setPosture] = useState<PostureData | null>(null);
  const [labView, setLabView] = useState<LabView>("walkthrough");
  const [selectedId, setSelectedId] = useState<string | null>(
    SHOP_VULNERABILITIES[0]?.id ?? null
  );
  const [guideId, setGuideId] = useState(FEATURED_WALKTHROUGHS[0]?.id ?? "container");
  const [showDetails, setShowDetails] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/security/posture");
    if (res.ok) setPosture(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!posture) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-ocean-500">
        Loading walkthrough…
      </div>
    );
  }

  const { findings } = posture;
  const activeCspm = findings.cspm_misconfigurations.filter((m) => m.active);
  const activeIam = findings.iam_misconfigurations.filter((m) => m.active && m.severity !== "Info");
  const shopVulnCount = SHOP_VULNERABILITIES.length;
  const activeGuide =
    FEATURED_WALKTHROUGHS.find((g) => g.id === guideId) ?? FEATURED_WALKTHROUGHS[0];

  const labViews: Array<{ id: LabView; label: string }> = [
    { id: "walkthrough", label: "Walkthrough" },
    { id: "guides", label: "Suggested order" },
    { id: "posture", label: "Cloud posture" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-teal-700">
          Presenter checklist
        </p>
        <h1 className="font-display text-3xl font-bold text-ocean-900 mt-1">
          Manual walkthroughs
        </h1>
        <p className="mt-3 text-ocean-600 leading-relaxed max-w-2xl">
          Auto PoCs muddied detections. Use this page as a checklist only — open each shop feature,
          walk one item at a time, then wait for Upwind before the next. No requests are fired from
          here.
        </p>
        <p className="mt-3 text-sm text-ocean-500">
          <span className="font-medium text-ocean-700">{posture.compute}</span>
          <span className="mx-1.5">·</span>
          {posture.environment}
          <span className="mx-1.5">·</span>
          {posture.application}
        </p>
      </header>

      <div className="flex flex-wrap gap-1 border-b border-ocean-200 mb-8">
        {labViews.map((view) => (
          <button
            key={view.id}
            type="button"
            onClick={() => setLabView(view.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              labView === view.id
                ? "border-ocean-900 text-ocean-900"
                : "border-transparent text-ocean-500 hover:text-ocean-800"
            }`}
          >
            {view.label}
          </button>
        ))}
      </div>

      {labView === "walkthrough" && (
        <section className="mb-10">
          <div className="flex flex-wrap gap-6 mb-6 pb-4 border-b border-ocean-100">
            <div>
              <p className="text-2xl font-display font-bold text-ocean-900">{shopVulnCount}</p>
              <p className="text-xs text-ocean-500 mt-0.5">Items to walk</p>
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-ocean-900">1</p>
              <p className="text-xs text-ocean-500 mt-0.5">At a time</p>
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-ocean-900">0</p>
              <p className="text-xs text-ocean-500 mt-0.5">Auto-run requests</p>
            </div>
          </div>
          <ShopVulnMap
            selectedId={selectedId}
            onSelect={(id) => setSelectedId(id || null)}
          />
        </section>
      )}

      {labView === "guides" && (
        <section className="mb-10">
          <h2 className="font-display text-xl font-bold text-ocean-900 mb-1">Suggested order</h2>
          <p className="text-sm text-ocean-600 mb-6">
            Grouped sequences for a demo. Still manual — expand an item, follow steps in the shop,
            pause between groups so Process / AI / Cloud findings do not collide.
          </p>

          <div className="grid sm:grid-cols-2 gap-3 mb-8">
            {FEATURED_WALKTHROUGHS.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => setGuideId(group.id)}
                className={`text-left rounded-xl border p-4 transition ${
                  guideId === group.id
                    ? "border-ocean-400 bg-ocean-50"
                    : "border-ocean-100 bg-ocean-50/50 hover:border-ocean-200"
                }`}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-ocean-500">
                  {group.label}
                </p>
                <p className="font-display font-bold text-ocean-900 mt-1">{group.headline}</p>
                <p className="text-xs text-ocean-600 mt-1">{group.description}</p>
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {activeGuide.vulnIds.map((id, index) => {
              const vuln = vulnById(id);
              if (!vuln) return null;
              return (
                <article
                  key={id}
                  className="rounded-xl border border-ocean-100 bg-white p-5"
                >
                  <div className="flex flex-wrap items-baseline gap-2 mb-2">
                    <span className="text-[11px] font-mono text-ocean-400">
                      {index + 1}/{activeGuide.vulnIds.length}
                    </span>
                    <h3 className="font-medium text-ocean-900">{vuln.title}</h3>
                    <span className="text-[10px] font-mono text-ocean-500">{vuln.tag}</span>
                  </div>
                  <ol className="space-y-2 mb-3">
                    {vuln.walkthrough.map((step, i) => (
                      <li key={i} className="flex gap-2 text-sm text-ocean-700 leading-relaxed">
                        <span className="font-mono text-ocean-400 shrink-0">{i + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="text-xs text-ocean-500 mb-3">
                    <span className="font-medium text-ocean-700">Look for: </span>
                    {vuln.lookFor}
                  </p>
                  {vuln.openPath && (
                    <Link
                      href={vuln.openPath}
                      className="btn-secondary text-xs px-3 py-1.5"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open {vuln.openPath} →
                    </Link>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {labView === "posture" && (
        <section className="mb-10">
          <h2 className="font-display text-xl font-bold text-ocean-900 mb-1">Cloud posture</h2>
          <p className="text-sm text-ocean-600 mb-5">
            CSPM, IAM, and CVE findings scanners should already see — before any walkthrough.
          </p>

          <div className="flex items-end justify-between gap-4 border-b border-ocean-100 pb-4 mb-5">
            <div className="flex gap-8">
              <div>
                <p className="text-2xl font-display font-bold text-ocean-900">
                  {findings.active_cves.length}
                </p>
                <p className="text-xs text-ocean-500 mt-0.5">Active CVEs</p>
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-ocean-900">{activeCspm.length}</p>
                <p className="text-xs text-ocean-500 mt-0.5">CSPM</p>
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-ocean-900">{activeIam.length}</p>
                <p className="text-xs text-ocean-500 mt-0.5">Identity risks</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              className="text-xs font-medium text-ocean-600 hover:text-ocean-900 shrink-0"
            >
              {showDetails ? "Hide details" : "Show details"}
            </button>
          </div>

          {showDetails ? (
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ocean-500 mb-2">
                  CVEs
                </h3>
                {findings.active_cves.map((c) => (
                  <div key={c.cve + c.service} className="flex justify-between gap-2 py-1.5 text-sm">
                    <span>
                      <span className="font-mono">{c.cve}</span>
                      <span className="text-ocean-500 text-xs ml-2">
                        {c.package} · {c.service}
                      </span>
                    </span>
                    <Severity level={c.severity} />
                  </div>
                ))}
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ocean-500 mb-2">
                  CSPM
                </h3>
                {findings.cspm_misconfigurations
                  .filter((m) => m.active)
                  .map((m) => (
                    <p key={m.id} className="text-sm text-ocean-800 py-1">
                      {m.finding} <Severity level={m.severity} />
                    </p>
                  ))}
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ocean-500 mb-2">
                  Identity
                </h3>
                {findings.iam_misconfigurations
                  .filter((m) => m.active && m.severity !== "Info")
                  .map((m, i) => (
                    <p key={`${m.role}-${i}`} className="text-sm text-ocean-800 py-1">
                      <span className="font-mono text-xs">{m.role}</span> — {m.finding}
                    </p>
                  ))}
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ocean-500 mb-2">
                  Public attack surface
                </h3>
                <ul className="space-y-1">
                  {posture.attack_surface.public.map((ep) => (
                    <li key={ep.path} className="text-xs">
                      <code className="font-mono text-ocean-800">{ep.path}</code>
                      <span className="text-ocean-500"> — {ep.note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ocean-500">
              CVE, CSPM, IAM, and public endpoint inventory — click Show details above.
            </p>
          )}
        </section>
      )}

      <div className="text-center">
        <Link href="/shop" className="btn-secondary text-sm">
          Back to Shop
        </Link>
      </div>
    </div>
  );
}
