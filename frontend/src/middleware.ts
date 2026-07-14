import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { STAFF_COOKIE } from "@/lib/staffSession";

/**
 * CVE-2025-29927 demo gate: auth lives only in middleware.
 * On Next.js < 15.2.3, a spoofed `x-middleware-subrequest` header skips this
 * entirely (recursion-depth / subrequest bypass), so /admin is reachable without
 * the cookie. Patched Next ignores attacker-supplied values.
 */
export function middleware(request: NextRequest) {
  const session = request.cookies.get(STAFF_COOKIE)?.value;
  if (session === "1") {
    return NextResponse.next();
  }

  const login = new URL("/staff-login", request.url);
  login.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
