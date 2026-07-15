import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { USER_COOKIE, decodeSession } from "@/lib/userSession";

const CHAT_URL = process.env.CHAT_SERVICE_URL || "http://localhost:8001";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const jar = await cookies();
    const user = decodeSession(jar.get(USER_COOKIE)?.value);

    const payload = {
      ...body,
      ...(user
        ? {
            user_email: user.email,
            user_name: user.name,
            user_role: user.role,
          }
        : {}),
    };

    const res = await fetch(`${CHAT_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { detail: "Chat service unavailable. Is it running on port 8001?" },
      { status: 503 }
    );
  }
}
