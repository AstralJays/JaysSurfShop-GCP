import { NextResponse } from "next/server";
import { proxyChat } from "@/lib/demoLab";

/**
 * Shop-shaped AI package / supply-chain probe (LLM03).
 * Avoids /api/security/demo/* so AI SPM sees an application AI route.
 */
export async function POST() {
  try {
    const res = await proxyChat("/ai/packages", {
      method: "POST",
    });
    const data = await res.json();
    return NextResponse.json(
      {
        ...data,
        shop_path: "/api/ai/packages",
        narrative:
          data.narrative ||
          "Browser POST /api/ai/packages — vulnerable AI package exercise on the chat workload.",
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
