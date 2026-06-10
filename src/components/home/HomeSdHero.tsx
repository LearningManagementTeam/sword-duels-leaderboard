import Link from "next/link";
import { HomeSponsorLogoSection } from "@/components/home/HomeSponsorLogoSection";
import { SdPublicJourneyBar } from "@/components/sword-duels/SdPublicJourneyBar";
import { SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";
import type { BrandingConfig } from "@/lib/branding";
import type { SdPublicJourneyState } from "@/lib/products/sword-duels/public-journey";
import { sdNationalsTvDefaultView } from "@/lib/products/sword-duels/tournament-format";
import { getSdPublicOverview } from "@/lib/products/sword-duels/public-queries";
import {
  getRecentAreaChampions,
  sdJourneyHeadline,
  sdJourneySubline,
} from "@/lib/products/sword-duels/recent-area-champions";
import type { SiteHomeConfig } from "@/lib/site-home-config";
import { isSupabaseConfigured } from "@/lib/supabase/server";

interface Props {
  branding: BrandingConfig;
  journey: SdPublicJourneyState | null;
  homeConfig: SiteHomeConfig;
}

export async function HomeSdHero({ branding, journey, homeConfig }: Props) {
  const overview =
    isSupabaseConfigured() ? await getSdPublicOverview() : null;

  const recent =
    overview && journey
      ? getRecentAreaChampions(
          overview.brackets,
          overview.sets,
          overview.scoreMap
        )
      : [];

  const headline =
    homeConfig.heroHeadlineOverride ||
    (journey ? sdJourneyHeadline(journey) : "Sword Duels");
  const subline =
    homeConfig.heroSublineOverride ||
    (journey ? sdJourneySubline(journey) : "Area group battles for one representative per area.");

  const progress =
    journey && journey.totalAreas > 0 && !journey.areasComplete
      ? Math.round((journey.areasPublished / journey.totalAreas) * 100)
      : null;

  const nationalsTvView = sdNationalsTvDefaultView(journey?.tournamentFormat);
  const tvHref =
    journey?.nationalsPhase === "knockout" ||
    journey?.nationalsPhase === "regionals" ||
    journey?.areasComplete
      ? `${SWORD_DUELS_PUBLIC}/tv?mode=nationals&view=${nationalsTvView}`
      : `${SWORD_DUELS_PUBLIC}/tv`;

  return (
    <section className="sd-neon-panel overflow-hidden p-6 sm:p-8">
      <div className="mb-6 sm:mb-8">
        <HomeSponsorLogoSection branding={branding} />
      </div>
      <div className="mx-auto max-w-3xl space-y-6 text-center">
        <header className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-300/90">
            Now live · Sword Duels
          </p>
          <h2 className="text-2xl font-bold text-white sm:text-3xl">{headline}</h2>
          <p className="text-base text-sd-muted">{subline}</p>
          {progress != null && (
            <div className="mx-auto max-w-md pt-1">
              <div className="sd-neon-track h-1.5 overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-lime-400 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs tabular-nums text-lime-300/90">
                {progress}% area reps locked
              </p>
            </div>
          )}
        </header>

        {recent.length > 0 ? (
          <div className="sd-glass-strong mx-auto w-full max-w-xl overflow-hidden rounded-2xl text-left">
            <p className="border-b border-emerald-500/10 px-4 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-sd-muted/70">
              Latest area representatives
            </p>
            <ul className="divide-y divide-emerald-500/10">
              {recent.map((row) => (
                <li
                  key={row.area}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <span className="block font-medium text-white">
                      {row.championName}
                    </span>
                    <span className="block text-xs text-sd-muted/70">
                      {row.area}
                    </span>
                  </div>
                  <time
                    dateTime={row.publishedAt}
                    className="shrink-0 text-[10px] text-sd-muted/60"
                  >
                    {new Date(row.publishedAt).toLocaleString("en-PH", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </time>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="sd-glass mx-auto w-full max-w-xl rounded-2xl px-6 py-10">
            <p className="text-sm leading-relaxed text-sd-muted">
              Area battles will appear here as the committee publishes each set.
              Open Sword Duels to follow every area bracket live.
            </p>
          </div>
        )}

        <div className="mx-auto flex w-full max-w-md flex-col gap-2 pt-1 sm:flex-row">
          <Link
            href={SWORD_DUELS_PUBLIC}
            className="sd-btn-primary flex-1 rounded-2xl px-6 py-3.5 text-center text-base font-semibold"
          >
            Open Sword Duels →
          </Link>
          <Link
            href={tvHref}
            className="sd-glass flex-1 rounded-2xl px-6 py-3.5 text-center text-sm font-semibold text-white transition hover:ring-1 hover:ring-cyan-400/30"
          >
            TV view →
          </Link>
        </div>
        {journey && journey.totalAreas > 0 && (
          <SdPublicJourneyBar journey={journey} variant="embedded" />
        )}
      </div>
    </section>
  );
}
