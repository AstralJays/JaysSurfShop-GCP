import { NextResponse } from "next/server";

const CHAT_URL = process.env.CHAT_SERVICE_URL || "http://localhost:8001";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${CHAT_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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
