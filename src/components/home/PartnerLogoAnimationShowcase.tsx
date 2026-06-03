"use client";

import Link from "next/link";
import { SponsorLogoCarouselVariant } from "@/components/home/SponsorLogoCarouselVariant";
import { SPONSOR_LOGO_CAROUSEL_VARIANTS } from "@/lib/sponsor-logo-carousel-variants";

interface Props {
  logos: string[];
}

export function PartnerLogoAnimationShowcase({ logos }: Props) {
  return (
    <div className="space-y-8">
      {SPONSOR_LOGO_CAROUSEL_VARIANTS.map((meta) => (
        <article
          key={meta.id}
          className={`sd-neon-panel space-y-4 p-5 sm:p-6 ${
            meta.isProductionDefault ? "ring-1 ring-sd-glow/35" : ""
          }`}
        >
          <header className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-white">{meta.label}</h2>
              {meta.isProductionDefault && (
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-100 ring-1 ring-emerald-400/40">
                  Live on home
                </span>
              )}
            </div>
            <p className="text-sm leading-relaxed text-sd-muted">{meta.description}</p>
          </header>
          <SponsorLogoCarouselVariant
            logos={logos}
            variant={meta.id}
            label={`${meta.label} partner logos preview`}
          />
        </article>
      ))}

      <p className="text-center text-xs text-sd-muted/70">
        Temporary comparison page — delete{" "}
        <code className="text-sd-muted">/preview/partner-logo-animations</code>{" "}
        when you pick a style.{" "}
        <Link href="/admin/branding" className="sd-link">
          Admin → Branding
        </Link>
      </p>
    </div>
  );
}
