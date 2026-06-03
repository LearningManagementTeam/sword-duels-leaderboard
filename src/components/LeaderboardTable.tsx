"use client";

import { useEffect, useMemo, useState } from "react";
import { BranchHighlightRow } from "./BranchHighlight";
import { StatusBadge } from "./StatusBadge";
import type { StandingRow } from "@/lib/types";
import {
  CUMULATIVE_TIE_BREAKER_LABELS,
  REGION_LABELS,
  TIE_BREAKER_LABELS,
  usesPerRoundElimination,
} from "@/lib/scoring-config";
import type { Region, SeasonSlug } from "@/lib/scoring-config";

function formatRoundPoints(value: number | null): string {
  return value === null ? "—" : String(value);
}

interface Props {
  rows: StandingRow[];
  advancementCutoff?: number;
  cutLineLabel?: string;
  showArea?: boolean;
  showRegion?: boolean;
  showRepresentatives?: boolean;
  compact?: boolean;
  tvMode?: boolean;
  seasonSlug?: SeasonSlug;
  latestPublishedRound?: number;
  highlightCode?: string | null;
}

function rankFlair(rank: number): string {
  if (rank === 1) return "text-[var(--sd-gold)] font-bold ring-2 ring-[var(--sd-gold)]/60 rounded-full px-2";
  if (rank === 2) return "text-emerald-100 font-bold ring-2 ring-emerald-400/50 rounded-full px-2";
  if (rank === 3) return "text-sd-glow font-bold ring-2 ring-sd-glow/40 rounded-full px-2";
  return "text-sd-muted";
}

