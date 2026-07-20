import { NextRequest, NextResponse } from "next/server";
import { proxyChat } from "@/lib/chatProxy";

/** Shop media import — SSRF sink (no URL allowlist on chat-rag). */
export async function POST(request: NextRequest) {
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    /* empty */
  }
  try {
    const res = await proxyChat("/media/fetch", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: "Media service unavailable" }, { status: 503 });
  }
}
