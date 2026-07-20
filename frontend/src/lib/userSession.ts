/** Customer/admin session cookie — workshop demo auth (not production-grade). */
export const USER_COOKIE = "jss_user_session";

export interface ShopUser {
  email: string;
  name: string;
  role: "customer" | "admin" | string;
}

function toBase64Url(raw: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(raw, "utf8").toString("base64url");
  }
  const b64 = btoa(raw);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(raw: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(raw, "base64url").toString("utf8");
  }
  const b64 = raw.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  return atob(b64 + pad);
}

export function encodeSession(user: ShopUser): string {
  return toBase64Url(JSON.stringify(user));
}

export function decodeSession(raw: string | undefined): ShopUser | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(fromBase64Url(raw));
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

/**
 * Workshop intentional weakness: unsigned cookie is JS-readable/writable
 * (httpOnly=false) so a visitor can tamper with it from DevTools / browser PoCs.
 */
export function setBrowserSession(user: ShopUser): void {
  if (typeof document === "undefined") return;
  const value = encodeSession(user);
  document.cookie = `${USER_COOKIE}=${value}; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 8}`;
}
