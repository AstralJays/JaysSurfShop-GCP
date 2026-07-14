import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { STAFF_COOKIE } from "@/lib/staffSession";

export const metadata = {
  title: "Staff sign-in | Jay's Surf Shop",
};

async function signIn(formData: FormData) {
  "use server";
  const jar = await cookies();
  jar.set(STAFF_COOKIE, "1", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    // Demo only — short TTL so the lab doesn't look like lasting auth.
    maxAge: 60 * 60,
  });
  const next = String(formData.get("next") || "/admin");
  redirect(next.startsWith("/") ? next : "/admin");
}

export default async function StaffLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = params.next && params.next.startsWith("/") ? params.next : "/admin";

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <p className="text-xs uppercase tracking-widest text-ocean-500 mb-2">Lab stub</p>
      <h1 className="font-display text-3xl font-bold text-ocean-900">Staff sign-in</h1>
      <p className="mt-3 text-ocean-700 text-sm leading-relaxed">
        Sets a demo cookie so middleware allows <code className="bg-ocean-50 px-1 rounded">/admin</code>.
        Not real identity — only here so middleware auth has something to skip (CVE-2025-29927).
      </p>

      <form action={signIn} className="mt-8 space-y-4">
        <input type="hidden" name="next" value={next} />
        <button
          type="submit"
          className="w-full rounded-md bg-ocean-800 px-4 py-3 text-sm font-medium text-white hover:bg-ocean-900"
        >
          Continue as staff
        </button>
      </form>

      <p className="mt-6 text-xs text-ocean-500">
        Attacker path: hit <code>/admin</code> with{" "}
        <code>x-middleware-subrequest</code> and no cookie — see admin page for curl.
      </p>

      <Link href="/" className="mt-8 inline-block text-sm text-ocean-700 underline underline-offset-2">
        ← Back to shop
      </Link>
    </div>
  );
}
