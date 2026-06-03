export const BRANDING_CONTENT_SLUG = "branding";

/** Default bundled wave art when no custom background is uploaded */
export const DEFAULT_BACKDROP_PATH = "/backgrounds/sd-wave-green.png";

/** Requirements shown in Admin → Branding and enforced on upload */
export const BACKGROUND_UPLOAD_SPECS = {
  maxBytes: 5 * 1024 * 1024,
  maxSizeLabel: "5 MB",
  accept: "image/jpeg,image/png,image/webp",
  mimeTypes: ["image/jpeg", "image/png", "image/webp"] as const,
  recommendedWidth: 1920,
  recommendedHeight: 1080,
  recommendedLabel: "1920 × 1080 (16:9 landscape)",
  minWidth: 1280,
  minHeight: 720,
  minWidthLabel: "1280 × 720 minimum",
  minAspect: 1.2,
  maxAspect: 2.5,
  aspectHint: "Landscape orientation (wider than tall)",
} as const;

export interface BrandingConfig {
  logo_url: string | null;
  logo_alt: string;
  background_url: string | null;
}

export const DEFAULT_BRANDING: BrandingConfig = {
  logo_url: null,
  logo_alt: "Sword Duels",
  background_url: null,
};

export function resolveBackdropUrl(branding: BrandingConfig): string {
  return branding.background_url?.trim() || DEFAULT_BACKDROP_PATH;
}

export function parseBrandingBody(raw: unknown): BrandingConfig {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_BRANDING };
  const o = raw as Record<string, unknown>;
  return {
    logo_url: typeof o.logo_url === "string" ? o.logo_url : null,
    logo_alt:
      typeof o.logo_alt === "string" && o.logo_alt.trim()
        ? o.logo_alt.trim()
        : DEFAULT_BRANDING.logo_alt,
    background_url:
      typeof o.background_url === "string" ? o.background_url : null,
  };
}

export function branchInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
