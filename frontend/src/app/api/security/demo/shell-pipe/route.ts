import { NextResponse } from "next/server";
import { proxyOrderWebhook } from "@/lib/orderWebhook";

export async function POST() {
  const res = await proxyOrderWebhook("/demo/shell-pipe", {
    method: "POST",
    body: JSON.stringify({}),
  });
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    data = { detail: await res.text() };
  }
  return NextResponse.json(data, { status: res.status });
}
