import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { getCompetitionMap } from "@/lib/data/content-queries";
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
import { REGION_LABELS, SCORING_CONFIG } from "@/lib/scoring-config";
import { isSupabaseConfigured } from "@/lib/supabase/server";

const PREVIEW_ROWS = 5;

const juneRegions = [
  { href: "/june/luzon", label: "Luzon" },
  { href: "/june/ncr", label: "NCR" },
  { href: "/june/vismin", label: "VisMin" },
] as const;

const julyRegions = [
  { href: "/july/luzon", label: "Luzon" },
  { href: "/july/ncr", label: "NCR" },
  { href: "/july/vismin", label: "VisMin" },
] as const;

export async function HomeStandingsPreview() {
  const config = await getCompetitionMap();
  const meta = getMilestoneMeta(config.milestoneId);
  const standingsHref = resolvePublicStandingsHref(config);
  const fullBoardHref = "/compare/leaderboard";
  const { seasonSlug, region } = parsePublicStandingsPath(standingsHref);
  const seasonConfig = SCORING_CONFIG[seasonSlug];
  const branchCount = await getBranchCount();

  let rows: Awaited<ReturnType<typeof getPublishedStandings>> = [];
  let latestRound = 0;
  let lastPublished: string | null = null;

  if (isSupabaseConfigured()) {
    const season = await getSeasonBySlug(seasonSlug);
    if (season) {
      latestRound = await getLatestPublishedRoundNumber(season.id);
      lastPublished = await getLastPublishedAt(season.id);
      if (region || seasonSlug === "august_finals") {
        rows = await getPublishedStandings(season.id, region);
      }
    }
  }

  const preview = rows.slice(0, PREVIEW_ROWS);
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
        <Link href={standingsHref} className="sd-btn-primary rounded-xl px-4 py-2.5 text-sm">
          Climb the board →
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
                  <span className="truncate font-medium text-white">
                    {row.branch_name}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-semibold tabular-nums text-sd-glow">
                    {row.total_points}
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

      <div className="flex flex-wrap gap-2 pt-1">
        <span className="w-full text-[10px] font-semibold uppercase tracking-wider text-sd-muted/60">
          Jump to a region
        </span>
        {juneRegions.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="sd-glass rounded-lg px-3 py-1.5 text-xs text-sd-muted hover:text-sd-glow"
          >
            June · {r.label}
          </Link>
        ))}
        {julyRegions.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="sd-glass rounded-lg px-3 py-1.5 text-xs text-sd-muted hover:text-sd-glow"
          >
            July · {r.label}
          </Link>
        ))}
        <Link
          href="/august"
          className="sd-glass rounded-lg px-3 py-1.5 text-xs text-sd-muted hover:text-sd-glow"
        >
          August · Finals
        </Link>
      </div>
    </section>
  );
}
