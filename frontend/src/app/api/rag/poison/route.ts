import { NextResponse } from "next/server";
import { proxyChat } from "@/lib/demoLab";

/**
 * Shop-shaped RAG poison write (LLM04).
 * Same sink as the lab harness, but HTTP looks like /api/rag/* — not /api/security/demo/*.
 */
export async function POST() {
  try {
    const res = await proxyChat("/demo/exploit/ai-poison", { method: "POST" });
    const data = await res.json();
    return NextResponse.json(
      {
        ...data,
        shop_path: "/api/rag/poison",
        narrative:
          data.narrative ||
          "Browser POST /api/rag/poison — unauthenticated vector upsert, then chat retrieval.",
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
