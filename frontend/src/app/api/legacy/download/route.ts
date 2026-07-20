import { NextResponse } from "next/server";

/** Removed — use GET /api/downloads/asset?name= */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get("file");
  const dest = file
    ? `/api/downloads/asset?name=${encodeURIComponent(file)}`
    : "/api/downloads/asset";
  return NextResponse.json({ detail: "Gone", use: dest }, { status: 410 });
}
