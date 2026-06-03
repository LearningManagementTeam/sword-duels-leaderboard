import Link from "next/link";
import { CompareLayoutBanner } from "@/components/leaderboard/CompareLayoutBanner";
import { JuneThreeColumnLeaderboard } from "@/components/leaderboard/JuneThreeColumnLeaderboard";
import { RoundPreviewTabs } from "@/components/leaderboard/RoundPreviewTabs";
import {
  getCompareLeaderboardPreviewData,
  parsePreviewRound,
} from "@/lib/compare-preview-data";

export default async function CompareThreeColumnsPage({
  searchParams,
}: {
  searchParams: Promise<{ round?: string }>;
}) {
  const { round: roundParam } = await searchParams;
  const round = parsePreviewRound(roundParam);
  const data = getCompareLeaderboardPreviewData(round);

  return (
    <div className="space-y-5">
      <CompareLayoutBanner
        layoutName="Three columns — Round preview"
        layoutSlug="three-columns"
      />
      <RoundPreviewTabs activeRound={round} />
      <JuneThreeColumnLeaderboard
        data={data}
        isComparePreview
        approvedRound3Layout={round === 3}
      />
      <p className="text-center text-sm text-sd-muted">
        <Link href="/compare/leaderboard" className="sd-link">
          Back to layout picker
        </Link>
      </p>
    </div>
  );
}
