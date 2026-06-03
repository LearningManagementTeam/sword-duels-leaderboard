import Link from "next/link";
import { RegionLeaderboardPanel } from "@/components/leaderboard/RegionLeaderboardPanel";
import type { FullLeaderboardData } from "@/lib/full-leaderboard-data";
import { previewRoundLabel, type PreviewRound } from "@/lib/compare-preview-constants";

interface Props {
  data: FullLeaderboardData;
  /** Shown on compare previews */
  isComparePreview?: boolean;
  approvedRound3Layout?: boolean;
}

export function JuneThreeColumnLeaderboard({
  data,
  isComparePreview = false,
  approvedRound3Layout = false,
}: Props) {
  const { byRegion, latestPublishedRound, isDemo, phaseTitle } = data;
  const roundName = previewRoundLabel(latestPublishedRound as PreviewRound);

  return (
    <div className="space-y-5">
      <div>
        {!isComparePreview && (
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sd-glow">
            Full leaderboard · Round 3
          </p>
        )}
        <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
          {phaseTitle}
        </h1>
        <p className="mt-1 text-sm text-sd-muted">
          {roundName} · Luzon, NCR & VisMin side-by-side
          {isDemo && isComparePreview && (
            <span className="text-sd-muted/60"> · Sample data</span>
          )}
          {!isDemo && !isComparePreview && (
            <span className="text-sd-muted/60"> · Live standings</span>
          )}
        </p>
        {approvedRound3Layout && latestPublishedRound === 3 && (
          <p className="mt-2 inline-block rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-100">
            Three-column layout approved for Round 3 — this is the permanent full
            board view during Clash of the Knowledge Swords.
          </p>
        )}
      </div>

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

      {isComparePreview && (
        <p className="text-center text-sm text-sd-muted">
          {latestPublishedRound === 1 ? (
            <>
              Round 1: ranked quiz list with top-32 advancing zone and cut line
              (no podium).{" "}
            </>
          ) : latestPublishedRound === 2 ? (
            <>Round 2: survival roster — still standing vs fallen. </>
          ) : (
            <>Round 3: finish-order podium plus qualifiers. </>
          )}
          <Link href="/june/luzon" className="sd-link">
            Single-region boards
          </Link>{" "}
          are used during live play for R1/R2.
        </p>
      )}
    </div>
  );
}
