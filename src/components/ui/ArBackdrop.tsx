import { DEFAULT_BACKDROP_PATH, resolveBackdropUrl } from "@/lib/branding";
import type { BrandingConfig } from "@/lib/branding";

/** @deprecated use resolveBackdropUrl — kept for imports */
export const SD_BACKDROP_IMAGE = DEFAULT_BACKDROP_PATH;

interface Props {
  /** Custom upload from Admin → Branding; falls back to bundled default */
  backgroundUrl?: string | null;
  branding?: BrandingConfig | null;
}

export function ArBackdrop({ backgroundUrl, branding }: Props) {
  const src = branding
    ? resolveBackdropUrl(branding)
    : backgroundUrl?.trim() || DEFAULT_BACKDROP_PATH;

  return (
    <div
      className="sd-hud-scan pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-sd-deep" />

      <div
        className="sd-backdrop-photo absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${src})` }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgb(4 26 18 / 0.82) 0%, rgb(4 26 18 / 0.88) 45%, rgb(4 26 18 / 0.92) 100%)",
        }}
      />

      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 20%, rgb(20 83 45 / 0.25), transparent 55%), radial-gradient(ellipse 40% 35% at 100% 90%, rgb(88 28 135 / 0.08), transparent 50%)",
        }}
      />

      <div className="sd-light-streak sd-light-streak--green opacity-40" />
      <div className="sd-light-streak sd-light-streak--magenta opacity-30" />

      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #4ade80 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
    </div>
  );
}
