import Image from "next/image";
import type { BrandingConfig } from "@/lib/branding";

interface Props {
  branding: BrandingConfig;
  subtitle?: string;
  tvMode?: boolean;
}

export function LeaderboardBanner({ branding, subtitle, tvMode }: Props) {
  return (
    <div
      className={`relative mx-auto w-full max-w-3xl rounded-2xl bg-[var(--sd-surface-light)] px-4 py-4 shadow-lg shadow-emerald-900/30 sm:px-6 sm:py-5 ${
        tvMode ? "max-w-4xl" : ""
      }`}
    >
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-5">
        {branding.logo_url ? (
          <div className="relative h-14 w-14 shrink-0 sm:h-16 sm:w-16">
            <Image
              src={branding.logo_url}
              alt={branding.logo_alt}
              fill
              className="object-contain"
              unoptimized={branding.logo_url.endsWith(".svg")}
            />
          </div>
        ) : (
          <div
            className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg border-2 border-dashed border-emerald-400/50 bg-emerald-50/80 px-1 text-center sm:h-16 sm:w-16"
            title="Upload logo in Admin → Branding"
          >
            <span className="text-[10px] font-medium leading-tight text-emerald-800/70">
              Logo
            </span>
          </div>
        )}
        <div className="flex-1 text-center sm:text-left">
          <h2
            className={`font-bold tracking-wider text-slate-900 ${
              tvMode ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"
            }`}
          >
            LEADERBOARD
          </h2>
          {subtitle && (
            <p
              className={`mt-1 text-slate-600 ${tvMode ? "text-base" : "text-sm"}`}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
