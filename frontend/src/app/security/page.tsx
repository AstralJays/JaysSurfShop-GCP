"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  POC_CATEGORIES,
  SECURITY_POCS,
  getStoriesForCategory,
  isPocBlocked,
  type PocCategory,
  type PocStory,
  type SecurityPoc,
} from "@/lib/securityPocs";

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

function ChainStep({
  poc,
  step,
  totalSteps,
  blocked,
  running,
  result,
  onRun,
}: {
  poc: SecurityPoc;
  step: number;
  totalSteps: number;
  blocked: boolean;
  running: boolean;
  result?: { ok: boolean; data: unknown };
  onRun: () => void;
}) {
  return (
    <div className="rounded-lg border border-ocean-100 bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-ocean-400">
            Step {step}/{totalSteps}
          </p>
          <p className="font-medium text-ocean-900 mt-0.5">{poc.title}</p>
          <p className="text-xs font-mono text-ocean-500">{poc.cve}</p>
          <p className="text-sm text-ocean-600 mt-1.5">{poc.description}</p>
        </div>
        <button
          type="button"
          disabled={blocked || running}
          onClick={onRun}
          className="btn-primary text-xs px-3 py-1.5 disabled:opacity-40 shrink-0"
        >
          {running ? "Running…" : "Run step"}
        </button>
      </div>
      {blocked && (
        <p className="text-xs text-ocean-400 mt-2">Unavailable in this environment.</p>
      )}
      {result && (
        <pre className="mt-2 text-xs font-mono bg-ocean-50 rounded-lg p-2.5 overflow-x-auto max-h-36 overflow-y-auto">
          {JSON.stringify(result.data, null, 2)}
        </pre>
      )}
    </div>
  );
}

