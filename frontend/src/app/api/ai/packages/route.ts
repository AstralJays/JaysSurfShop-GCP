import { NextResponse } from "next/server";

/** Removed — LangChain CVEs are SCA on chat-rag; exercise via /api/chat */
export async function POST() {
  return NextResponse.json(
    { detail: "Gone", use: "POST /api/chat (SCA packages are on the chat service image)" },
    { status: 410 }
  );
}
