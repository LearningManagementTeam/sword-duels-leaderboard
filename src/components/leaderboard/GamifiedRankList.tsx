"use client";

import { BranchHighlightBlock } from "@/components/BranchHighlight";
import {
  branchSubtext,
  formatHeroMetric,
  participantDisplayName,
  participantInitials,
  resolveCutLineRank,
  type RoundViewConfig,
} from "@/lib/leaderboard-display";
import { StatusBadge } from "@/components/StatusBadge";
import type { StandingRow } from "@/lib/types";
import type { SeasonSlug } from "@/lib/scoring-config";

interface Props {
  rows: StandingRow[];
  advancementCutoff: number;
  cutLineLabel: string;
  highlightCode?: string | null;
  tvMode?: boolean;
  view: RoundViewConfig;
  seasonSlug?: SeasonSlug;
  showRank?: boolean;
  zoneLabel?: string;
}

const rankBadgeColors: Record<number, string> = {
  4: "bg-emerald-600",
  5: "bg-emerald-700",
  6: "bg-fuchsia-700",
  7: "bg-fuchsia-800",
  8: "bg-violet-800",
};

function rankBadgeClass(rank: number): string {
  return rankBadgeColors[rank] ?? "bg-emerald-700";
}

export function GamifiedRankList({
  rows,
  advancementCutoff,
  cutLineLabel,
  highlightCode,
  tvMode,
  view,
  seasonSlug,
  showRank = true,
  zoneLabel,
}: Props) {
  const listRows =
    view.podiumMode === "quiz_score" || view.podiumMode === "finish_order"
      ? rows.filter((r) => r.rank > 3)
      : rows;

  const cutLineRank =
    view.layoutVariant === "quiz_ladder"
      ? resolveCutLineRank(listRows, advancementCutoff, (row) => row.round1_points)
      : advancementCutoff > 0
        ? advancementCutoff + 1
        : null;

  if (listRows.length === 0 && !zoneLabel) return null;

  return (
    <div className="space-y-2">
      {zoneLabel && (
        <p className="text-xs font-bold uppercase tracking-wider text-sd-glow/80">
          {zoneLabel}
        </p>
      )}
      <ul className={`space-y-2 ${tvMode ? "space-y-3" : ""}`}>
        {listRows.map((row) => {
          const showCutLine =
            cutLineRank != null &&
            row.rank === cutLineRank &&
            listRows.some((r) => r.rank < cutLineRank);

          const inZone =
            row.status !== "eliminated" &&
            row.status !== "tie_breaker" &&
            row.rank <= advancementCutoff;

          const hero =
            seasonSlug != null
              ? formatHeroMetric(row, view, seasonSlug)
              : null;
          const eliminatedSub =
            view.layoutVariant === "finish_order_champions" &&
            row.status === "eliminated" &&
            row.round3_points != null &&
            row.round3_points < 5
              ? `${row.round3_points} correct`
              : null;

          return (
            <li key={row.branch_id} className="list-none">
              {showCutLine && (
                <div className="sd-cut-shimmer mb-2 rounded-lg border border-sd-glow/40 bg-emerald-500/10 px-3 py-2 text-center text-xs font-semibold text-sd-glow">
                  {cutLineLabel}
                </div>
              )}
              <BranchHighlightBlock
                branchId={row.branch_id}
                branchCode={row.branch_code}
                highlightCode={highlightCode ?? null}
              >
              <div
                className={`sd-row-hover flex flex-wrap items-center gap-2 rounded-2xl border px-3 py-2 sm:flex-nowrap sm:gap-3 ${
                  tvMode ? "px-4 py-3" : ""
                } ${
                  row.status === "tie_breaker"
                    ? "sd-glass border-fuchsia-400/50 ring-2 ring-fuchsia-400/40"
                    : inZone
                      ? "sd-glass border-emerald-400/40 ring-1 ring-emerald-400/30"
                      : view.layoutVariant === "survival_roster" &&
                          !inZone &&
                          row.round2_points === 0
                        ? "sd-glass border-fuchsia-900/30 opacity-70"
                        : "sd-glass border-emerald-900/20 opacity-85"
                }`}
              >
                {showRank && (
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-bold text-white ${rankBadgeClass(row.rank)} ${
                      tvMode ? "h-10 w-10 text-base" : ""
                    }`}
                  >
                    {row.rank}
                  </span>
                )}
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-950/90 text-xs font-bold text-emerald-100 ring-1 ring-emerald-500/30 ${
                    tvMode ? "h-11 w-11 text-sm" : ""
                  }`}
                >
                  {participantInitials(row)}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate font-semibold text-white ${
                      tvMode ? "text-lg" : "text-sm"
                    }`}
                  >
                    {participantDisplayName(row)}
                  </p>
                  <p className="truncate text-xs text-sd-muted/80">
                    {branchSubtext(row)}
                    {eliminatedSub ? ` · ${eliminatedSub}` : ""}
                  </p>
                </div>
                {hero && view.layoutVariant !== "finish_order_champions" && (
                  <span
                    className={`sd-inset shrink-0 rounded-full px-3 py-1 font-bold tabular-nums text-sd-glow ${
                      tvMode ? "text-lg" : "text-sm"
                    } ${
                      view.layoutVariant === "survival_roster"
                        ? hero === "Survived"
                          ? "text-emerald-200"
                          : "text-fuchsia-200/90"
                        : ""
                    }`}
                  >
                    {hero}
                  </span>
                )}
                <div className="shrink-0 sm:block">
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
              </div>
              </BranchHighlightBlock>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
