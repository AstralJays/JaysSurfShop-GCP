"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  POC_CATEGORIES,
  SECURITY_POCS,
  isPocBlocked,
  type PocCategory,
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

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
        active ? "bg-coral-100 text-coral-800" : "bg-teal-100 text-teal-800"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
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

function PocCard({
  poc,
  blocked,
  running,
  result,
  onRun,
}: {
  poc: SecurityPoc;
  blocked: boolean;
  running: boolean;
  result?: { ok: boolean; data: unknown };
  onRun: () => void;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-ocean-900">{poc.title}</p>
          <p className="text-xs font-mono text-ocean-500">{poc.cve}</p>
          <p className="text-sm text-ocean-700 mt-2">{poc.description}</p>
          <p className="text-xs text-ocean-500 mt-1">
            <span className="font-medium text-ocean-600">Outcome: </span>
            {poc.outcome}
          </p>
          <p className="text-xs text-ocean-500 mt-2">
            <span className="font-medium text-ocean-600">Upwind: </span>
            {poc.upwindPolicies.join(" · ")}
          </p>
        </div>
        <button
          type="button"
          disabled={blocked || running}
          onClick={onRun}
          className="btn-primary text-xs px-4 py-2 disabled:opacity-40 shrink-0"
        >
          {running ? "Running…" : "Run PoC"}
        </button>
      </div>
      {blocked && (
        <p className="text-xs text-ocean-400 mt-2">
          Unavailable in this environment (requires AWS, Lambda, or vulnerable image).
        </p>
      )}
      {result && (
        <pre className="mt-3 text-xs font-mono bg-ocean-50 rounded-lg p-3 overflow-x-auto max-h-48 overflow-y-auto">
          {JSON.stringify(result.data, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function SecurityPage() {
  const [posture, setPosture] = useState<PostureData | null>(null);
  const [results, setResults] = useState<Record<string, { ok: boolean; data: unknown }>>({});
  const [running, setRunning] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PocCategory>("container-runtime");

  const load = useCallback(async () => {
    const res = await fetch("/api/security/posture");
    if (res.ok) setPosture(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pocsByCategory = useMemo(
    () =>
      POC_CATEGORIES.map((cat) => ({
        ...cat,
        pocs: SECURITY_POCS.filter((p) => p.category === cat.id),
      })),
    []
  );

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

  if (!posture) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center text-ocean-500">
        Loading posture…
      </div>
    );
  }

  const { findings } = posture;
  const activeCspm = findings.cspm_misconfigurations.filter((m) => m.active);
  const activeIam = findings.iam_misconfigurations.filter((m) => m.active && m.severity !== "Info");
  const activeCategory = pocsByCategory.find((c) => c.id === activeTab)!;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-ocean-900">
          Security Posture &amp; Monitoring Demo
        </h1>
        <p className="mt-2 text-ocean-600">
          Reference deployment for CSPM, Cloud XDR, container runtime, malware, and AI SPM workshops.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          {[
            { label: "Application", value: posture.application },
            { label: "Environment", value: posture.environment },
            { label: "Deployment", value: posture.deployment_id },
            { label: "Compute", value: posture.compute },
          ].map((m) => (
            <span key={m.label} className="rounded-lg bg-ocean-50 px-3 py-1.5 text-ocean-700">
              <span className="text-ocean-500">{m.label}: </span>
              <span className="font-medium">{m.value}</span>
            </span>
          ))}
        </div>
      </div>

      <section className="card p-5 mb-6">
        <h2 className="font-display text-lg font-bold text-ocean-900 mb-1">CSPM Misconfigurations</h2>
        <p className="text-xs text-ocean-500 mb-4">{activeCspm.length} active in this environment</p>
        <div className="space-y-2">
          {findings.cspm_misconfigurations.map((m) => (
            <div
              key={m.id}
              className="flex items-start justify-between gap-3 py-2 border-b border-ocean-50 last:border-0"
            >
              <div>
                <p className="text-sm text-ocean-900">{m.finding}</p>
                <p className="text-xs text-ocean-500 mt-0.5">{m.trigger}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Severity level={m.severity} />
                <StatusBadge active={m.active} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-5 mb-6">
        <h2 className="font-display text-lg font-bold text-ocean-900 mb-4">Attack Surface Paths</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ocean-500 mb-2">Public</h3>
            <ul className="space-y-1">
              {posture.attack_surface.public.map((ep) => (
                <li key={ep.path} className="text-sm">
                  <code className="font-mono text-ocean-800">{ep.path}</code>
                  <span className="text-ocean-500 text-xs ml-1">— {ep.note}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ocean-500 mb-2">
              Private / internal
            </h3>
            <ul className="space-y-1">
              {posture.attack_surface.private.map((ep) => (
                <li key={ep.path} className="text-sm">
                  <code className="font-mono text-ocean-800">{ep.path}</code>
                  <span className="text-ocean-500 text-xs ml-1">— {ep.note}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="card p-5 mb-6">
        <h2 className="font-display text-lg font-bold text-ocean-900 mb-1">Active CVEs</h2>
        {findings.active_cves.length === 0 ? (
          <p className="text-sm text-ocean-600">None detected</p>
        ) : (
          findings.active_cves.map((c) => (
            <div key={c.cve + c.service} className="flex items-center justify-between gap-3 py-2">
              <div>
                <p className="text-sm font-mono text-ocean-900">{c.cve}</p>
                <p className="text-xs text-ocean-500">
                  {c.package} · {c.service}
                </p>
              </div>
              <Severity level={c.severity} />
            </div>
          ))
        )}
      </section>

      <section className="card p-5 mb-8">
        <h2 className="font-display text-lg font-bold text-ocean-900 mb-1">IAM Misconfigurations</h2>
        <p className="text-xs text-ocean-500 mb-4">
          {activeIam.length} active overprivileged role{activeIam.length !== 1 && "s"}
        </p>
        <div className="space-y-3">
          {findings.iam_misconfigurations.map((m, i) => (
            <div
              key={`${m.role}-${i}`}
              className="flex items-start justify-between gap-3 py-2 border-b border-ocean-50 last:border-0"
            >
              <div>
                <p className="text-sm font-mono text-ocean-800">{m.role}</p>
                <p className="text-sm text-ocean-900">{m.finding}</p>
                <p className="text-xs text-ocean-500">{m.details}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Severity level={m.severity} />
                <StatusBadge active={m.active} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="font-display text-xl font-bold text-ocean-900 mb-1">PoC Attacks</h2>
        <p className="text-sm text-ocean-600 mb-4">
          Organized by Upwind detection domain. Synthetic data only.
        </p>

        <div className="flex flex-wrap gap-2 mb-4 border-b border-ocean-100 pb-1">
          {pocsByCategory.map((cat) => {
            const count = cat.pocs.length;
            const active = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveTab(cat.id)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  active
                    ? "bg-ocean-900 text-white"
                    : "text-ocean-600 hover:bg-ocean-50"
                }`}
              >
                {cat.label}
                <span className={`ml-1.5 text-xs ${active ? "text-ocean-200" : "text-ocean-400"}`}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-ocean-500 mb-4">{activeCategory.blurb}</p>

        <div className="mb-4 rounded-lg bg-ocean-50 px-4 py-3 text-xs text-ocean-700">
          <span className="font-semibold text-ocean-900">Suggested kill chain: </span>
          {activeTab === "container-runtime" &&
            "Pillow RCE → Fargate metadata creds → (switch to Cloud XDR) IAM abuse + S3 exfil"}
          {activeTab === "cloud-xdr" && "Run after container compromise — IAM API abuse then S3 object probe"}
          {activeTab === "malware" && "EICAR file in container + Lambda EICAR/YAML for scanner vs runtime"}
          {activeTab === "ai" && "Unauthenticated chat for AI SPM logs, then reindex for admin abuse"}
        </div>

        <div className="space-y-3">
          {activeCategory.pocs.map((poc) => (
            <PocCard
              key={poc.id}
              poc={poc}
              blocked={isPocBlocked(poc, findings)}
              running={running === poc.id}
              result={results[poc.id]}
              onRun={() => runPoC(poc)}
            />
          ))}
        </div>
      </section>

      <div className="text-center">
        <Link href="/" className="btn-secondary text-sm">
          Back to Shop
        </Link>
      </div>
    </div>
  );
}