function AttackChain({
  story,
  pocById,
  findings,
  running,
  results,
  onRun,
  onRunChain,
  onContinue,
}: {
  story: PocStory;
  pocById: Map<string, SecurityPoc>;
  findings: PostureData["findings"];
  running: string | null;
  results: Record<string, { ok: boolean; data: unknown }>;
  onRun: (poc: SecurityPoc) => void;
  onRunChain: (story: PocStory) => void;
  onContinue?: (tab: PocCategory) => void;
}) {
  const [open, setOpen] = useState(false);
  const storyPocs = story.pocIds
    .map((id) => pocById.get(id))
    .filter((poc): poc is SecurityPoc => poc != null);
  const runnableCount = storyPocs.filter((poc) => !isPocBlocked(poc, findings)).length;

  return (
    <section className="rounded-xl border border-ocean-100 bg-white mb-4 overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-display text-lg font-bold text-ocean-900">{story.title}</h3>
            <p className="text-sm text-ocean-600 mt-1">{story.blurb}</p>
          </div>
          <button
            type="button"
            disabled={running != null || runnableCount === 0}
            onClick={() => onRunChain(story)}
            className="btn-secondary text-xs px-4 py-2 disabled:opacity-40 shrink-0"
          >
            {running && story.pocIds.includes(running)
              ? "Running chain…"
              : `Run attack chain (${runnableCount})`}
          </button>
        </div>

        <div className="mt-4 rounded-lg bg-ocean-50 border border-ocean-100 px-3.5 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-ocean-500 mb-1">
            What this does
          </p>
          <p className="text-sm text-ocean-800 leading-relaxed">{story.underTheHood}</p>
          <p className="text-xs text-ocean-500 mt-2">
            <span className="font-medium text-ocean-600">Detection tip: </span>
            {story.detectionTip}
          </p>
        </div>

        {story.continueIn && onContinue && (
          <button
            type="button"
            onClick={() => onContinue(story.continueIn!.tab)}
            className="text-xs text-teal-700 font-medium mt-3 hover:underline"
          >
            {story.continueIn.label} →
          </button>
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-3 text-xs font-medium text-ocean-600 hover:text-ocean-900"
        >
          {open ? "Hide steps" : `Show ${story.pocIds.length} steps`}
        </button>
      </div>

      {open && (
        <div className="border-t border-ocean-100 bg-ocean-50/40 px-4 sm:px-5 py-3 space-y-2">
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

export default function SecurityPage() {
  const [posture, setPosture] = useState<PostureData | null>(null);
  const [results, setResults] = useState<Record<string, { ok: boolean; data: unknown }>>({});
  const [running, setRunning] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PocCategory>("container");
  const [showDetails, setShowDetails] = useState(false);

  const pocById = useMemo(
    () => new Map(SECURITY_POCS.map((poc) => [poc.id, poc])),
    []
  );

  const activeStories = useMemo(() => getStoriesForCategory(activeTab), [activeTab]);

  const load = useCallback(async () => {
    const res = await fetch("/api/security/posture");
    if (res.ok) setPosture(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function runPoC(poc: SecurityPoc) {
    setRunning(poc.id);
    try {
      const res = await fetch(poc.apiPath, { method: poc.method });
      const data = await res.json();
      setResults((prev) => ({ ...prev, [poc.id]: { ok: res.ok, data } }));
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [poc.id]: { ok: false, data: { error: err instanceof Error ? err.message : "Failed" } },
      }));
    } finally {
      setRunning(null);
    }
  }

  async function runChain(story: PocStory) {
    if (!posture) return;
    for (const pocId of story.pocIds) {
      const poc = pocById.get(pocId);
      if (!poc || isPocBlocked(poc, posture.findings)) continue;
      await runPoC(poc);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  function continueToTab(tab: PocCategory) {
    setActiveTab(tab);
    window.setTimeout(() => {
      document.getElementById("attack-chains")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  if (!posture) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-ocean-500">
        Loading security lab…
      </div>
    );
  }

  const { findings } = posture;
  const activeCspm = findings.cspm_misconfigurations.filter((m) => m.active);
  const activeIam = findings.iam_misconfigurations.filter((m) => m.active && m.severity !== "Info");
  const activeCategory = POC_CATEGORIES.find((c) => c.id === activeTab)!;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-ocean-900">Security lab</h1>
        <p className="mt-2 text-ocean-600">
          Pick a tab, read what the chain does, then run it on the live workloads.
        </p>
        <p className="mt-3 text-sm text-ocean-500">
          <span className="font-medium text-ocean-700">{posture.compute}</span>
          <span className="mx-1.5">·</span>
          {posture.environment}
          <span className="mx-1.5">·</span>
          {posture.application}
        </p>
      </div>

      <section className="rounded-xl border border-ocean-100 bg-white p-4 mb-8">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-2xl font-display font-bold text-ocean-900">{findings.active_cves.length}</p>
            <p className="text-xs text-ocean-500 mt-0.5">Active CVEs</p>
          </div>
          <div>
            <p className="text-2xl font-display font-bold text-ocean-900">{activeCspm.length}</p>
            <p className="text-xs text-ocean-500 mt-0.5">CSPM findings</p>
          </div>
          <div>
            <p className="text-2xl font-display font-bold text-ocean-900">{activeIam.length}</p>
            <p className="text-xs text-ocean-500 mt-0.5">IAM risks</p>
          </div>
        </div>
        {findings.active_cves.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
            {findings.active_cves.slice(0, 6).map((c) => (
              <span
                key={c.cve + c.service}
                className="rounded-md bg-ocean-50 px-2 py-1 text-[11px] font-mono text-ocean-700"
              >
                {c.cve}
              </span>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          className="mt-3 w-full text-xs font-medium text-ocean-600 hover:text-ocean-900"
        >
          {showDetails ? "Hide posture details" : "Show posture details"}
        </button>
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-ocean-100 space-y-5 text-left">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ocean-500 mb-2">CVEs</h3>
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
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ocean-500 mb-2">CSPM</h3>
              {findings.cspm_misconfigurations
                .filter((m) => m.active)
                .map((m) => (
                  <p key={m.id} className="text-sm text-ocean-800 py-1">
                    {m.finding}{" "}
                    <Severity level={m.severity} />
                  </p>
                ))}
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ocean-500 mb-2">IAM</h3>
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
                {posture.attack_surface.public.slice(0, 8).map((ep) => (
                  <li key={ep.path} className="text-xs">
                    <code className="font-mono text-ocean-800">{ep.path}</code>
                    <span className="text-ocean-500"> — {ep.note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      <section id="attack-chains" className="mb-8">
        <h2 className="font-display text-xl font-bold text-ocean-900 mb-1">Attack chains</h2>
        <p className="text-sm text-ocean-600 mb-4">
          Each chain is a sequenced attack path. Read what it does, run the full chain, or expand steps and run one at a time.
        </p>

        <div className="flex flex-wrap gap-2 mb-5">
          {POC_CATEGORIES.map((cat) => {
            const chainCount = getStoriesForCategory(cat.id).length;
            const active = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveTab(cat.id)}
                className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                  active ? "bg-ocean-900 text-white" : "bg-ocean-50 text-ocean-700 hover:bg-ocean-100"
                }`}
              >
                {cat.label}
                <span className={`ml-1.5 text-xs ${active ? "text-ocean-200" : "text-ocean-400"}`}>
                  {chainCount}
                </span>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-ocean-500 mb-4">{activeCategory.blurb}</p>

        {activeStories.map((story) => (
          <AttackChain
            key={story.id}
            story={story}
            pocById={pocById}
            findings={findings}
            running={running}
            results={results}
            onRun={runPoC}
            onRunChain={runChain}
            onContinue={continueToTab}
          />
        ))}
      </section>

      <div className="text-center">
        <Link href="/" className="btn-secondary text-sm">
          Back to Shop
        </Link>
      </div>
    </div>
  );
}
