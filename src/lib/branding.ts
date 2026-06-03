import { normalizeBrandingAssetUrl } from "@/lib/branding-storage";

export const BRANDING_CONTENT_SLUG = "branding";

export const CAROUSEL_SLOT_COUNT = 4;

export const CAROUSEL_SLOTS = [1, 2, 3, 4] as const;
export type CarouselSlot = (typeof CAROUSEL_SLOTS)[number];

export const SPONSOR_LOGO_SLOT_COUNT = 3;

export const SPONSOR_LOGO_SLOTS = [1, 2, 3] as const;
export type SponsorLogoSlot = (typeof SPONSOR_LOGO_SLOTS)[number];

export const SPONSOR_LOGO_UPLOAD_SPECS = {
  maxBytes: 1024 * 1024,
  maxSizeLabel: "1 MB per logo",
  accept: "image/png,image/jpeg,image/webp,image/svg+xml",
  /** Target canvas — matches marquee strip (max ~160×40 CSS px). */
  recommendedWidth: 320,
  recommendedHeight: 80,
  recommendedAspect: "4:1",
  recommendedLabel: "320 × 80 px (4:1 wide)",
  emptyPlaceholderLines: [
    "Recommended: 320 × 80 px",
    "Wide PNG or SVG · 4:1 aspect ratio",
    "Use the same height for every logo",
    "Transparent background · max 1 MB",
  ] as const,
} as const;

export const CAROUSEL_UPLOAD_SPECS = {
  maxBytes: 3 * 1024 * 1024,
  maxSizeLabel: "3 MB per photo",
  accept: "image/jpeg,image/png,image/webp",
  recommendedWidth: 1920,
  recommendedHeight: 1080,
  recommendedLabel: "1920 × 1080 (16:9) recommended",
  /** Shown inside empty slot placeholder in Admin → Branding */
  emptyPlaceholderLines: [
    "Recommended: 1920 × 1080",
    "16:9 landscape · JPG, PNG, or WebP",
    "Max 3 MB per photo",
  ] as const,
} as const;

export type CarouselSlides = [
  string | null,
  string | null,
  string | null,
  string | null,
];

export type SponsorLogoSlides = [string | null, string | null, string | null];

export interface BrandingConfig {
  logo_url: string | null;
  logo_alt: string;
  carousel_slides: CarouselSlides;
  sponsor_logos: SponsorLogoSlides;
}

export const DEFAULT_BRANDING: BrandingConfig = {
  logo_url: null,
  logo_alt: "Sword Duels",
  carousel_slides: [null, null, null, null],
  sponsor_logos: [null, null, null],
};

function normalizeCarouselSlides(raw: unknown): CarouselSlides {
  const slots = Array.from(
    { length: CAROUSEL_SLOT_COUNT },
    () => null
  ) as CarouselSlides;
  if (!Array.isArray(raw)) return slots;
  for (let i = 0; i < CAROUSEL_SLOT_COUNT && i < raw.length; i++) {
    const v = raw[i];
    if (typeof v === "string" && v.trim()) {
      slots[i] = normalizeBrandingAssetUrl(v.trim());
    }
  }
  return slots;
}

function normalizeSponsorLogos(raw: unknown): SponsorLogoSlides {
  const slots = Array.from(
    { length: SPONSOR_LOGO_SLOT_COUNT },
    () => null
  ) as SponsorLogoSlides;
  if (!Array.isArray(raw)) return slots;
  for (let i = 0; i < SPONSOR_LOGO_SLOT_COUNT && i < raw.length; i++) {
    const v = raw[i];
    if (typeof v === "string" && v.trim()) {
      slots[i] = normalizeBrandingAssetUrl(v.trim());
    }
  }
  return slots;
}

/** Always persist fixed slot arrays (never truncated JSON). */
export function finalizeBrandingConfig(config: BrandingConfig): BrandingConfig {
  return {
    ...config,
    carousel_slides: normalizeCarouselSlides(config.carousel_slides),
    sponsor_logos: normalizeSponsorLogos(config.sponsor_logos),
  };
}

export function setCarouselSlideUrl(
  slides: CarouselSlides,
  slot: CarouselSlot,
  url: string | null
): CarouselSlides {
  const next = normalizeCarouselSlides(slides);
  next[slot - 1] = url;
  return [...next] as CarouselSlides;
}

export function setSponsorLogoUrl(
  slides: SponsorLogoSlides,
  slot: SponsorLogoSlot,
  url: string | null
): SponsorLogoSlides {
  const next = normalizeSponsorLogos(slides);
  next[slot - 1] = url;
  return [...next] as SponsorLogoSlides;
}

export function parseBrandingBody(raw: unknown): BrandingConfig {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_BRANDING };
  const o = raw as Record<string, unknown>;
  const logoRaw = typeof o.logo_url === "string" ? o.logo_url : null;
  return {
    logo_url: normalizeBrandingAssetUrl(logoRaw),
    logo_alt:
      typeof o.logo_alt === "string" && o.logo_alt.trim()
        ? o.logo_alt.trim()
        : DEFAULT_BRANDING.logo_alt,
    carousel_slides: normalizeCarouselSlides(o.carousel_slides),
    sponsor_logos: normalizeSponsorLogos(o.sponsor_logos),
  };
}

export function getActiveCarouselSlides(
  branding: BrandingConfig
): string[] {
  return branding.carousel_slides.filter(
    (url): url is string => typeof url === "string" && url.length > 0
  );
}

export function getActiveSponsorLogos(branding: BrandingConfig): string[] {
  return branding.sponsor_logos.filter(
    (url): url is string => typeof url === "string" && url.length > 0
  );
}

export function branchInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
