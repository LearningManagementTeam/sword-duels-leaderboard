import Link from "next/link";
import { CompareLayoutBanner } from "@/components/leaderboard/CompareLayoutBanner";
import { GamifiedLeaderboard } from "@/components/leaderboard/GamifiedLeaderboard";
import { RegionLeaderboardPanel } from "@/components/leaderboard/RegionLeaderboardPanel";
import type { FullLeaderboardData } from "@/lib/full-leaderboard-data";

export type FullLeaderboardLayout =
  | "three-columns"
  | "stacked"
  | "unified";

const LAYOUT_TITLES: Record<FullLeaderboardLayout, string> = {
  "three-columns": "Three columns (A)",
  stacked: "Stacked regions (B1)",
  unified: "Unified table (B2)",
};

interface Props {
  data: FullLeaderboardData;
  layout: FullLeaderboardLayout;
}

export function FullLeaderboardCompare({ data, layout }: Props) {
  const { byRegion, unified, latestPublishedRound, isDemo, phaseTitle } = data;
  const maxCutoff = Math.max(...byRegion.map((b) => b.cutoff), 24);

  return (
    <div className="space-y-5">
      <CompareLayoutBanner
        layoutName={LAYOUT_TITLES[layout]}
        layoutSlug={layout}
      />

      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sd-glow">
          Full leaderboard
        </p>
        <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
          {phaseTitle}
        </h1>
        <p className="mt-1 text-sm text-sd-muted">
          Standings after Round {latestPublishedRound}
          {isDemo && (
            <span className="text-sd-muted/60">
              {" "}
              · Sample data (135 branches, realistic names)
            </span>
          )}
        </p>
      </div>

      {layout === "three-columns" && (
        <div className="grid gap-4 lg:grid-cols-3">
          {byRegion.map((board) => (
            <RegionLeaderboardPanel
              key={board.region}
              region={board.region}
              rows={board.rows}
              latestPublishedRound={latestPublishedRound}
              cutoff={board.cutoff}
              cutLineLabel={board.cutLineLabel}
              compact={false}
              showDetailToggle
            />
          ))}
        </div>
      )}

      {layout === "stacked" && (
        <div className="sd-glass-strong space-y-6 rounded-2xl p-4 sm:p-6">
          {byRegion.map((board, i) => (
            <div
              key={board.region}
              className={i > 0 ? "border-t border-emerald-500/15 pt-6" : undefined}
            >
              <RegionLeaderboardPanel
                region={board.region}
                rows={board.rows}
                latestPublishedRound={latestPublishedRound}
                cutoff={board.cutoff}
                cutLineLabel={board.cutLineLabel}
                compact
              />
            </div>
          ))}
        </div>
      )}

      {layout === "unified" && (
        <GamifiedLeaderboard
          rows={unified}
          bannerSubtitle={`${phaseTitle} · All regions`}
          advancementCutoff={maxCutoff}
          cutLineLabel="Regional cut lines apply per region"
          showArea
          showRegion
          showRepresentatives
          showDetailToggle
          seasonSlug="june_area"
          latestPublishedRound={latestPublishedRound}
        />
      )}

      <p className="text-center text-sm text-sd-muted">
        Prefer a different layout?{" "}
        <Link href="/compare/leaderboard" className="sd-link">
          Compare all three views
        </Link>
      </p>
    </div>
  );
}
