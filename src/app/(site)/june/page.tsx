import { PhaseLeaderboard } from "@/components/PhaseLeaderboard";

export const revalidate = 30;

export default function JunePage() {
  return <PhaseLeaderboard phase="june" slug="june_area" />;
}
