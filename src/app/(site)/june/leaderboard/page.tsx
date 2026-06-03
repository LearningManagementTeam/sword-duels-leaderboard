import Link from "next/link";
import { JuneThreeColumnLeaderboard } from "@/components/leaderboard/JuneThreeColumnLeaderboard";
import { getFullLeaderboardJuneData } from "@/lib/full-leaderboard-data";
import { previewRoundLabel } from "@/lib/compare-preview-constants";

export const metadata = {
  title: "June full leaderboard — Sword Duels",
};

export default async function JuneFullLeaderboardPage() {
  const data = await getFullLeaderboardJuneData();

  if (data.latestPublishedRound < 3) {
    const roundName =
      data.latestPublishedRound > 0
        ? previewRoundLabel(data.latestPublishedRound as 1 | 2)
        : "Round 1";

    return (
      <div className="sd-neon-panel mx-auto max-w-lg space-y-4 p-6 text-center">
        <h1 className="text-xl font-bold text-white">Full three-region board</h1>
        <p className="text-sm text-sd-muted">
          The side-by-side Luzon · NCR · VisMin board unlocks during{" "}
          <strong className="text-white">Round 3 — Clash of the Knowledge Swords</strong>.
          {data.latestPublishedRound > 0 && (
            <>
              {" "}
              You&apos;re viewing {roundName} — use a regional board for now.
            </>
          )}
        </p>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <Link href="/june/luzon" className="sd-btn-primary rounded-lg px-4 py-2 text-sm">
            June · Luzon
          </Link>
          <Link href="/june/ncr" className="sd-btn-primary rounded-lg px-4 py-2 text-sm">
            June · NCR
          </Link>
          <Link href="/june/vismin" className="sd-btn-primary rounded-lg px-4 py-2 text-sm">
            June · VisMin
          </Link>
        </div>
        <p className="text-xs text-sd-muted/70">
          Preview all three rounds in three columns:{" "}
          <Link
            href="/compare/leaderboard/three-columns?round=1"
            className="sd-link"
          >
            R1
          </Link>
          {" · "}
          <Link
            href="/compare/leaderboard/three-columns?round=2"
            className="sd-link"
          >
            R2
          </Link>
          {" · "}
          <Link
            href="/compare/leaderboard/three-columns?round=3"
            className="sd-link"
          >
            R3
          </Link>
        </p>
      </div>
    );
  }

  return (
    <JuneThreeColumnLeaderboard
      data={data}
      approvedRound3Layout
    />
  );
}
