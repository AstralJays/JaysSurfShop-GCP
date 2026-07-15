"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ShopVulnMap from "@/components/ShopVulnMap";
import {
  FEATURED_STORY_GROUPS,
  SHOP_VULNERABILITIES,
} from "@/lib/shopVulnerabilities";
import {
  POC_CATEGORIES,
  SECURITY_POCS,
  getOrderedStories,
  getStoriesForCategory,
  isPocBlocked,
  type PocCategory,
  type PocStory,
  type SecurityPoc,
  type StoryKind,
} from "@/lib/securityPocs";
import { fireShopTraffic } from "@/lib/shopTraffic";

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
    aws_runtime: boolean;
    lambda_enabled: boolean;
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

function kindLabel(kind: StoryKind, storyIndex?: 1 | 2): string {
  if (kind === "story" && storyIndex) return `Story ${storyIndex}`;
  if (kind === "follow-on") return "Follow-on";
  return "Extra";
}

function ChainStep({
  poc,
  step,
  totalSteps,
  blocked,
  running,
  chainBusy,
  result,
  onRun,
}: {
  poc: SecurityPoc;
  step: number;
  totalSteps: number;
  blocked: boolean;
  running: boolean;
  chainBusy: boolean;
  result?: { ok: boolean; data: unknown };
  onRun: () => void;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-ocean-100 last:border-0">
      <span className="text-[11px] font-mono text-ocean-400 w-8 shrink-0 pt-0.5">
        {step}/{totalSteps}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <p className="font-medium text-ocean-900 text-sm">{poc.title}</p>
          <span className="text-[11px] font-mono text-ocean-400">{poc.cve}</span>
        </div>
        <p className="text-sm text-ocean-600 mt-0.5">{poc.outcome}</p>
        {blocked && (
          <p className="text-xs text-ocean-400 mt-1">Unavailable in this environment.</p>
        )}
        {result && (
          <pre className="mt-2 text-xs font-mono bg-ocean-50 rounded-md p-2.5 overflow-x-auto max-h-32 overflow-y-auto">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        )}
      </div>
      <button
        type="button"
        disabled={blocked || running || chainBusy}
        onClick={onRun}
        className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40 shrink-0"
      >
        {running ? "Running…" : "Run"}
      </button>
    </div>
  );
}

