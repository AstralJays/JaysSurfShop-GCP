import { NextResponse } from "next/server";

/** Removed — identity abuse runs post-RCE via POST /api/catalog/preview. */
export async function POST() {
  return NextResponse.json(
    {
      exploited: false,
      error: "demo_api_removed",
      message: "Use POST /api/catalog/preview with chain including iam-abuse / metadata-creds / …",
    },
    { status: 410 }
  );
}
