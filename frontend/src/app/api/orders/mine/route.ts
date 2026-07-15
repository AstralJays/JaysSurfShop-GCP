import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { USER_COOKIE, decodeSession } from "@/lib/userSession";

const CHAT_URL = process.env.CHAT_SERVICE_URL || "http://localhost:8001";

export async function GET() {
  const jar = await cookies();
  const user = decodeSession(jar.get(USER_COOKIE)?.value);
  if (!user) {
    return NextResponse.json({ detail: "Sign in to view your orders" }, { status: 401 });
  }

  try {
    const url = new URL(`${CHAT_URL}/orders/mine`);
    url.searchParams.set("email", user.email);
    const res = await fetch(url.toString(), { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json({ ...data, user }, { status: res.status });
  } catch {
    return NextResponse.json({ detail: "Orders service unavailable" }, { status: 503 });
  }
}
