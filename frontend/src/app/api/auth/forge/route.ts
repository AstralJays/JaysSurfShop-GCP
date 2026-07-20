import { NextResponse } from "next/server";
import { USER_COOKIE, encodeSession, type ShopUser } from "@/lib/userSession";

/**
 * Workshop broken auth (API2): mint a signed-looking session cookie with no password.
 * Cookie is unsigned base64 JSON — same as real login.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const name = String(body.name || email || "Forged User").trim();
    const role = String(body.role || "customer").trim() || "customer";
    if (!email || !email.includes("@")) {
      return NextResponse.json({ detail: "email required" }, { status: 400 });
    }

    const user: ShopUser = { email, name, role };
    const response = NextResponse.json({
      user,
      warning: "Workshop: session forged without credentials (unsigned cookie)",
    });
    response.cookies.set(USER_COOKIE, encodeSession(user), {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 8,
    });
    return response;
  } catch {
    return NextResponse.json({ detail: "Invalid forge body" }, { status: 400 });
  }
}
