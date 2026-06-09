import type { Metadata } from "next";
import { FullTournamentBlueprint } from "@/components/tournament/FullTournamentBlueprint";
import { buildNationalCompetitionsBlueprint } from "@/lib/tournament-blueprint";
import { buildSwordDuelsBlueprint } from "@/lib/products/sword-duels/tournament-blueprint";
import { getSiteHomeConfig } from "@/lib/data/content-queries";
import { sdJourneyShortPath } from "@/lib/products/sword-duels/journey-copy";
import { loadPublicJourneyState } from "@/lib/products/sword-duels/public-journey";
import { isRegionalAverageFormat } from "@/lib/products/sword-duels/tournament-format";
import { resolveFeaturedProgram } from "@/lib/site-home-config";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Full tournament journey",
  description:
    "The complete National Competitions and Sword Duels roadmap from opening rounds through the national champion.",
};

export default async function TournamentJourneyPage() {
  const homeConfig = await getSiteHomeConfig();
  const sdJourney = isSupabaseConfigured()
    ? await loadPublicJourneyState().catch(() => null)
    : null;
  const featured = resolveFeaturedProgram(homeConfig, sdJourney);
  const sdFormat = sdJourney?.tournamentFormat ?? "classic_v1";
  const sdPath = sdJourneyShortPath(sdFormat);

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-2">
      <header className="sd-page-header text-center sm:text-left">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-violet-300/80">
          Blueprint
        </p>
        <h1>Full tournament journey</h1>
        <p>
          How the whole season runs — every phase, round, and cut line through
          the national finals. This map does not move with live scores; for
          where the event is right now, check the live season quest on the home
          page.
        </p>
        {sdJourney && (
          <p className="mt-2 text-sm text-cyan-300/80">
            Sword Duels is on{" "}
            {isRegionalAverageFormat(sdFormat) ? "Version 2" : "Version 1"}:{" "}
            {sdPath}
          </p>
        )}
      </header>

      <FullTournamentBlueprint
        nationalCompetitions={buildNationalCompetitionsBlueprint()}
        swordDuels={buildSwordDuelsBlueprint(sdJourney?.tournamentFormat)}
        swordDuelsFormat={sdJourney?.tournamentFormat}
        defaultProgram={featured}
      />
    </div>
  );
}
