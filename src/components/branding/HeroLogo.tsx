import { BrandingImage } from "@/components/branding/BrandingImage";
import type { BrandingConfig } from "@/lib/branding";
import { HOME_MEDIA_SHELL } from "@/lib/home-media-layout";

interface Props {
  branding: BrandingConfig;
  priority?: boolean;
  tvMode?: boolean;
  /** Home page: match carousel width and keep logo + photos proportional on mobile */
  layout?: "default" | "home";
}

export function HeroLogo({
  branding,
  priority = false,
  tvMode,
  layout = "default",
}: Props) {
  const shellClass =
    layout === "home"
      ? HOME_MEDIA_SHELL
      : `relative mx-auto w-full px-2 ${tvMode ? "max-w-5xl" : "max-w-6xl"}`;

  const heightClass =
    tvMode
      ? "max-h-[min(50vh,360px)]"
      : layout === "home"
        ? "max-h-[min(34vh,200px)] sm:max-h-[min(38vh,260px)] md:max-h-[min(42vh,300px)]"
        : "max-h-[min(42vh,280px)] sm:max-h-[min(44vh,320px)]";

  return (
    <section className={shellClass} aria-label={branding.logo_alt}>
      {branding.logo_url ? (
        <div className={`relative mx-auto w-full sd-hero-glow ${heightClass}`}>
          <BrandingImage
            src={branding.logo_url}
            alt={branding.logo_alt}
            width={1200}
            height={400}
            priority={priority}
            sizes="(max-width: 640px) 96vw, (max-width: 1024px) 90vw, 72rem"
            className="h-auto w-full max-h-[inherit] object-contain"
          />
        </div>
      ) : (
        <div className="sd-neon-panel flex min-h-[140px] flex-col items-center justify-center gap-2 p-8 text-center sm:min-h-[180px]">
          <span className="text-4xl opacity-40" aria-hidden>
            ⚔
          </span>
          <p className="text-lg font-semibold tracking-wide text-sd-muted">
            {branding.logo_alt}
          </p>
          <p className="max-w-sm text-sm text-sd-muted/60">
            Upload your game logo in Admin → Branding. PNG or SVG with a
            transparent background works best.
          </p>
        </div>
      )}
    </section>
  );
}
