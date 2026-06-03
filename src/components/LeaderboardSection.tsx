"use client";

import { useSearchParams } from "next/navigation";
import { BranchHighlightControls } from "@/components/BranchHighlight";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import type { StandingRow } from "@/lib/types";
import type { SeasonSlug } from "@/lib/scoring-config";

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
}

export function LeaderboardSection(props: Props) {
  const searchParams = useSearchParams();
  const highlightCode = searchParams.get("highlight");

  return (
    <div className="space-y-4">
      {!props.tvMode && <BranchHighlightControls />}
      <LeaderboardTable {...props} highlightCode={highlightCode} />
    </div>
  );
}
