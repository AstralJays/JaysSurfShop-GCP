"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface DemoAccount {
  email: string;
  name: string;
  role: string;
  demo_password?: string;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/orders";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<DemoAccount[]>([]);

  useEffect(() => {
    fetch("/api/auth/demo-accounts")
      .then((r) => r.json())
      .then((data) => setAccounts(data.accounts || []))
      .catch(() => setAccounts([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Sign-in failed");
        return;
      }
      const dest =
        data.user?.role === "admin" && (!searchParams.get("next") || next === "/orders")
          ? "/admin"
          : next.startsWith("/")
            ? next
            : "/orders";
      router.push(dest);
      router.refresh();
    } catch {
      setError("Could not reach the shop. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function fillAccount(account: DemoAccount) {
    setEmail(account.email);
    setPassword(account.demo_password || "");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <p className="text-xs font-semibold uppercase tracking-wider text-ocean-500">Account</p>
      <h1 className="font-display text-3xl font-bold text-ocean-900 mt-1">Sign in</h1>
      <p className="text-ocean-600 text-sm mt-2 leading-relaxed">
        Use your shop account to track orders and chat with Maya about shipping.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <label className="block text-sm">
          <span className="text-ocean-700 font-medium">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-xl border border-ocean-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400"
            autoComplete="username"
          />
        </label>
        <label className="block text-sm">
          <span className="text-ocean-700 font-medium">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 w-full rounded-xl border border-ocean-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400"
            autoComplete="current-password"
          />
        </label>
        {error && (
          <p className="rounded-lg border border-coral-200 bg-coral-50 px-3 py-2 text-sm text-coral-800">
            {error}
          </p>
        )}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {accounts.length > 0 && (
        <div className="mt-10 rounded-xl border border-dashed border-ocean-200 p-4 text-sm">
          <p className="font-medium text-ocean-900">Workshop demo accounts</p>
          <p className="text-ocean-600 text-xs mt-1 mb-3">
            Click a row to fill the form — passwords live in the users table (intentional lab exposure).
          </p>
          <ul className="space-y-2">
            {accounts.map((a) => (
              <li key={a.email}>
                <button
                  type="button"
                  onClick={() => fillAccount(a)}
                  className="w-full text-left rounded-lg border border-ocean-100 bg-ocean-50/50 px-3 py-2 hover:bg-ocean-50 transition"
                >
                  <span className="font-medium text-ocean-900">{a.name}</span>
                  <span className="ml-2 text-[10px] uppercase tracking-wide text-ocean-500">
                    {a.role}
                  </span>
                  <div className="font-mono text-xs text-ocean-600 mt-0.5">
                    {a.email} · {a.demo_password}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-8 text-sm text-ocean-600">
        Staff middleware demo still at{" "}
        <Link href="/staff-login" className="font-semibold text-ocean-700 hover:underline">
          /staff-login
        </Link>{" "}
        (CVE-2025-29927).
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-12 text-ocean-600">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
