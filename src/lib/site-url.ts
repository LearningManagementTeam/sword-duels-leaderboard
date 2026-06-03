/** Official public leaderboard URL (production). */
export const PRODUCTION_SITE_URL =
  "https://sword-duels-leaderboard.vercel.app";

/**
 * URL for QR codes and sharing. Never use VERCEL_URL — preview deploy URLs
 * often require a Vercel login and break customer QR scans.
 */
export function getPublicSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    return raw.replace(/\/$/, "").replace(/^["']|["']$/g, "");
  }
  return PRODUCTION_SITE_URL;
}
