import { NextResponse } from "next/server";
import { USER_COOKIE, encodeSession, type ShopUser } from "@/lib/userSession";

const CHAT_URL = process.env.CHAT_SERVICE_URL || "http://localhost:8001";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${CHAT_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    const user = data.user as ShopUser;
    const response = NextResponse.json({ user });
    response.cookies.set(USER_COOKIE, encodeSession(user), {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 8,
    });
    return response;
  } catch {
    return NextResponse.json({ detail: "Auth service unavailable" }, { status: 503 });
  }
}
