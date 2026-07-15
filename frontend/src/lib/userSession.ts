/** Customer/admin session cookie — workshop demo auth (not production-grade). */
export const USER_COOKIE = "jss_user_session";

export interface ShopUser {
  email: string;
  name: string;
  role: "customer" | "admin" | string;
}

export function encodeSession(user: ShopUser): string {
  return Buffer.from(JSON.stringify(user), "utf8").toString("base64url");
}

export function decodeSession(raw: string | undefined): ShopUser | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (!parsed?.email || !parsed?.name) return null;
    return {
      email: String(parsed.email),
      name: String(parsed.name),
      role: String(parsed.role || "customer"),
    };
  } catch {
    return null;
  }
}
