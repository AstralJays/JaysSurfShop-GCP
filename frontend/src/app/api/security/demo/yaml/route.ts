import { NextResponse } from "next/server";
import { proxyOrderWebhook } from "@/lib/orderWebhook";

export async function POST() {
  try {
    const res = await proxyOrderWebhook("/demo/yaml", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { detail: "Order webhook unavailable" },
      { status: 503 }
    );
  }
}
