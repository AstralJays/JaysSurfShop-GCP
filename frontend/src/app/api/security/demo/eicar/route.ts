import { NextResponse } from "next/server";
import { proxyOrderWebhook } from "@/lib/orderWebhook";

export async function GET() {
  const res = await proxyOrderWebhook("/demo/eicar");
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    data = { detail: await res.text() };
  }
  return NextResponse.json(data, { status: res.status });
}
