import { NextResponse } from "next/server";
import { ORDER_WEBHOOK_URL, proxyOrderWebhook } from "@/lib/orderWebhook";

export async function POST(request: Request) {
  const body = await request.json();

  if (!ORDER_WEBHOOK_URL) {
    const orderId = `ORD-LOCAL-${Date.now().toString().slice(-4)}`;
    return NextResponse.json({
      orderId,
      status: "pending",
      message: "Local demo order (checkout webhook not configured)",
      itemCount: body.items?.length ?? 0,
      subtotal: body.subtotal ?? 0,
    });
  }

  try {
    const res = await proxyOrderWebhook("/checkout", {
      method: "POST",
      body: JSON.stringify(body),
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
