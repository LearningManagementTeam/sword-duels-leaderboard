import { GamifiedLeaderboard } from "@/components/leaderboard/GamifiedLeaderboard";
import { REGION_LABELS, type Region } from "@/lib/scoring-config";
import type { StandingRow } from "@/lib/types";

interface Props {
  region: Region;
  rows: StandingRow[];
  latestPublishedRound: number;
  cutoff: number;
  cutLineLabel?: string;
  compact?: boolean;
}

export function RegionLeaderboardPanel({
  region,
  rows,
  latestPublishedRound,
  cutoff,
  cutLineLabel,
  compact = true,
}: Props) {
  const subtitle =
    latestPublishedRound > 0
      ? `${REGION_LABELS[region]} · After Round ${latestPublishedRound}`
      : REGION_LABELS[region];

  return (
    <div className="min-w-0">
      {compact && (
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-sd-glow">
          {REGION_LABELS[region]}
          <span className="ml-2 text-xs font-normal text-sd-muted/70">
            {rows.length} branches
          </span>
        </h3>
      )}
      <GamifiedLeaderboard
        rows={rows}
        bannerSubtitle={compact ? undefined : subtitle}
        advancementCutoff={cutoff}
        cutLineLabel={cutLineLabel}
        showArea={!compact}
        showRegion={false}
        showRepresentatives={!compact}
        showDetailToggle={false}
        compact={compact}
        seasonSlug="june_area"
        latestPublishedRound={latestPublishedRound}
      />
    </div>
  );
}
