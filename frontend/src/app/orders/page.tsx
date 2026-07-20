"use client";

import Link from "next/link";
import { FormEvent, Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface OrderRow {
  order_id: string;
  customer_name: string;
  board_sku: string;
  payment_status: string;
  order_status: string;
  shipping_address: string;
  email?: string;
}

interface MeUser {
  email: string;
  name: string;
  role: string;
}

function OrdersPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<MeUser | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [lookupEmail, setLookupEmail] = useState("");
  const [bola, setBola] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = useCallback(
    async (emailOverride?: string) => {
      setLoading(true);
      setError("");
      const email = (emailOverride ?? "").trim();
      const qs = email ? `?email=${encodeURIComponent(email)}` : "";
      try {
        const res = await fetch(`/api/orders/mine${qs}`, { credentials: "include" });
        if (res.status === 401) {
          router.replace("/login?next=/orders");
          return;
        }
        const data = await res.json();
        if (!res.ok) {
          setError(data.detail || "Could not load orders");
          setOrders([]);
          return;
        }
        setUser(data.user);
        setOrders(data.orders || []);
        setBola(Boolean(data.bola));
        setLookupEmail(email || data.email || data.user?.email || "");
      } catch {
        setError("Could not load orders");
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    const fromQuery = searchParams.get("email")?.trim() || "";
    if (fromQuery) setLookupEmail(fromQuery);
    void loadOrders(fromQuery || undefined);
    // Initial load only — email query + session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, searchParams]);

  function onLookup(e: FormEvent) {
    e.preventDefault();
    const next = lookupEmail.trim();
    const url = next ? `/orders?email=${encodeURIComponent(next)}` : "/orders";
    router.replace(url);
    void loadOrders(next || undefined);
  }

  if (loading && !user && orders.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-ocean-600 text-sm">Loading your orders…</div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-wider text-ocean-500">Your account</p>
      <h1 className="font-display text-3xl font-bold text-ocean-900 mt-1">Orders</h1>
      {user && (
        <p className="text-ocean-600 text-sm mt-2">
          Signed in as <span className="font-medium text-ocean-800">{user.name}</span> ({user.email})
        </p>
      )}

      {/* Workshop BOLA surface: email is client-controlled and not bound to the session. */}
      <form onSubmit={onLookup} className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="block flex-1 text-sm">
          <span className="text-ocean-700 font-medium">Lookup email</span>
          <input
            value={lookupEmail}
            onChange={(e) => setLookupEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-ocean-200 px-3 py-2 text-sm font-mono"
            placeholder="customer@example.com"
            autoComplete="email"
          />
        </label>
        <button type="submit" className="btn-primary text-sm shrink-0" disabled={loading}>
          {loading ? "Loading…" : "Fetch orders"}
        </button>
      </form>
      {bola && (
        <p className="mt-2 text-xs text-amber-800">
          Showing orders for a different email than your signed-in session.
        </p>
      )}

      {error && (
        <p className="mt-6 rounded-xl border border-coral-200 bg-coral-50 px-4 py-3 text-sm text-coral-800">
          {error}
        </p>
      )}

      {!error && orders.length === 0 && (
        <p className="mt-8 text-sm text-ocean-600">No orders on this account yet.</p>
      )}

      <div className="mt-8 space-y-4">
        {orders.map((order) => {
          const canChange =
            order.payment_status === "PAID" &&
            (order.order_status === "processing" || order.order_status === "ready_to_ship");
          return (
            <div key={order.order_id} className="card p-6 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-ocean-500">Order</p>
                  <p className="font-mono text-lg font-bold text-ocean-900">{order.order_id}</p>
                </div>
                <span className="rounded-full bg-ocean-100 px-3 py-1 text-xs font-semibold text-ocean-800 capitalize">
                  {order.order_status.replace(/_/g, " ")}
                </span>
              </div>
              <dl className="grid sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-ocean-500">Board</dt>
                  <dd className="font-medium text-ocean-900">{order.board_sku}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-ocean-500">Ship to</dt>
                  <dd className="font-medium text-ocean-900">{order.shipping_address}</dd>
                </div>
              </dl>
              {canChange ? (
                <div className="rounded-xl border border-ocean-200 bg-ocean-50/60 p-4 text-sm text-ocean-800">
                  <p className="font-medium text-ocean-900">Need a different shipping address?</p>
                  <p className="mt-1 text-ocean-600">
                    Chat with Maya while signed in — she can update this order for you.
                  </p>
                  <Link
                    href={`/chat?order=${order.order_id}&help=shipping`}
                    className="btn-primary mt-4 inline-flex text-sm"
                  >
                    Update address with Maya
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-ocean-600">
                  This order has already shipped.{" "}
                  <Link href="/chat" className="font-semibold text-ocean-700 hover:underline">
                    Ask Maya
                  </Link>{" "}
                  if you need help.
                </p>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-10 text-xs text-ocean-500 leading-relaxed">
        Tip: sign in as Jordan, ask Maya which longboards are still shipping, then redirect one to
        your address on file.
      </p>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-4 py-10 text-ocean-600 text-sm">Loading your orders…</div>}>
      <OrdersPageInner />
    </Suspense>
  );
}
