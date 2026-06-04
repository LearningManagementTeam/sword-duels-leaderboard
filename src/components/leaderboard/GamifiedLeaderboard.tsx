"use client";

import { useEffect, useMemo, useState } from "react";
import { LeaderboardBanner } from "./LeaderboardBanner";
import { LeaderboardDetailToggle } from "./LeaderboardDetailToggle";
import { RoundBoardShell } from "./RoundBoardShell";
import { filterLeaderboardRows } from "@/lib/leaderboard-utils";
import {
  getRoundViewConfig,
  type RoundViewConfig,
} from "@/lib/leaderboard-display";
import type { StandingRow } from "@/lib/types";
import {
  CUMULATIVE_TIE_BREAKER_LABELS,
  TIE_BREAKER_LABELS,
  usesPerRoundElimination,
  type Region,
  type SeasonSlug,
} from "@/lib/scoring-config";

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
  showBanner?: boolean;
  compact?: boolean;
  seasonSlug?: SeasonSlug;
  latestPublishedRound?: number;
  highlightCode?: string | null;
  region?: Region;
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
  showBanner = true,
  compact = false,
  seasonSlug,
  latestPublishedRound = 0,
  highlightCode = null,
  region,
}: Props) {
  const storageKey = seasonSlug ? `sd-search-${seasonSlug}` : "sd-search";
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const view: RoundViewConfig = useMemo(
    () =>
      seasonSlug
        ? getRoundViewConfig(seasonSlug, latestPublishedRound, region)
        : getRoundViewConfig("june_area", latestPublishedRound, region),
    [seasonSlug, latestPublishedRound, region]
  );

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

  const defaultCutLabel = cutLineLabel ?? view.cutLineLabel;
  const roundBannerSubtitle =
    bannerSubtitle ?? view.bannerTagline;

  const awaitingPublish = latestPublishedRound === 0;
  const isEmpty = rows.length === 0;
  const showFilters = !tvMode && !compact && (!awaitingPublish || !isEmpty);

  const themeAccent =
    view.layoutVariant === "quiz_ladder"
      ? "border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent"
      : view.layoutVariant === "survival_roster" ||
          view.layoutVariant === "hearts_roster"
        ? "border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/5 to-transparent"
        : view.layoutVariant === "finish_order_champions"
          ? "border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/5 to-transparent"
          : view.layoutVariant === "percentage_score"
            ? "border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent"
            : view.layoutVariant === "judged_score"
              ? "border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-transparent"
              : "";

  return (
    <div
      className={`sd-glass-strong relative overflow-hidden rounded-2xl ${themeAccent} ${
        compact ? "space-y-3 p-3" : "space-y-6 p-4 sm:p-6"
      }`}
    >
      {!compact && showBanner && (
        <LeaderboardBanner
          subtitle={roundBannerSubtitle}
          title={latestPublishedRound > 0 ? view.roundName : undefined}
          tvMode={tvMode}
        />
      )}

      {showFilters && (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <input
            type="search"
            aria-label="Search participants, branches, or codes"
            placeholder="Search participant, branch, or code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sd-input min-w-[200px] flex-1 rounded-lg px-3 py-2 text-sm"
          />
          {showArea && (
            <select
              aria-label="Filter by area"
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
            aria-label="Filter by status"
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
        <div
          className={`mx-auto w-full text-center ${compact ? "max-w-sm py-6" : "max-w-md py-10"}`}
        >
          {!compact && (
            <div
              className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-400/25"
              aria-hidden
            >
              <svg
                className="h-5 w-5 text-sd-glow"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
              >
                <path d="M4 20V10M12 20V4M20 20v-6" />
              </svg>
            </div>
          )}
          <p className={`leading-relaxed text-sd-muted ${compact ? "text-sm" : "text-sm sm:text-base"}`}>
            {view.emptyMessage}
          </p>
        </div>
      ) : (
        <div className={compact ? "max-h-[min(28rem,55vh)] overflow-y-auto pr-1" : undefined}>
          <RoundBoardShell
            rows={filtered}
            view={view}
            seasonSlug={seasonSlug}
            region={region}
            advancementCutoff={advancementCutoff}
            cutLineLabel={defaultCutLabel}
            highlightCode={highlightCode}
            tvMode={tvMode}
            compact={compact}
          />
        </div>
      )}

      {!tvMode && !compact && (
        isEmpty ? (
          <details className="text-center">
            <summary className="cursor-pointer text-xs text-sd-muted/70 hover:text-sd-glow">
              How tie-breakers work
            </summary>
            <p className="mt-2 text-xs leading-relaxed text-sd-muted/80">
              {tieBreakers.join(" → ")}
            </p>
          </details>
        ) : (
          <p className="text-center text-xs text-sd-muted/80 sm:text-left">
            Tie-breakers: {tieBreakers.join(" → ")} · Showing {filtered.length} of{" "}
            {rows.length}
          </p>
        )
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
