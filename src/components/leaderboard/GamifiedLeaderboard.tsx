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
    <div className="sd-glass-strong relative space-y-6 overflow-hidden rounded-2xl p-4 sm:p-6">
      <LeaderboardBanner subtitle={bannerSubtitle} tvMode={tvMode} />

      {!tvMode && (
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
        <p className="text-center text-sd-muted py-12">
          No standings published yet.
        </p>
      ) : (
        <>
          <PodiumTopThree topThree={topThree} tvMode={tvMode} />
          <GamifiedRankList
            rows={filtered}
            advancementCutoff={advancementCutoff}
            cutLineLabel={defaultCutLabel}
            highlightCode={highlightCode}
            tvMode={tvMode}
          />
        </>
      )}

      {!tvMode && (
        <p className="text-xs text-sd-muted/80">
          Tie-breakers: {tieBreakers.join(" → ")} · Showing {filtered.length} of{" "}
          {rows.length}
        </p>
      )}

      {showDetailToggle && !tvMode && filtered.length > 0 && (
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
