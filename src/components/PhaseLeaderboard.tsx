import Link from "next/link";
import { Suspense } from "react";
import { PhaseHighlightsCarousel } from "@/components/home/PhaseHighlightsCarousel";
import { StandingsContextBar } from "@/components/nav/StandingsContextBar";
import { PhaseNav } from "@/components/PhaseNav";
import { getPhaseHighlights } from "@/lib/phase-highlights";
import { getRoundViewConfig } from "@/lib/leaderboard-display";
import { LeaderboardSection } from "./LeaderboardSection";
import { PhaseJourneyBar } from "./PhaseJourneyBar";
import { RegionalSnapshotCards } from "./RegionalSnapshotCards";
import { PreviewBanner } from "./PreviewBanner";
import { SetupBanner } from "./SetupBanner";
import {
  getLatestPublishedRoundNumber,
  getLastPublishedAt,
  getPublishedStandings,
  getSeasonBySlug,
} from "@/lib/data/queries";
import { REGION_LABELS } from "@/lib/scoring-config";
import {
  getSurvivorCount,
  SCORING_CONFIG,
  usesPerRoundElimination,
} from "@/lib/scoring-config";
import type { Region, SeasonSlug } from "@/lib/scoring-config";
import type { StandingRow } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/server";

interface Props {
  phase: "june" | "july" | "august";
  slug: SeasonSlug;
  region?: Region;
  demoRows?: StandingRow[];
  isPreview?: boolean;
}

export async function PhaseLeaderboard({
  phase,
  slug,
  region,
  demoRows,
  isPreview = false,
}: Props) {
  const configured = isSupabaseConfigured();
  const season =
    !isPreview && configured ? await getSeasonBySlug(slug) : null;
  const latestPublishedRound =
    season && configured && !isPreview
      ? await getLatestPublishedRoundNumber(season.id)
      : demoRows?.[0]?.latest_published_round ?? 3;

  const rows =
    isPreview && demoRows
      ? demoRows
      : season && configured && (region || slug === "august_finals")
        ? await getPublishedStandings(
            season.id,
            slug === "august_finals" ? undefined : region
          )
        : [];
  const lastPublished =
    !isPreview && season && configured
      ? await getLastPublishedAt(season.id)
      : null;

  const config = SCORING_CONFIG[slug];
  const perRound = usesPerRoundElimination(slug);

  let cutoff = 24;
  let cutLineLabel: string | undefined;

  if (perRound && region && latestPublishedRound > 0) {
    cutoff =
      getSurvivorCount(slug, latestPublishedRound, region) ??
      (slug === "june_area" ? 32 : 4);
    if (latestPublishedRound < config.roundCount) {
      cutLineLabel = `Cut line — top ${cutoff} advance to Round ${latestPublishedRound + 1}`;
    } else if (slug === "june_area") {
      cutLineLabel = `Cut line — top ${cutoff} advance to July`;
    } else {
      cutLineLabel = `Cut line — top ${cutoff} advance to August`;
    }
  } else if (slug === "august_finals") {
    cutoff = 1;
  }

  const basePath = isPreview ? "/preview" : "";
  const needsRegion = (phase === "june" || phase === "july") && perRound;
  const showBoard = !needsRegion || !!region;
  const highlights = getPhaseHighlights(slug);
  const roundView = getRoundViewConfig(slug, latestPublishedRound, region);

  return (
    <div className="space-y-5">
      {isPreview && <PreviewBanner />}

      {!isPreview && !configured && <SetupBanner />}

      {isPreview && (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-white">{config.name}</h2>
            {region && (
              <p className="text-sd-glow">{REGION_LABELS[region]} region</p>
            )}
            <p className="mt-1 text-xs text-sd-muted/60">
              Sample data · {rows.length} branches
            </p>
          </div>
          <PhaseNav active={phase} basePath="/preview" />
        </div>
      )}
      {!isPreview && (
        <StandingsContextBar
          phase={phase}
          region={region}
          latestPublishedRound={latestPublishedRound}
          lastPublished={lastPublished}
          phaseTitle={config.name}
          seasonSlug={slug}
          basePath={basePath}
          showRegions={needsRegion && !!region}
        />
      )}

      {needsRegion && !region && (
        <>
          <PhaseHighlightsCarousel items={highlights} />
          <div className="sd-glass rounded-xl p-4">
            <p className="text-sm font-medium text-white">Choose a region</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["luzon", "ncr", "vismin"] as Region[]).map((r) => (
                <Link
                  key={r}
                  href={`${basePath}/${phase}/${r}`}
                  className="sd-btn-primary rounded-lg px-4 py-2 text-sm"
                >
                  {REGION_LABELS[r]}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      {showBoard && (
        <>
          <Suspense
            fallback={
              <p className="text-sm text-sd-muted/60">Loading leaderboard…</p>
            }
          >
            <LeaderboardSection
              bannerSubtitle={roundView.bannerTagline}
              rows={rows}
              advancementCutoff={cutoff}
              cutLineLabel={cutLineLabel}
              showArea={slug === "june_area"}
              showRegion={false}
              showRepresentatives
              seasonSlug={slug}
              latestPublishedRound={latestPublishedRound}
              region={region}
            />
          </Suspense>

          {!isPreview && ((perRound && region) || slug === "august_finals") ? (
            <details className="sd-glass rounded-xl">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-white [&::-webkit-details-marker]:hidden">
                Round progress &amp; stats
              </summary>
              <div className="space-y-4 border-t border-emerald-500/10 px-4 pb-4 pt-3">
                {perRound && region && (
                  <PhaseJourneyBar
                    seasonSlug={slug}
                    latestPublishedRound={latestPublishedRound}
                    region={region}
                  />
                )}
                {region && rows.length > 0 && (
                  <RegionalSnapshotCards
                    rows={rows}
                    seasonSlug={slug}
                    latestPublishedRound={latestPublishedRound}
                    lastPublished={lastPublished}
                  />
                )}
              </div>
            </details>
          ) : null}
        </>
      )}
    </div>
  );
}
