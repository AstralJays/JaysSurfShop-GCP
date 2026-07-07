import { NextResponse } from "next/server";
import { proxyChat } from "@/lib/demoLab";

export async function POST() {
  try {
    const res = await proxyChat("/demo/exploit/pillow", { method: "POST" });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { detail: "chat-rag service unavailable" },
      { status: 503 }
    );
  }
}
