import { NextRequest, NextResponse } from "next/server";
import { proxyChat } from "@/lib/demoLab";

/**
 * Create-A-Board catalog preview — shop-shaped Pillow RCE sink.
 * Proxies to chat-rag POST /catalog/preview (not /demo/exploit/*).
 */
export async function POST(request: NextRequest) {
  let body: unknown = { design: "fish-twin", chain: ["post_rce"] };
  try {
    body = await request.json();
  } catch {
    /* use defaults */
  }

  try {
    const res = await proxyChat("/catalog/preview", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(
      {
        ...data,
        shop_path: "/api/catalog/preview",
      },
      { status: res.status }
    );
  } catch {
    return NextResponse.json(
      { detail: "chat-rag service unavailable" },
      { status: 503 }
    );
  }
}
