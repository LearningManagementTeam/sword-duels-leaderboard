import { PhaseLeaderboard } from "@/components/PhaseLeaderboard";
import { getDemoStandings } from "@/lib/demo/generate-demo-standings";

export default function PreviewAugustPage() {
  const demoRows = getDemoStandings("august_finals");
  return (
    <PhaseLeaderboard
      phase="august"
      slug="august_finals"
      demoRows={demoRows}
      isPreview
    />
  );
}
