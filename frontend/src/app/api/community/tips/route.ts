import { NextResponse } from "next/server";
import { proxyChat } from "@/lib/chatProxy";

/** Customer community tip — may be quoted by Maya. */
export async function POST(request: Request) {
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    /* empty */
  }
  try {
    const res = await proxyChat("/community/tips", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: "Tips service unavailable" }, { status: 503 });
  }
}
