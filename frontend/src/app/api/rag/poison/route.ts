import { NextResponse } from "next/server";

/** Removed — use POST /api/community/tips */
export async function POST() {
  return NextResponse.json(
    { detail: "Gone", use: "POST /api/community/tips" },
    { status: 410 }
  );
}
