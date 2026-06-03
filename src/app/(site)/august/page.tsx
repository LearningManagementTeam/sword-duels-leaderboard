import { PhaseLeaderboard } from "@/components/PhaseLeaderboard";

export const revalidate = 30;

export default function AugustPage() {
  return <PhaseLeaderboard phase="august" slug="august_finals" />;
}
