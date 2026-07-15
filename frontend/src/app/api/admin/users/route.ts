import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { USER_COOKIE, decodeSession } from "@/lib/userSession";

const CHAT_URL = process.env.CHAT_SERVICE_URL || "http://localhost:8001";

export async function GET() {
  const jar = await cookies();
  const user = decodeSession(jar.get(USER_COOKIE)?.value);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ detail: "Admin only" }, { status: 403 });
  }

  try {
    const res = await fetch(`${CHAT_URL}/admin/users`, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: "Users service unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const jar = await cookies();
  const user = decodeSession(jar.get(USER_COOKIE)?.value);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ detail: "Admin only" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const res = await fetch(`${CHAT_URL}/admin/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: "Users service unavailable" }, { status: 503 });
  }
}
