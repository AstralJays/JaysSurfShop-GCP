import { NextResponse } from "next/server";

/** Removed — use POST /api/admin/knowledge/rebuild */
export async function POST() {
  return NextResponse.json(
    { detail: "Gone", use: "POST /api/admin/knowledge/rebuild" },
    { status: 410 }
  );
}
