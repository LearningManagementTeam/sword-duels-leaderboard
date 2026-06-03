/** Safe storage object names under the Supabase `branding` bucket. */
const ALLOWED_PATH =
  /^(carousel-[1-4]\.(png|jpe?g|webp)|logo\.(png|jpe?g|webp|svg))$/i;

export function isAllowedBrandingPath(path: string): boolean {
  return ALLOWED_PATH.test(path);
}

/** Public URL on this site — always works even if Supabase bucket is not public. */
export function brandingAssetUrl(
  storagePath: string,
  cacheBust = Date.now()
): string {
  return `/api/branding/storage/${storagePath}?v=${cacheBust}`;
}

export function isBrandingAssetUrl(url: string): boolean {
  return url.startsWith("/api/branding/storage/");
}

/** Skip next/image optimizer for same-origin branding API URLs (dynamic, cache-busted). */
export function shouldUnoptimizeBrandingUrl(url: string): boolean {
  return isBrandingAssetUrl(url) || url.endsWith(".svg");
}

export function extractBrandingStoragePath(url: string): string | null {
  const trimmed = url.trim();
  const apiMatch = trimmed.match(/\/api\/branding\/storage\/([^?#]+)/i);
  if (apiMatch?.[1] && isAllowedBrandingPath(apiMatch[1])) {
    return apiMatch[1];
  }
  const supabaseMatch = trimmed.match(
    /\/storage\/v1\/object\/public\/branding\/([^?#]+)/i
  );
  if (supabaseMatch?.[1] && isAllowedBrandingPath(supabaseMatch[1])) {
    return supabaseMatch[1];
  }
  const shortMatch = trimmed.match(/\/branding\/(carousel-[1-4]\.\w+|logo\.\w+)/i);
  if (shortMatch?.[1] && isAllowedBrandingPath(shortMatch[1])) {
    return shortMatch[1];
  }
  return null;
}

/** Rewrite legacy Supabase URLs to same-origin API URLs when reading from DB. */
export function normalizeBrandingAssetUrl(url: string | null): string | null {
  if (!url?.trim()) return null;
  const path = extractBrandingStoragePath(url);
  if (!path) return url.trim();
  const vMatch = url.match(/[?&]v=(\d+)/);
  const v = vMatch ? Number(vMatch[1]) : Date.now();
  return brandingAssetUrl(path, v);
}

export function mimeForBrandingPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "svg") return "image/svg+xml";
  return "image/jpeg";
}
