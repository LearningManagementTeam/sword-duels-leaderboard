import { FullLeaderboardCompare } from "@/components/leaderboard/FullLeaderboardCompare";
import { getCompareLeaderboardPreviewData } from "@/lib/compare-preview-data";

export default function CompareStackedPage() {
  const data = getCompareLeaderboardPreviewData();
  return <FullLeaderboardCompare data={data} layout="stacked" />;
}