export function LeaderboardTable({
  rows,
  advancementCutoff = 24,
  cutLineLabel,
  showArea = true,
  showRegion = false,
  showRepresentatives = false,
  compact = false,
  tvMode = false,
  seasonSlug,
  latestPublishedRound = 0,
  highlightCode = null,
}: Props) {
  const storageKey = seasonSlug ? `sd-search-${seasonSlug}` : "sd-search";
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = sessionStorage.getItem(storageKey);
    if (saved && !highlightCode) setSearch(saved);
  }, [storageKey, highlightCode]);

  useEffect(() => {
    if (typeof window === "undefined" || !search) return;
    sessionStorage.setItem(storageKey, search);
  }, [search, storageKey]);
  const [areaFilter, setAreaFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const perRound = seasonSlug ? usesPerRoundElimination(seasonSlug) : false;
  const tieBreakers = perRound
    ? TIE_BREAKER_LABELS
    : CUMULATIVE_TIE_BREAKER_LABELS;

  const areas = useMemo(
    () => [...new Set(rows.map((r) => r.area))].sort(),
    [rows]
  );

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !r.branch_name.toLowerCase().includes(q) &&
          !r.branch_code.toLowerCase().includes(q) &&
          !(r.representative_1?.toLowerCase().includes(q) ?? false) &&
          !(r.representative_2?.toLowerCase().includes(q) ?? false)
        ) {
          return false;
        }
      }
      if (areaFilter && r.area !== areaFilter) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      return true;
    });
  }, [rows, search, areaFilter, statusFilter]);

  const defaultCutLabel =
    cutLineLabel ??
    (perRound && latestPublishedRound > 0
      ? `Cut line — top ${advancementCutoff} advance to Round ${latestPublishedRound + 1}`
      : `Cut line — top ${advancementCutoff} advance`);

  const textSize = tvMode ? "text-base" : "text-sm";
  const cellPad = tvMode ? "px-4 py-3" : "px-3 py-2";

  const columnCount =
    5 +
    (showArea ? 1 : 0) +
    (showRegion ? 1 : 0) +
    (showRepresentatives && !tvMode ? 1 : 0) +
    (tvMode ? 0 : 1);

  return (
    <div className="space-y-4">
      {!compact && !tvMode && (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <input
            type="search"
            placeholder="Search branch name or code… (share: ?highlight=CODE)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sd-input min-w-[200px] flex-1 rounded-lg px-3 py-2 text-sm"
          />
          {showArea && (
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="sd-input rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All areas</option>
              {areas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          )}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="sd-input rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            <option value="active">Active / advancing</option>
            <option value="tie_breaker">Tie breaker</option>
            <option value="advanced">Advancing to next phase</option>
            <option value="eliminated">Eliminated</option>
            <option value="regional_finalist">Regional champion</option>
            <option value="champion">Champion</option>
          </select>
        </div>
      )}

      {!tvMode && (
        <p className="text-xs text-sd-muted">
          Tie-breakers: {tieBreakers.join(" → ")}
        </p>
      )}

      <div className="sd-table-wrap sd-neon-panel p-2">
        <table className={`sd-table min-w-[640px] ${textSize}`}>
          <thead>
            <tr>
              <th className="px-3 py-2 font-medium">Rank</th>
              <th className="px-3 py-2 font-medium">Branch</th>
              {showArea && <th className="px-3 py-2 font-medium">Area</th>}
              {showRegion && (
                <th className="px-3 py-2 font-medium">Region</th>
              )}
              {showRepresentatives && !tvMode && (
                <th className="px-3 py-2 font-medium">Representatives</th>
              )}
              <th className="px-3 py-2 font-medium text-right">R1</th>
              <th className="px-3 py-2 font-medium text-right">R2</th>
              <th className="px-3 py-2 font-medium text-right">R3</th>
              {!tvMode && (
                <th className="px-3 py-2 font-medium">Status</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={columnCount}
                  className="px-3 py-8 text-center text-sd-muted"
                >
                  No standings published yet.
                </td>
              </tr>
            ) : (
              filtered.flatMap((row) => {
                const showCutLine =
                  advancementCutoff > 0 &&
                  row.rank === advancementCutoff + 1 &&
                  filtered.some((r) => r.rank === advancementCutoff);

                const items = [];

                const inSurvivorZone =
                  row.status !== "eliminated" &&
                  row.status !== "tie_breaker" &&
                  row.rank <= advancementCutoff;
                const rowClasses = `border-t border-emerald-900/20 animate-row-in ${
                  inSurvivorZone
                    ? "border-l-4 border-l-emerald-500/70 bg-emerald-950/25"
                    : ""
                } ${row.status === "eliminated" ? "opacity-70" : ""}`;

                if (showCutLine) {
                  items.push(
                    <tr key={`cut-${row.branch_id}`}>
                      <td
                        colSpan={columnCount}
                        className="border-y-2 border-sd-glow/50 bg-emerald-500/15 px-3 py-2 text-center text-xs font-semibold text-sd-glow"
                      >
                        {defaultCutLabel}
                        <span className="mt-0.5 block font-normal text-sd-muted">
                          Below this line — eliminated unless committee pick
                        </span>
                      </td>
                    </tr>
                  );
                }

                const rowCells = (
                  <>
                    <td className={`${cellPad} font-mono ${rankFlair(row.rank)}`}>
                      {row.rank <= 3 ? (
                        <span title={`Rank ${row.rank}`}>{row.rank}</span>
                      ) : (
                        row.rank
                      )}
                    </td>
                    <td className={cellPad}>
                      <div
                        className={`font-medium text-white ${tvMode ? "text-lg" : ""}`}
                      >
                        {row.branch_name}
                        {inSurvivorZone && !tvMode && (
                          <span
                            className="ml-2 text-xs text-emerald-400/80"
                            title="Advancing"
                          >
                            ↑
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-sd-muted/60">
                        {row.branch_code}
                      </div>
                    </td>
                    {showArea && (
                      <td className={`${cellPad} text-sd-muted`}>{row.area}</td>
                    )}
                    {showRegion && (
                      <td className={`${cellPad} text-sd-muted`}>
                        {REGION_LABELS[row.region as Region]}
                      </td>
                    )}
                    {showRepresentatives && !tvMode && (
                      <td className={`${cellPad} text-sd-muted`}>
                        <div className="text-xs">
                          {row.representative_1 || "—"}
                        </div>
                        {row.representative_2 && (
                          <div className="text-xs text-sd-muted/60">
                            {row.representative_2}
                          </div>
                        )}
                      </td>
                    )}
                    <td
                      className={`${cellPad} text-right tabular-nums text-sd-muted`}
                    >
                      {formatRoundPoints(row.round1_points)}
                    </td>
                    <td
                      className={`${cellPad} text-right tabular-nums text-sd-muted`}
                    >
                      {formatRoundPoints(row.round2_points)}
                    </td>
                    <td
                      className={`${cellPad} text-right tabular-nums text-sd-muted`}
                    >
                      {formatRoundPoints(row.round3_points)}
                    </td>
                    {!tvMode && (
                      <td className={cellPad}>
                        <StatusBadge
                          status={row.status}
                          eliminatedInRound={row.eliminated_in_round}
                          advancingToRound={row.advancing_to_round}
                          tieBreakerInRound={row.tie_breaker_in_round}
                          manuallyAdvancedAfterRound={
                            row.manually_advanced_after_round
                          }
                        />
                      </td>
                    )}
                  </>
                );

                items.push(
                  <BranchHighlightRow
                    key={row.branch_id}
                    branchId={row.branch_id}
                    branchCode={row.branch_code}
                    highlightCode={highlightCode}
                    rowClassName={rowClasses}
                  >
                    {rowCells}
                  </BranchHighlightRow>
                );
                return items;
              })
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-sd-muted/80">
        Showing {filtered.length} of {rows.length} branches
      </p>
    </div>
  );
}
