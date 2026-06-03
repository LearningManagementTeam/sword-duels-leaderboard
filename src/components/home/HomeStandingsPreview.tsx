import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { HomeSponsorLogoSection } from "@/components/home/HomeSponsorLogoSection";
import {
  branchSubtext,
  formatHeroMetric,
  getRoundViewConfig,
  participantDisplayName,
} from "@/lib/leaderboard-display";
import type { BrandingConfig } from "@/lib/branding";
import type { CompetitionMapConfig } from "@/lib/competition-map";
import {
  getBranchCount,
  getLatestPublishedRoundNumber,
  getLastPublishedAt,
  getPublishedStandings,
  getSeasonBySlug,
} from "@/lib/data/queries";
import {
  buildHomeArenaHeadline,
  regionalBoardLinks,
  resolveHomeStandingsCta,
  seasonSlugToPhase,
} from "@/lib/home-standings-display";
import {
  buildScopeLabel,
  resolveArenaHref,
} from "@/lib/full-board-cta";
import { branchCountLabel } from "@/lib/branch-targets";
import {
  parsePublicStandingsPath,
  resolvePublicStandingsHref,
} from "@/lib/public-standings-route";
import { REGIONS, REGION_LABELS, SCORING_CONFIG, type Region, type SeasonSlug } from "@/lib/scoring-config";
import type { StandingRow } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/server";

interface Props {
  mapConfig: CompetitionMapConfig;
  branding: BrandingConfig;
}

type PreviewRow = {
  region: Region | null;
  row: StandingRow;
};

async function loadHomePreviewRows(
  seasonId: string,
  seasonSlug: SeasonSlug,
  latestRound: number
): Promise<PreviewRow[]> {
  if (latestRound === 0) return [];

  if (seasonSlug === "august_finals") {
    const rows = await getPublishedStandings(seasonId);
    return rows.slice(0, 3).map((row) => ({ region: null, row }));
  }

  const leaders = await Promise.all(
    REGIONS.map(async (region) => {
      const rows = await getPublishedStandings(seasonId, region);
      const leader = rows[0];
      return leader ? { region, row: leader } : null;
    })
  );

  return leaders.filter(
    (entry): entry is { region: Region; row: StandingRow } => entry != null
  );
}

