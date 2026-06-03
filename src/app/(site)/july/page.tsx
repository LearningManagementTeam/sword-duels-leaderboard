import { PhaseLeaderboard } from "@/components/PhaseLeaderboard";

export const revalidate = 30;

export default function JulyPage() {
  return <PhaseLeaderboard phase="july" slug="july_region" />;
}
