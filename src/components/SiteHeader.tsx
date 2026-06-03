import Image from "next/image";
import Link from "next/link";
import type { BrandingConfig } from "@/lib/branding";

interface Props {
  branding: BrandingConfig;
}

export function SiteHeader({ branding }: Props) {
  return (
    <header className="relative border-b border-sd-glow/20 bg-gradient-to-r from-sd-deep via-sd-panel to-sd-deep backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="group flex items-center gap-3">
          {branding.logo_url ? (
            <div className="relative h-10 w-10 shrink-0">
              <Image
                src={branding.logo_url}
                alt={branding.logo_alt}
                fill
                className="object-contain"
                unoptimized={branding.logo_url.endsWith(".svg")}
              />
            </div>
          ) : (
            <span
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-sd-glow/40 bg-emerald-950/50 text-lg ring-1 ring-sd-glow/20"
              aria-hidden
            >
              ⚔
            </span>
          )}
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white group-hover:text-sd-glow">
              {branding.logo_alt}
            </h1>
            <p className="text-xs text-sd-muted">Dynamic Leaderboard · 2026</p>
          </div>
        </Link>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link href="/" className="text-sd-muted hover:text-white">
            Leaderboard
          </Link>
          <Link href="/mechanics" className="text-sd-muted hover:text-sd-glow">
            How it works
          </Link>
          <Link
            href="/preview"
            className="text-sd-muted hover:text-sd-glow"
            title="Sample leaderboards for demos"
          >
            Preview
          </Link>
          <Link
            href="/tv"
            className="text-sd-muted hover:text-white"
            title="TV / fullscreen mode"
          >
            TV mode
          </Link>
          <Link
            href="/admin"
            className="rounded-md bg-sd-panel px-3 py-1.5 text-sd-muted ring-1 ring-sd-glow/20 hover:bg-sd-panel-light hover:text-white"
          >
            Admin
          </Link>
        </div>
      </div>
    </header>
  );
}
