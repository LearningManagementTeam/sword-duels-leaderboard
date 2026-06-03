import Link from "next/link";
import { StatusLegend } from "@/components/leaderboard/StatusTickerCarousel";
import { StandingsContextBar } from "@/components/nav/StandingsContextBar";
import { JuneThreeColumnLeaderboard } from "@/components/leaderboard/JuneThreeColumnLeaderboard";
import { getFullLeaderboardJuneData } from "@/lib/full-leaderboard-data";
import {
  getLastPublishedAt,
  getSeasonBySlug,
} from "@/lib/data/queries";
import { juneRoundDisplayName } from "@/lib/scoring-config";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const revalidate = 30;

export const metadata = {
  title: "June full leaderboard — Sword Duels",
};

export default async function JuneFullLeaderboardPage() {
  const data = await getFullLeaderboardJuneData();
  let lastPublished: string | null = null;
  if (isSupabaseConfigured()) {
    const season = await getSeasonBySlug("june_area");
    if (season) {
      lastPublished = await getLastPublishedAt(season.id);
    }
  }

  if (data.latestPublishedRound < 3) {
    const roundName =
      data.latestPublishedRound > 0
        ? juneRoundDisplayName(data.latestPublishedRound as 1 | 2)
        : "Round 1";

    return (
      <div className="space-y-4">
        <StandingsContextBar
          phase="june"
          latestPublishedRound={data.latestPublishedRound}
          lastPublished={lastPublished}
          seasonSlug="june_area"
          showRegions
        />
        <StatusLegend lastPublished={lastPublished} />
        <div className="sd-glass mx-auto max-w-lg space-y-4 rounded-2xl px-6 py-8 text-center">
          <div
            className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-400/25"
            aria-hidden
          >
            <svg
              className="h-5 w-5 text-sd-glow"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
            >
              <path d="M4 6h16M4 12h16M4 18h10" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white">Full three-region board</h2>
          <p className="text-sm leading-relaxed text-sd-muted">
            Luzon · NCR · VisMin side-by-side unlocks in{" "}
            <strong className="text-white">Round 3 — Clash of the Knowledge Swords</strong>.
            {data.latestPublishedRound > 0 && (
              <>
                {" "}
                You&apos;re on {roundName} — use a regional board for now.
              </>
            )}
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Link href="/june/luzon" className="sd-btn-primary rounded-full px-4 py-2 text-sm">
              Luzon
            </Link>
            <Link href="/june/ncr" className="sd-btn-primary rounded-full px-4 py-2 text-sm">
              NCR
            </Link>
            <Link href="/june/vismin" className="sd-btn-primary rounded-full px-4 py-2 text-sm">
              VisMin
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StandingsContextBar
        phase="june"
        latestPublishedRound={data.latestPublishedRound}
        lastPublished={lastPublished}
        seasonSlug="june_area"
        showRegions
        fullBoardActive
      />
      <StatusLegend lastPublished={lastPublished} />
      <JuneThreeColumnLeaderboard data={data} showPageHeader={false} />
    </div>
  );
}
