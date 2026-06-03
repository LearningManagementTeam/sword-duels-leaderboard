"use client";

import { useSearchParams } from "next/navigation";
import { BranchHighlightControls } from "@/components/BranchHighlight";
import { GamifiedLeaderboard } from "@/components/leaderboard/GamifiedLeaderboard";
import type { BrandingConfig } from "@/lib/branding";
import type { StandingRow } from "@/lib/types";
import type { SeasonSlug } from "@/lib/scoring-config";

interface Props {
  branding: BrandingConfig;
  bannerSubtitle?: string;
  rows: StandingRow[];
  advancementCutoff?: number;
  cutLineLabel?: string;
  showArea?: boolean;
  showRegion?: boolean;
  showRepresentatives?: boolean;
  tvMode?: boolean;
  showDetailToggle?: boolean;
  seasonSlug?: SeasonSlug;
  latestPublishedRound?: number;
}

export function LeaderboardSection({
  branding,
  bannerSubtitle,
  tvMode = false,
  showDetailToggle = true,
  ...rest
}: Props) {
  const searchParams = useSearchParams();
  const highlightCode = searchParams.get("highlight");

  return (
    <div className="space-y-4">
      {!tvMode && <BranchHighlightControls />}
      <GamifiedLeaderboard
        branding={branding}
        bannerSubtitle={bannerSubtitle}
        highlightCode={highlightCode}
        tvMode={tvMode}
        showDetailToggle={showDetailToggle}
        {...rest}
      />
    </div>
  );
}
