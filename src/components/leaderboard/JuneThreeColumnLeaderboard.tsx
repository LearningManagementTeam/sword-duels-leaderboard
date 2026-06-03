import { RegionLeaderboardPanel } from "@/components/leaderboard/RegionLeaderboardPanel";
import type { FullLeaderboardData } from "@/lib/full-leaderboard-data";
import { getRoundMechanics } from "@/lib/scoring-config";

interface Props {
  data: FullLeaderboardData;
  showPageHeader?: boolean;
}

export function JuneThreeColumnLeaderboard({
  data,
  showPageHeader = true,
}: Props) {
  const { byRegion, latestPublishedRound, isDemo, phaseTitle } = data;
  const roundName =
    getRoundMechanics("june_area", latestPublishedRound)?.roundName ??
    `Round ${latestPublishedRound}`;

  return (
    <div className="space-y-5">
      {showPageHeader && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sd-glow">
            Full leaderboard · Round 3
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            {phaseTitle}
          </h1>
          <p className="mt-1 text-sm text-sd-muted">
            {roundName} · Luzon, NCR & VisMin side-by-side
            {isDemo ? (
              <span className="text-sd-muted/60"> · Sample data</span>
            ) : (
              <span className="text-sd-muted/60"> · Live standings</span>
            )}
          </p>
        </div>
      )}

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
    </div>
  );
}