function AttackChain({
  story,
  pocById,
  findings,
  running,
  chainId,
  chainStatus,
  results,
  onRun,
  onRunChain,
  onContinue,
}: {
  story: PocStory;
  pocById: Map<string, SecurityPoc>;
  findings: PostureData["findings"];
  running: string | null;
  chainId: string | null;
  chainStatus: string | null;
  results: Record<string, { ok: boolean; data: unknown }>;
  onRun: (poc: SecurityPoc) => void;
  onRunChain: (story: PocStory) => void;
  onContinue?: (tab: PocCategory) => void;
}) {
  const thisChainRunning = chainId === story.id;
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (thisChainRunning) setOpen(true);
  }, [thisChainRunning]);
  const storyPocs = story.pocIds
    .map((id) => pocById.get(id))
    .filter((poc): poc is SecurityPoc => poc != null);
  const runnableCount = storyPocs.filter((poc) => !isPocBlocked(poc, findings)).length;
  const busy = running != null || chainId != null;

  return (
    <section className="border-b border-ocean-100 py-6 last:border-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ocean-500">
              {kindLabel(story.kind, story.storyIndex)}
            </span>
            <span className="text-[10px] font-mono text-ocean-400">{story.targetResource}</span>
          </div>
          <h3 className="font-display text-xl font-bold text-ocean-900">{story.title}</h3>
          <p className="text-sm text-ocean-700 mt-2 leading-relaxed">{story.blurb}</p>
          <p className="text-xs text-ocean-500 mt-2">
            <span className="font-medium text-ocean-600">Look for: </span>
            {story.lookFor}
          </p>
          {thisChainRunning && chainStatus && (
            <p className="text-xs font-medium text-teal-700 mt-2">{chainStatus}</p>
          )}
        </div>
        <button
          type="button"
          disabled={busy || runnableCount === 0}
          onClick={() => onRunChain(story)}
          className="btn-primary text-xs px-4 py-2 disabled:opacity-40 shrink-0"
        >
          {thisChainRunning ? "Running…" : `Run story (${runnableCount})`}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-xs font-medium text-ocean-600 hover:text-ocean-900"
        >
          {open ? "Hide steps" : `Show ${story.pocIds.length} steps`}
        </button>
        {story.continueIn && onContinue && (
          <button
            type="button"
            onClick={() => onContinue(story.continueIn!.tab)}
            className="text-xs text-teal-700 font-medium hover:underline"
          >
            {story.continueIn.label} →
          </button>
        )}
      </div>

      {open && (
        <div className="mt-3 pl-0 sm:pl-1">
          {story.pocIds.map((pocId, index) => {
            const poc = pocById.get(pocId);
            if (!poc) return null;
            return (
              <ChainStep
                key={poc.id}
                poc={poc}
                step={index + 1}
                totalSteps={story.pocIds.length}
                blocked={isPocBlocked(poc, findings)}
                running={running === poc.id}
                chainBusy={busy}
                result={results[poc.id]}
                onRun={() => onRun(poc)}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

type LabView = "map" | "stories" | "posture";

export default function SecurityPage() {
  const [posture, setPosture] = useState<PostureData | null>(null);
  const [results, setResults] = useState<Record<string, { ok: boolean; data: unknown }>>({});
  const [running, setRunning] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [chainStatus, setChainStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PocCategory>("ai");
  const [labView, setLabView] = useState<LabView>("map");
  const [showDetails, setShowDetails] = useState(false);

  const pocById = useMemo(
    () => new Map(SECURITY_POCS.map((poc) => [poc.id, poc])),
    []
  );

  const load = useCallback(async () => {
    const res = await fetch("/api/security/posture");
    if (res.ok) setPosture(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function runPoC(poc: SecurityPoc, options?: { keepBusy?: boolean }) {
    setRunning(poc.id);
    try {
      let shopTraffic: unknown[] | undefined;
      if (poc.shopTraffic?.length) {
        shopTraffic = await fireShopTraffic(poc.shopTraffic);
      }

      if (poc.shopTrafficOnly) {
        const last = Array.isArray(shopTraffic) ? shopTraffic[shopTraffic.length - 1] : null;
        const data = {
          exploited: true,
          via: "shop-traffic",
          shop_traffic: shopTraffic,
          ...(last && typeof last === "object" && last !== null && "data" in last
            ? { result: (last as { data: unknown }).data }
            : {}),
        };
        setResults((prev) => ({ ...prev, [poc.id]: { ok: true, data } }));
        return;
      }

      const init: RequestInit = {
        method: poc.method,
        credentials: "same-origin",
        headers: {
          ...(poc.body !== undefined ? { "Content-Type": "application/json" } : {}),
          ...poc.headers,
        },
      };
      if (poc.body !== undefined) {
        init.body = JSON.stringify(poc.body);
      }
      const res = await fetch(poc.apiPath, init);
      let data: unknown;
      try {
        data = await res.json();
      } catch {
        data = { error: `Non-JSON response (${res.status})` };
      }
      if (shopTraffic) {
        data =
          data && typeof data === "object"
            ? { ...(data as object), shop_traffic: shopTraffic }
            : { result: data, shop_traffic: shopTraffic };
      }
      setResults((prev) => ({ ...prev, [poc.id]: { ok: res.ok, data } }));
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [poc.id]: { ok: false, data: { error: err instanceof Error ? err.message : "Failed" } },
      }));
    } finally {
      if (!options?.keepBusy) setRunning(null);
    }
  }

  async function sleepWithStatus(totalMs: number, label: string) {
    const started = Date.now();
    while (Date.now() - started < totalMs) {
      const left = Math.max(0, Math.ceil((totalMs - (Date.now() - started)) / 1000));
      setChainStatus(`${label} · next step in ${left}s`);
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  async function runChain(story: PocStory) {
    if (!posture || chainId) return;
    const steps = story.pocIds
      .map((id) => pocById.get(id))
      .filter((poc): poc is SecurityPoc => poc != null && !isPocBlocked(poc, posture.findings));
    if (steps.length === 0) return;

    const gapMs = Math.max(0, (story.stepGapSeconds ?? 2) * 1000);
    setChainId(story.id);
    try {
      for (let i = 0; i < steps.length; i++) {
        const poc = steps[i];
        setChainStatus(`Step ${i + 1}/${steps.length} · ${poc.title}`);
        await runPoC(poc, { keepBusy: true });
        setRunning(null);
        if (i < steps.length - 1 && gapMs > 0) {
          await sleepWithStatus(gapMs, `Step ${i + 1}/${steps.length} done`);
        }
      }
      setChainStatus(`Done · ${steps.length}/${steps.length} steps`);
    } finally {
      setRunning(null);
      setChainId(null);
      window.setTimeout(() => setChainStatus(null), 2500);
    }
  }

  function continueToTab(tab: PocCategory) {
    setLabView("stories");
    setActiveTab(tab);
    window.setTimeout(() => {
      document.getElementById("attack-chains")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  if (!posture) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-ocean-500">
        Loading security workshop…
      </div>
    );
  }

  const { findings } = posture;
  const activeCspm = findings.cspm_misconfigurations.filter((m) => m.active);
  const activeIam = findings.iam_misconfigurations.filter((m) => m.active && m.severity !== "Info");
  const activeCategory = POC_CATEGORIES.find((c) => c.id === activeTab)!;
  const orderedStories = getOrderedStories();
  const shopVulnCount = SHOP_VULNERABILITIES.length;

  const labViews: Array<{ id: LabView; label: string }> = [
    { id: "map", label: "Shop vulnerability map" },
    { id: "stories", label: "Attack stories" },
    { id: "posture", label: "Cloud posture" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-teal-700">
          Security workshop
        </p>
        <h1 className="font-display text-3xl font-bold text-ocean-900 mt-1">
          Jay&apos;s Surf Shop — vulnerable on purpose
        </h1>
        <p className="mt-3 text-ocean-600 leading-relaxed max-w-2xl">
          A real-looking surf store where every area has something misconfigured. Shoppers buy
          boards, design customs, and chat with Maya. This lab auto-runs attack stories so your
          tooling sees the same HTTP as a shopper — <code>/api/chat</code>, <code>/api/checkout</code>,
          <code>/api/legacy/download</code> — not only <code>/api/security/demo/*</code>.
          detections have live signals.
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

      {labView === "map" && (
        <section className="mb-10">
          <div className="flex flex-wrap gap-6 mb-6 pb-4 border-b border-ocean-100">
            <div>
              <p className="text-2xl font-display font-bold text-ocean-900">
                {shopVulnCount}
              </p>
              <p className="text-xs text-ocean-500 mt-0.5">Shop weaknesses</p>
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-ocean-900">8</p>
              <p className="text-xs text-ocean-500 mt-0.5">Storefront areas</p>
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-ocean-900">{orderedStories.length}</p>
              <p className="text-xs text-ocean-500 mt-0.5">Auto-run stories</p>
            </div>
          </div>
          <ShopVulnMap pocById={pocById} onRunPoc={runPoC} running={running} />
        </section>
      )}

      {labView === "stories" && (
        <section id="attack-chains" className="mb-10">
          <h2 className="font-display text-xl font-bold text-ocean-900 mb-1">Attack stories</h2>
          <p className="text-sm text-ocean-600 mb-6">
            Four headline chains — container CVEs, Lambda CVEs, AI hijack, and Cloud XDR — plus an
            OWASP LLM bundle. Each story runs real commands and API calls.
          </p>

          <div className="grid sm:grid-cols-2 gap-3 mb-8">
            {FEATURED_STORY_GROUPS.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => {
                  setActiveTab(group.id);
                  document.getElementById("story-list")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="text-left rounded-xl border border-ocean-100 bg-ocean-50/50 p-4 hover:border-ocean-200 transition"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-ocean-500">
                  {group.label}
                </p>
                <p className="font-display font-bold text-ocean-900 mt-1">{group.headline}</p>
                <p className="text-xs text-ocean-600 mt-1">{group.description}</p>
              </button>
            ))}
          </div>

          <div id="story-list" className="flex flex-wrap gap-1 border-b border-ocean-100 mb-2">
            {POC_CATEGORIES.map((cat) => {
              const active = activeTab === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveTab(cat.id)}
                  className={`px-3 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    active
                      ? "border-ocean-900 text-ocean-900"
                      : "border-transparent text-ocean-500 hover:text-ocean-800"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-ocean-500 mb-2 mt-3">{activeCategory.blurb}</p>

          {getStoriesForCategory(activeTab).map((story) => (
            <AttackChain
              key={story.id}
              story={story}
              pocById={pocById}
              findings={findings}
              running={running}
              chainId={chainId}
              chainStatus={chainStatus}
              results={results}
              onRun={runPoC}
              onRunChain={runChain}
              onContinue={continueToTab}
            />
          ))}
        </section>
      )}

      {labView === "posture" && (
        <section className="mb-10">
          <h2 className="font-display text-xl font-bold text-ocean-900 mb-1">Cloud posture</h2>
          <p className="text-sm text-ocean-600 mb-5">
            CSPM, IAM, and CVE findings your scanners should already see — before you run any
            stories.
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
