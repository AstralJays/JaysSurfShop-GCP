import { NextResponse } from "next/server";

/** Lightweight probe for GKE readiness/liveness. */
export async function GET() {
  return NextResponse.json({ ok: true, service: "frontend" });
}
