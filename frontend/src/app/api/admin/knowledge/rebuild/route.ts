import { NextResponse } from "next/server";
import { proxyChat } from "@/lib/chatProxy";

/** Staff: rebuild Maya product knowledge (intentionally weak auth on backend). */
export async function POST() {
  try {
    const res = await proxyChat("/admin/knowledge/rebuild", { method: "POST" });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: "Knowledge service unavailable" }, { status: 503 });
  }
}
