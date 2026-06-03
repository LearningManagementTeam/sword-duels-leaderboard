import { FullLeaderboardCompare } from "@/components/leaderboard/FullLeaderboardCompare";
import { getFullLeaderboardJuneData } from "@/lib/full-leaderboard-data";

export default async function CompareUnifiedPage() {
  const data = await getFullLeaderboardJuneData();
  return <FullLeaderboardCompare data={data} layout="unified" />;
}
