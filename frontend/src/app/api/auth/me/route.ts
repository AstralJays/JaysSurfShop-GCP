import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { USER_COOKIE, decodeSession } from "@/lib/userSession";

export async function GET() {
  const jar = await cookies();
  const user = decodeSession(jar.get(USER_COOKIE)?.value);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user });
}
