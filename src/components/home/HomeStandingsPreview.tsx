import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import {
  branchSubtext,
  formatHeroMetric,
  getRoundViewConfig,
  participantDisplayName,
} from "@/lib/leaderboard-display";
import type { CompetitionMapConfig } from "@/lib/competition-map";
import {
  getBranchCount,
  getLatestPublishedRoundNumber,
  getLastPublishedAt,
  getPublishedStandings,
  getSeasonBySlug,
} from "@/lib/data/queries";
import { getMilestoneMeta } from "@/lib/competition-map";
import {
  parsePublicStandingsPath,
  resolvePublicStandingsHref,
} from "@/lib/public-standings-route";
import {
  buildScopeLabel,
  resolveArenaHref,
  resolveFullBoardCta,
} from "@/lib/full-board-cta";
import { branchCountLabel } from "@/lib/branch-targets";
import { REGION_LABELS, SCORING_CONFIG } from "@/lib/scoring-config";
import { isSupabaseConfigured } from "@/lib/supabase/server";

const PREVIEW_ROWS = 5;

interface Props {
  mapConfig: CompetitionMapConfig;
}

export async function HomeStandingsPreview({ mapConfig: config }: Props) {
  const meta = getMilestoneMeta(config.milestoneId);
  const standingsHref = resolvePublicStandingsHref(config);
  const { seasonSlug, region } = parsePublicStandingsPath(standingsHref);
  const seasonConfig = SCORING_CONFIG[seasonSlug];
  const branchCount = await getBranchCount();
  const scopeLabel = buildScopeLabel(branchCount, branchCountLabel);

  let rows: Awaited<ReturnType<typeof getPublishedStandings>> = [];
  let latestRound = 0;
  let lastPublished: string | null = null;
  let fullBoardHref = standingsHref;

  let junePublishedRound = 0;
  if (isSupabaseConfigured()) {
    const season = await getSeasonBySlug(seasonSlug);
    if (season) {
      latestRound = await getLatestPublishedRoundNumber(season.id);
      lastPublished = await getLastPublishedAt(season.id);
      if (region || seasonSlug === "august_finals") {
        rows = await getPublishedStandings(season.id, region);
      }
      fullBoardHref = resolveArenaHref(seasonSlug, latestRound, region);
    }
    const juneSeason = await getSeasonBySlug("june_area");
    if (juneSeason) {
      junePublishedRound = await getLatestPublishedRoundNumber(juneSeason.id);
    }
  }

  const { href: ctaHref, ctaLine, subtitle: ctaSubtitle } = resolveFullBoardCta(
    config.milestoneId,
    junePublishedRound,
    scopeLabel
  );

  const preview = rows.slice(0, PREVIEW_ROWS);
  const roundView = getRoundViewConfig(seasonSlug, latestRound, region);
  const regionLine =
    region && seasonSlug !== "august_finals"
      ? REGION_LABELS[region]
      : seasonSlug === "august_finals"
        ? "Finals"
        : null;

  return (
    <section className="sd-neon-panel space-y-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sd-glow">
            The arena
          </p>
          <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">
            Live ranks
          </h2>
          <p className="mt-1 text-sm text-sd-muted">
            {seasonConfig.name}
            {regionLine ? ` · ${regionLine}` : ""} — {meta.label}
          </p>
          {branchCount > 0 && (
            <p className="mt-1 text-xs text-sd-muted/70">
              {branchCount} branches competing
            </p>
          )}
          {lastPublished && (
            <p className="mt-1 text-xs text-sd-muted/70">
              Last updated{" "}
              {new Date(lastPublished).toLocaleString("en-PH", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          )}
        </div>
        <Link
          href={ctaHref}
          className="sd-btn-primary flex flex-col items-end gap-0.5 rounded-xl px-4 py-2.5 text-sm"
        >
          <span>{ctaLine} →</span>
          <span className="text-[10px] font-normal opacity-90">{ctaSubtitle}</span>
        </Link>
      </div>

      {preview.length === 0 ? (
        <div className="sd-glass rounded-xl px-4 py-6 text-center text-sm text-sd-muted">
          {latestRound === 0
            ? "Round 1 kicks off soon — the leaderboard opens after the first publish."
            : "The board is warming up — check back after the next round drops."}
        </div>
      ) : (
        <div className="sd-glass-strong overflow-hidden rounded-xl">
          <ul className="divide-y divide-emerald-500/10">
            {preview.map((row) => (
              <li
                key={row.branch_id}
                className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-950/80 text-xs font-bold text-sd-glow">
                    {row.rank}
                  </span>
                  <div className="min-w-0">
                    <span className="block truncate font-medium text-white">
                      {participantDisplayName(row)}
                    </span>
                    <span className="block truncate text-xs text-sd-muted/70">
                      {branchSubtext(row)}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {latestRound > 0 && (
                    <span className="text-xs font-semibold tabular-nums text-sd-glow">
                      {formatHeroMetric(row, roundView, seasonSlug)}
                    </span>
                  )}
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
          {rows.length > PREVIEW_ROWS && (
            <p className="border-t border-emerald-500/10 px-4 py-2 text-center text-xs text-sd-muted">
              Top {PREVIEW_ROWS} of {rows.length} —{" "}
              <Link href={fullBoardHref} className="sd-link">
                see the full arena
              </Link>
            </p>
          )}
        </div>
      )}
    </section>
  );
}
