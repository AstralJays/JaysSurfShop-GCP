import { NextResponse } from "next/server";
import { proxyChat } from "@/lib/chatProxy";

/** Shop document download (invoices, wax guides, care sheets). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name") || searchParams.get("file") || "";
  if (!name) {
    return NextResponse.json({ detail: "name required" }, { status: 400 });
  }
  try {
    const res = await proxyChat(
      `/downloads/asset?name=${encodeURIComponent(name)}`,
      { method: "GET" }
    );
    const text = await res.text();
    try {
      return NextResponse.json(JSON.parse(text), { status: res.status });
    } catch {
      return NextResponse.json(
        { detail: text || "Download failed", status: res.status },
        { status: res.status >= 400 ? res.status : 502 }
      );
    }
  } catch {
    return NextResponse.json({ detail: "Download service unavailable" }, { status: 503 });
  }
}
