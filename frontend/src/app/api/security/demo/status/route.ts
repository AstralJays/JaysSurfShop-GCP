import { NextResponse } from "next/server";
import { proxyChat } from "@/lib/demoLab";

export async function GET() {
  try {
    const res = await proxyChat("/demo/exploit/status");
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { enabled: false, error: "chat-rag service unavailable" },
      { status: 503 }
    );
  }
}
