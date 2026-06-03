import Image from "next/image";
import type { BrandingConfig } from "@/lib/branding";

interface Props {
  branding: BrandingConfig;
  priority?: boolean;
  tvMode?: boolean;
}

export function HeroLogo({ branding, priority = false, tvMode }: Props) {
  return (
    <section
      className={`relative w-full px-2 ${tvMode ? "max-w-5xl" : "max-w-6xl"} mx-auto`}
      aria-label={branding.logo_alt}
    >
      {branding.logo_url ? (
        <div
          className={`relative mx-auto w-full sd-hero-glow ${
            tvMode ? "max-h-[min(50vh,360px)]" : "max-h-[min(42vh,280px)] sm:max-h-[min(44vh,320px)]"
          }`}
        >
          <Image
            src={branding.logo_url}
            alt={branding.logo_alt}
            width={1200}
            height={400}
            priority={priority}
            sizes="(max-width: 640px) 96vw, (max-width: 1024px) 90vw, 72rem"
            className="h-auto w-full max-h-[inherit] object-contain"
            unoptimized={branding.logo_url.endsWith(".svg")}
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
