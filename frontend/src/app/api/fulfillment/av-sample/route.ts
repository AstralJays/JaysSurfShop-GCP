import { NextResponse } from "next/server";
import { proxyOrderWebhook } from "@/lib/orderWebhook";

/** Cloud Run fulfillment — AV test sample attach (EICAR file write). */
export async function POST() {
  try {
    const res = await proxyOrderWebhook("/fulfillment/av-sample", {
      method: "POST",
      body: "{}",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: "Fulfillment service unavailable" }, { status: 503 });
  }
}