export async function HomeStandingsPreview({
  mapConfig: config,
  branding,
}: Props) {
  const standingsHref = resolvePublicStandingsHref(config);
  const { seasonSlug } = parsePublicStandingsPath(standingsHref);
  const branchCount = await getBranchCount();
  const scopeLabel = buildScopeLabel(branchCount, branchCountLabel);

  let previewRows: PreviewRow[] = [];
  let latestRound = 0;
  let lastPublished: string | null = null;
  let fullBoardHref = standingsHref;

  let junePublishedRound = 0;
  if (isSupabaseConfigured()) {
    const season = await getSeasonBySlug(seasonSlug);
    if (season) {
      latestRound = await getLatestPublishedRoundNumber(season.id);
      lastPublished = await getLastPublishedAt(season.id);
      previewRows = await loadHomePreviewRows(season.id, seasonSlug, latestRound);
      fullBoardHref = resolveArenaHref(seasonSlug, latestRound);
    }
    const juneSeason = await getSeasonBySlug("june_area");
    if (juneSeason) {
      junePublishedRound = await getLatestPublishedRoundNumber(juneSeason.id);
    }
  }

  const headline = buildHomeArenaHeadline(seasonSlug, latestRound);
  const cta = resolveHomeStandingsCta(
    config.milestoneId,
    junePublishedRound,
    scopeLabel
  );
  const regionLinks = regionalBoardLinks(seasonSlug);
  const roundView = getRoundViewConfig(seasonSlug, latestRound);
  const phase = seasonSlugToPhase(seasonSlug);

  return (
    <section className="sd-neon-panel overflow-hidden p-6 sm:p-8">
      <div className="mb-6 sm:mb-8">
        <HomeSponsorLogoSection branding={branding} />
      </div>
      <div className="mx-auto max-w-3xl space-y-6 text-center">
        <header className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-sd-glow/90">
            The arena
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Live ranks
            </h2>
            <span className="rounded-full bg-gradient-to-r from-sd-lime/20 to-emerald-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sd-glow ring-1 ring-emerald-400/30">
              {headline.phaseLabel}
            </span>
          </div>
          <p className="text-base font-medium text-white">{headline.roundLine}</p>
          {headline.mechanicsLine && (
            <p className="text-sm text-sd-muted">{headline.mechanicsLine}</p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-sd-muted/80">
            <span>{headline.scopeLine}</span>
            {branchCount > 0 && (
              <>
                <span aria-hidden className="text-sd-muted/40">
                  ·
                </span>
                <span>{branchCount} branches</span>
              </>
            )}
            {lastPublished && (
              <>
                <span aria-hidden className="text-sd-muted/40">
                  ·
                </span>
                <span>
                  Updated{" "}
                  {new Date(lastPublished).toLocaleString("en-PH", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </>
            )}
          </div>
        </header>

        {previewRows.length === 0 ? (
          <div className="sd-glass mx-auto w-full max-w-xl rounded-2xl px-6 py-10">
            <div
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-400/25"
              aria-hidden
            >
              <svg
                className="h-6 w-6 text-sd-glow"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
              >
                <path d="M4 20V10M12 20V4M20 20v-6" />
              </svg>
            </div>
            <p className="text-sm leading-relaxed text-sd-muted">
              {latestRound === 0
                ? "Round 1 kicks off soon. Rankings for Luzon, NCR, and VisMin will appear here after the first publish."
                : "The board is warming up — check back after the next round drops."}
            </p>
          </div>
        ) : (
          <div className="sd-glass-strong mx-auto w-full max-w-xl overflow-hidden rounded-2xl text-left">
            <p className="border-b border-emerald-500/10 px-4 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-sd-muted/70">
              {seasonSlug === "august_finals"
                ? "Top finalists"
                : "Regional leaders"}
            </p>
            <ul className="divide-y divide-emerald-500/10">
              {previewRows.map(({ region, row }) => (
                <li
                  key={region ?? row.branch_id}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-950/80 text-xs font-bold text-sd-glow">
                      {row.rank}
                    </span>
                    <div className="min-w-0">
                      {region && (
                        <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-sd-glow/70">
                          {REGION_LABELS[region]}
                        </span>
                      )}
                      <span className="block truncate font-medium text-white">
                        {participantDisplayName(row)}
                      </span>
                      <span className="block truncate text-xs text-sd-muted/70">
                        {branchSubtext(row)}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs font-semibold tabular-nums text-sd-glow">
                      {formatHeroMetric(row, roundView, seasonSlug)}
                    </span>
                    <StatusBadge
                      status={row.status}
                      eliminatedInRound={row.eliminated_in_round}
                      advancingToRound={row.advancing_to_round}
                      tieBreakerInRound={row.tie_breaker_in_round}
                      manuallyAdvancedAfterRound={
                        row.manually_advanced_after_round
                      }
                    />
                  </div>
                </li>
              ))}
            </ul>
            <p className="border-t border-emerald-500/10 px-4 py-2.5 text-center text-xs text-sd-muted">
              One leader per region —{" "}
              <Link href={fullBoardHref} className="sd-link">
                open the full board
              </Link>
            </p>
          </div>
        )}

        {regionLinks && latestRound > 0 && latestRound < 3 && phase === "june" && (
          <div className="flex flex-wrap justify-center gap-2">
            {regionLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="sd-glass rounded-full px-3.5 py-1.5 text-xs text-sd-muted transition hover:text-sd-glow"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        <div className="mx-auto w-full max-w-md space-y-2 pt-1">
          <Link
            href={cta.href}
            className="sd-btn-primary block w-full rounded-2xl px-6 py-3.5 text-center text-base font-semibold"
          >
            {cta.label} →
          </Link>
          <p className="text-center text-xs text-sd-muted/70">{cta.hint}</p>
        </div>
      </div>
    </section>
  );
}
