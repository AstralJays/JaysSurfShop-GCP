import { NextResponse } from "next/server";

/** Removed — workshop accounts are listed on /login (page content), not an API */
export async function GET() {
  return NextResponse.json(
    { detail: "Gone", use: "Open /login — workshop accounts are shown on the page" },
    { status: 410 }
  );
}
