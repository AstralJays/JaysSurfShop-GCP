import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { USER_COOKIE, decodeSession } from "@/lib/userSession";

const CHAT_URL = process.env.CHAT_SERVICE_URL || "http://localhost:8001";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // Workshop BOLA (API1): email query trusts the client and is not bound to the session.
  const spoofEmail = searchParams.get("email")?.trim();
  const jar = await cookies();
  const user = decodeSession(jar.get(USER_COOKIE)?.value);

  const email = spoofEmail || user?.email;
  if (!email) {
    return NextResponse.json({ detail: "Sign in to view your orders" }, { status: 401 });
  }

  try {
    const url = new URL(`${CHAT_URL}/orders/mine`);
    url.searchParams.set("email", email);
    // Pass session so chat-rag can emit IDOR File/Process side effects on mismatch.
    if (user?.email) {
      url.searchParams.set("session_email", user.email);
    }
    const res = await fetch(url.toString(), { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(
      {
        ...data,
        user: user || { email, name: "spoofed", role: "customer" },
        bola: Boolean(spoofEmail && (!user || user.email.toLowerCase() !== spoofEmail.toLowerCase())),
      },
      { status: res.status }
    );
  } catch {
    return NextResponse.json({ detail: "Orders service unavailable" }, { status: 503 });
  }
}
