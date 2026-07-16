import { NextResponse } from "next/server";

/** Removed — Pillow RCE is POST /api/catalog/preview. */
export async function POST() {
  return NextResponse.json(
    {
      exploited: false,
      error: "demo_api_removed",
      message: "Use POST /api/catalog/preview (Create-A-Board image preview sink).",
    },
    { status: 410 }
  );
}
