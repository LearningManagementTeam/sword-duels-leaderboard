/** Whole-site password gate (Option 1). Set SITE_ACCESS_PASSWORD in Vercel to enable. */

export const SITE_ACCESS_COOKIE = "sd_site_access";
const TOKEN_SALT = "sd-site-access-v1";

export function getSiteAccessPassword(): string | undefined {
  const raw = process.env.SITE_ACCESS_PASSWORD?.trim();
  if (!raw) return undefined;
  return raw.replace(/^["']|["']$/g, "");
}

export function isSiteAccessEnabled(): boolean {
  const password = getSiteAccessPassword();
  return Boolean(password && password.length >= 8);
}

export function isSiteAccessExemptPath(pathname: string): boolean {
  if (pathname === "/site-access" || pathname === "/api/site-access") {
    return true;
  }
  if (pathname.startsWith("/_next/")) return true;
  if (pathname === "/favicon.ico") return true;
  if (/\.(svg|png|jpg|jpeg|gif|webp|ico)$/i.test(pathname)) return true;
  return false;
}

/** Prevent open redirects after unlock. */
export function safeSiteAccessReturnTo(value: string | null | undefined): string {
  if (!value) return "/";
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return "/";
  if (trimmed.startsWith("/site-access")) return "/";
  return trimmed;
}

export async function siteAccessTokenForPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(TOKEN_SALT));
  const bytes = new Uint8Array(sig);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

export async function isValidSiteAccessCookie(
  cookieValue: string | undefined
): Promise<boolean> {
  const password = getSiteAccessPassword();
  if (!password || !cookieValue) return false;

  const expected = await siteAccessTokenForPassword(password);
  if (cookieValue.length !== expected.length) return false;

  let diff = 0;
  for (let i = 0; i < cookieValue.length; i++) {
    diff |= cookieValue.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export function passwordsMatch(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
