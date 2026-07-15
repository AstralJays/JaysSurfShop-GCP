import { NextResponse } from "next/server";
import { USER_COOKIE } from "@/lib/userSession";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(USER_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return response;
}
