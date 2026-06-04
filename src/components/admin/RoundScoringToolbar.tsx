"use client";

import { REGIONS, REGION_LABELS, type Region } from "@/lib/scoring-config";

interface Props {
  region: Region | "all";
  onRegionChange: (region: Region | "all") => void;
  search: string;
  onSearchChange: (value: string) => void;
  showRegionalTabs: boolean;
  usesSurvivorCount: boolean;
  survivorTarget: number | null;
  onMarkTopN?: () => void;
  onClearRegion?: () => void;
  visibleCount: number;
  totalCount: number;
}

export function RoundScoringToolbar({
  region,
  onRegionChange,
  search,
  onSearchChange,
  showRegionalTabs,
  usesSurvivorCount,
  survivorTarget,
  onMarkTopN,
  onClearRegion,
  visibleCount,
  totalCount,
}: Props) {
  return (
    <div className="space-y-3">
      {showRegionalTabs && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onRegionChange("all")}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              region === "all"
                ? "bg-gradient-to-r from-sd-lime to-emerald-400 font-semibold text-sd-deep"
                : "sd-glass text-sd-muted hover:text-white"
            }`}
          >
            All regions
          </button>
          {REGIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onRegionChange(r)}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                region === r
                  ? "bg-gradient-to-r from-sd-lime to-emerald-400 font-semibold text-sd-deep"
                  : "sd-glass text-sd-muted hover:text-white"
              }`}
            >
              {REGION_LABELS[r]}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-w-[12rem] flex-1 items-center gap-2 text-sm text-sd-muted">
          <span className="sr-only">Search branches</span>
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search branch name…"
            className="sd-input w-full max-w-md rounded-lg px-3 py-1.5 text-sm"
          />
        </label>
        <p className="text-xs text-sd-muted/70 tabular-nums">
          Showing {visibleCount} of {totalCount}
        </p>
        {usesSurvivorCount && region !== "all" && survivorTarget != null && (
          <div className="flex flex-wrap gap-2">
            {onMarkTopN && (
              <button
                type="button"
                onClick={onMarkTopN}
                className="sd-btn-ghost rounded-lg px-3 py-1.5 text-xs"
              >
                Mark top {survivorTarget} in {REGION_LABELS[region]}
              </button>
            )}
            {onClearRegion && (
              <button
                type="button"
                onClick={onClearRegion}
                className="sd-btn-ghost rounded-lg px-3 py-1.5 text-xs text-sd-muted"
              >
                Clear {REGION_LABELS[region]}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
