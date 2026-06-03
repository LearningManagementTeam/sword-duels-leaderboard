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
        className={`w-full rounded-full border px-4 py-2 text-sm font-medium transition sm:w-auto ${
          open
            ? "border-fuchsia-400/50 bg-fuchsia-950/30 text-fuchsia-100"
            : "border-emerald-400/40 sd-glass text-sd-muted hover:border-fuchsia-400/40 hover:text-white"
        }`}
      >
        {open ? "Hide detailed standings" : "Show detailed standings"}
      </button>
      {open && (
        <div className="sd-neon-panel p-4">
          <LeaderboardTable {...props} />
        </div>
      )}
    </div>
  );
}
