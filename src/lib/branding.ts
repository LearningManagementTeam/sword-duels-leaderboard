export const BRANDING_CONTENT_SLUG = "branding";

export interface BrandingConfig {
  logo_url: string | null;
  logo_alt: string;
}

export const DEFAULT_BRANDING: BrandingConfig = {
  logo_url: null,
  logo_alt: "Sword Duels",
};

export function parseBrandingBody(raw: unknown): BrandingConfig {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_BRANDING };
  const o = raw as Record<string, unknown>;
  return {
    logo_url: typeof o.logo_url === "string" ? o.logo_url : null,
    logo_alt:
      typeof o.logo_alt === "string" && o.logo_alt.trim()
        ? o.logo_alt.trim()
        : DEFAULT_BRANDING.logo_alt,
  };
}

export function branchInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
