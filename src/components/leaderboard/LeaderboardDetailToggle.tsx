"use client";

import { useState } from "react";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import type { StandingRow } from "@/lib/types";
import type { SeasonSlug } from "@/lib/scoring-config";

interface TableProps {
  rows: StandingRow[];
  advancementCutoff?: number;
  cutLineLabel?: string;
  showArea?: boolean;
  showRegion?: boolean;
  showRepresentatives?: boolean;
  seasonSlug?: SeasonSlug;
  latestPublishedRound?: number;
  highlightCode?: string | null;
}

export function LeaderboardDetailToggle(props: TableProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full rounded-lg border border-sd-glow/30 bg-sd-panel/80 px-4 py-2 text-sm font-medium text-sd-muted transition hover:border-sd-glow/50 hover:text-white sm:w-auto"
      >
        {open ? "Hide detailed standings" : "Show detailed standings"}
      </button>
      {open && (
        <div className="sd-glass rounded-xl p-4">
          <LeaderboardTable {...props} />
        </div>
      )}
    </div>
  );
}
