"use client";

import { BranchHighlightBlock } from "@/components/BranchHighlight";
import { StatusBadge } from "@/components/StatusBadge";
import { branchInitials } from "@/lib/branding";
import type { StandingRow } from "@/lib/types";

function formatRoundPoints(value: number | null): string {
  return value === null ? "—" : String(value);
}

const rankBadgeColors: Record<number, string> = {
  4: "bg-violet-600",
  5: "bg-fuchsia-600",
  6: "bg-pink-600",
  7: "bg-rose-600",
  8: "bg-orange-600",
};

function rankBadgeClass(rank: number): string {
  return rankBadgeColors[rank] ?? "bg-emerald-700";
}

interface Props {
  rows: StandingRow[];
  advancementCutoff: number;
  cutLineLabel: string;
  highlightCode?: string | null;
  tvMode?: boolean;
}

export function GamifiedRankList({
  rows,
  advancementCutoff,
  cutLineLabel,
  highlightCode,
  tvMode,
}: Props) {
  const listRows = rows.filter((r) => r.rank > 3);
  if (listRows.length === 0) return null;

  return (
    <ul className={`space-y-2 ${tvMode ? "space-y-3" : ""}`}>
      {listRows.map((row) => {
        const showCutLine =
          advancementCutoff > 0 &&
          row.rank === advancementCutoff + 1 &&
          listRows.some((r) => r.rank === advancementCutoff);

        const inZone =
          row.status !== "eliminated" &&
          row.status !== "tie_breaker" &&
          row.rank <= advancementCutoff;

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
                      : "sd-glass border-slate-600/30 opacity-85"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-bold text-white ${rankBadgeClass(row.rank)} ${
                    tvMode ? "h-10 w-10 text-base" : ""
                  }`}
                >
                  {row.rank}
                </span>
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-950/90 text-xs font-bold text-emerald-100 ring-1 ring-emerald-500/30 ${
                    tvMode ? "h-11 w-11 text-sm" : ""
                  }`}
                >
                  {branchInitials(row.branch_name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate font-semibold text-white ${
                      tvMode ? "text-lg" : "text-sm"
                    }`}
                  >
                    {row.branch_name}
                  </p>
                  <p className="text-xs text-sd-muted/80">
                    R1 {formatRoundPoints(row.round1_points)} · R2{" "}
                    {formatRoundPoints(row.round2_points)} · R3{" "}
                    {formatRoundPoints(row.round3_points)}
                  </p>
                </div>
                <span
                  className={`sd-inset shrink-0 rounded-full px-3 py-1 font-bold tabular-nums text-sd-glow ${
                    tvMode ? "text-lg" : "text-sm"
                  }`}
                >
                  {row.total_points}
                </span>
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
  );
}
