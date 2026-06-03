"use client";

import { useEffect, useMemo, useState } from "react";
import { LeaderboardBanner } from "./LeaderboardBanner";
import { PodiumTopThree } from "./PodiumTopThree";
import { GamifiedRankList } from "./GamifiedRankList";
import { LeaderboardDetailToggle } from "./LeaderboardDetailToggle";
import { filterLeaderboardRows } from "@/lib/leaderboard-utils";
import type { StandingRow } from "@/lib/types";
import {
  CUMULATIVE_TIE_BREAKER_LABELS,
  TIE_BREAKER_LABELS,
  usesPerRoundElimination,
} from "@/lib/scoring-config";
import type { SeasonSlug } from "@/lib/scoring-config";

interface Props {
  rows: StandingRow[];
  bannerSubtitle?: string;
  advancementCutoff?: number;
  cutLineLabel?: string;
  showArea?: boolean;
  showRegion?: boolean;
  showRepresentatives?: boolean;
  tvMode?: boolean;
  showDetailToggle?: boolean;
  compact?: boolean;
  seasonSlug?: SeasonSlug;
  latestPublishedRound?: number;
  highlightCode?: string | null;
}

export function GamifiedLeaderboard({
  rows,
  bannerSubtitle,
  advancementCutoff = 24,
  cutLineLabel,
  showArea = true,
  showRegion = false,
  showRepresentatives = true,
  tvMode = false,
  showDetailToggle = true,
  compact = false,
  seasonSlug,
  latestPublishedRound = 0,
  highlightCode = null,
}: Props) {
  const storageKey = seasonSlug ? `sd-search-${seasonSlug}` : "sd-search";
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = sessionStorage.getItem(storageKey);
    if (saved && !highlightCode) setSearch(saved);
  }, [storageKey, highlightCode]);

  useEffect(() => {
    if (typeof window === "undefined" || !search) return;
    sessionStorage.setItem(storageKey, search);
  }, [search, storageKey]);

  const perRound = seasonSlug ? usesPerRoundElimination(seasonSlug) : false;
  const tieBreakers = perRound
    ? TIE_BREAKER_LABELS
    : CUMULATIVE_TIE_BREAKER_LABELS;

  const areas = useMemo(
    () => [...new Set(rows.map((r) => r.area))].sort(),
    [rows]
  );

  const filtered = useMemo(
    () =>
      filterLeaderboardRows(rows, { search, areaFilter, statusFilter }),
    [rows, search, areaFilter, statusFilter]
  );

  const defaultCutLabel =
    cutLineLabel ??
    (perRound && latestPublishedRound > 0
      ? `Cut line — top ${advancementCutoff} advance to Round ${latestPublishedRound + 1}`
      : `Cut line — top ${advancementCutoff} advance`);

  const topThree = filtered.filter((r) => r.rank <= 3);

  return (
    <div
      className={`sd-glass-strong relative overflow-hidden rounded-2xl ${
        compact ? "space-y-3 p-3" : "space-y-6 p-4 sm:p-6"
      }`}
    >
      {!compact && (
        <LeaderboardBanner subtitle={bannerSubtitle} tvMode={tvMode} />
      )}

      {!tvMode && !compact && (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <input
            type="search"
            placeholder="Search branch… (?highlight=CODE)"
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
            <option value="advanced">Advancing to next phase</option>
            <option value="tie_breaker">Tie breaker</option>
            <option value="eliminated">Eliminated</option>
            <option value="regional_finalist">Regional champion</option>
            <option value="champion">Champion</option>
          </select>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className={`text-center text-sd-muted ${compact ? "py-6 text-sm" : "py-12"}`}>
          Round 1 drops soon — ranks appear here after publish.
        </p>
      ) : (
        <>
          {!compact && (
            <PodiumTopThree topThree={topThree} tvMode={tvMode} />
          )}
          <div className={compact ? "max-h-[min(28rem,55vh)] overflow-y-auto pr-1" : undefined}>
            <GamifiedRankList
              rows={filtered}
              advancementCutoff={advancementCutoff}
              cutLineLabel={defaultCutLabel}
              highlightCode={highlightCode}
              tvMode={tvMode}
            />
          </div>
        </>
      )}

      {!tvMode && !compact && (
        <p className="text-xs text-sd-muted/80">
          Tie-breakers: {tieBreakers.join(" → ")} · Showing {filtered.length} of{" "}
          {rows.length}
        </p>
      )}

      {showDetailToggle && !tvMode && !compact && filtered.length > 0 && (
        <LeaderboardDetailToggle
          rows={rows}
          advancementCutoff={advancementCutoff}
          cutLineLabel={cutLineLabel}
          showArea={showArea}
          showRegion={showRegion}
          showRepresentatives={showRepresentatives}
          seasonSlug={seasonSlug}
          latestPublishedRound={latestPublishedRound}
          highlightCode={highlightCode}
        />
      )}
    </div>
  );
}
