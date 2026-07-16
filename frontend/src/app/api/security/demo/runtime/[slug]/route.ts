import { NextResponse } from "next/server";

/** Removed — PoCs use shop paths (/api/catalog/preview, /api/chat, …) only. */
export async function POST() {
  return NextResponse.json(
    {
      exploited: false,
      error: "demo_api_removed",
      message:
        "Use real shop sinks from /security (e.g. POST /api/catalog/preview, GET /api/legacy/download). " +
        "/api/security/demo/runtime/* is no longer an attack entrypoint.",
    },
    { status: 410 }
  );
}
