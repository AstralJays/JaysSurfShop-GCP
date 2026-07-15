import { NextResponse } from "next/server";
import { proxyChat } from "@/lib/demoLab";

/** Shop-shaped unauthenticated RAG reindex (same sink as chat-rag POST /reindex). */
export async function POST() {
  try {
    const res = await proxyChat("/reindex", { method: "POST" });
    const data = await res.json();
    return NextResponse.json(
      {
        ...data,
        shop_path: "/api/reindex",
        narrative:
          "Browser hit POST /api/reindex — same unauthenticated RAG admin as manual chat-rag /reindex.",
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
