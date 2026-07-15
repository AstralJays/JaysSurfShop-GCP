import { NextResponse } from "next/server";

const CHAT_URL = process.env.CHAT_SERVICE_URL || "http://localhost:8001";

export async function GET() {
  try {
    const res = await fetch(`${CHAT_URL}/auth/demo-accounts`, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ accounts: [], detail: "Auth service unavailable" }, { status: 503 });
  }
}
