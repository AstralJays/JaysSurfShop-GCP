import { NextRequest, NextResponse } from "next/server";
import { proxyChat } from "@/lib/chatProxy";

/**
 * Create-A-Board — deck art preview / validation.
 * Same feature the design UI uses; intentionally vulnerable (Pillow RCE on chat-rag).
 */
export async function POST(request: NextRequest) {
  let body: unknown = { design: "fish-twin", style_notes: "" };
  try {
    body = await request.json();
  } catch {
    /* defaults */
  }

  try {
    const res = await proxyChat("/designs/preview", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { detail: "Design preview unavailable" },
      { status: 503 }
    );
  }
}
