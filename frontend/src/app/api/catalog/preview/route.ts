import { NextResponse } from "next/server";

/** Removed — use Create-A-Board POST /api/board/preview */
export async function POST() {
  return NextResponse.json(
    {
      detail: "Gone",
      use: "POST /api/board/preview",
    },
    { status: 410 }
  );
}
