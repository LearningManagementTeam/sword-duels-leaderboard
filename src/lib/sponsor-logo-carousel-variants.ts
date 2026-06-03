export type SponsorLogoCarouselVariantId =
  | "slide"
  | "fade"
  | "marquee"
  | "static-row"
  | "scale-fade"
  | "vertical-slide";

export interface SponsorLogoCarouselVariantMeta {
  id: SponsorLogoCarouselVariantId;
  label: string;
  description: string;
  /** Used on home today */
  isProductionDefault?: boolean;
}

export const SPONSOR_LOGO_CAROUSEL_VARIANTS: SponsorLogoCarouselVariantMeta[] =
  [
    {
      id: "slide",
      label: "Slide",
      description:
        "One logo at a time, sliding horizontally every 7 seconds. Pauses on hover. Same pattern as the home photo carousel, scaled down.",
      isProductionDefault: true,
    },
    {
      id: "fade",
      label: "Crossfade",
      description:
        "Logos dissolve into each other in place — no horizontal movement. Calmer and more “broadcast ticker” than carousel.",
    },
    {
      id: "marquee",
      label: "Continuous marquee",
      description:
        "All logos scroll slowly in an infinite loop (duplicated track). Classic sponsor-strip feel; pauses when you hover.",
    },
    {
      id: "static-row",
      label: "Static row",
      description:
        "Every logo visible at once, centered with even spacing. No motion — best when you always want all partners on screen.",
    },
    {
      id: "scale-fade",
      label: "Scale + fade",
      description:
        "Crossfade with a subtle zoom-in on each logo. Slightly more premium / “hero moment” per partner.",
    },
    {
      id: "vertical-slide",
      label: "Vertical slide",
      description:
        "Same timing as Slide, but logos move up instead of sideways. Distinct without changing the compact strip size.",
    },
  ];

export const DEFAULT_SPONSOR_LOGO_VARIANT: SponsorLogoCarouselVariantId = "slide";

export const SPONSOR_LOGO_ROTATE_MS = 7000;
export const SPONSOR_LOGO_TRANSITION_MS = 800;

export const SPONSOR_LOGO_IMG_CLASS =
  "max-h-9 max-w-[140px] object-contain object-center opacity-90 sm:max-h-10 sm:max-w-[160px]";

export const SPONSOR_LOGO_STRIP_CLASS =
  "relative overflow-hidden rounded-xl bg-sd-deep/30 px-4 py-3 ring-1 ring-emerald-500/10";

export const SPONSOR_LOGO_FRAME_H = "h-11 sm:h-12";
