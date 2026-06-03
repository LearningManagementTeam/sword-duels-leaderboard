import { FullLeaderboardCompare } from "@/components/leaderboard/FullLeaderboardCompare";
import { getCompareLeaderboardPreviewData } from "@/lib/compare-preview-data";

export default function CompareUnifiedPage() {
  const data = getCompareLeaderboardPreviewData();
  return <FullLeaderboardCompare data={data} layout="unified" />;
}
