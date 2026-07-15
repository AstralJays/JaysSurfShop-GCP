import { NextRequest, NextResponse } from "next/server";
import { proxyChat } from "@/lib/demoLab";

/** Shop-shaped path traversal sink (same as chat-rag /legacy/download). */
export async function GET(request: NextRequest) {
  const file = request.nextUrl.searchParams.get("file") || "welcome.txt";
  try {
    const res = await proxyChat(
      `/legacy/download?file=${encodeURIComponent(file)}`
    );
    const data = await res.json();
    return NextResponse.json(
      {
        ...data,
        shop_path: `/api/legacy/download?file=${encodeURIComponent(file)}`,
        narrative:
          data.narrative ||
          "Browser hit GET /api/legacy/download — same path-traversal sink as manual /legacy/download.",
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
