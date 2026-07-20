import { NextResponse } from "next/server";
import { proxyOrderWebhook } from "@/lib/orderWebhook";

/** Cloud Run fulfillment — carrier CLI / shell probe. */
export async function POST() {
  try {
    const res = await proxyOrderWebhook("/fulfillment/carrier-check", {
      method: "POST",
      body: "{}",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: "Fulfillment service unavailable" }, { status: 503 });
  }
}
