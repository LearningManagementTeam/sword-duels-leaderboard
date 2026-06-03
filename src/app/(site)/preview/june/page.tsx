import { PhaseLeaderboard } from "@/components/PhaseLeaderboard";
import { getDemoStandings } from "@/lib/demo/generate-demo-standings";

export default function PreviewJunePage() {
  const demoRows = getDemoStandings("june_area");
  return (
    <PhaseLeaderboard
      phase="june"
      slug="june_area"
      demoRows={demoRows}
      isPreview
    />
  );
}
