import { NextResponse } from "next/server";

/** Removed — serverless shell rides on POST /api/checkout (YAML chain). */
export async function POST() {
  return NextResponse.json(
    {
      exploited: false,
      error: "demo_api_removed",
      message: "Use POST /api/checkout with poisoned YAML — shell steps run inside the webhook.",
    },
    { status: 410 }
  );
}
