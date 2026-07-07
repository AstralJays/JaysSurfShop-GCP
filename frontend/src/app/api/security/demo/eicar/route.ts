import { NextResponse } from "next/server";
import { proxyOrderWebhook } from "@/lib/orderWebhook";

export async function GET() {
  try {
    const res = await proxyOrderWebhook("/demo/eicar");
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { detail: "Order webhook unavailable" },
      { status: 503 }
    );
  }
}
