import { notFound } from "next/navigation";
import { PhaseLeaderboard } from "@/components/PhaseLeaderboard";
import { getDemoStandings } from "@/lib/demo/generate-demo-standings";
import { REGIONS, type Region } from "@/lib/scoring-config";

export default async function PreviewJulyRegionPage({
  params,
}: {
  params: Promise<{ region: string }>;
}) {
  const { region } = await params;
  if (!REGIONS.includes(region as Region)) notFound();

  const demoRows = getDemoStandings("july_region", region as Region);

  return (
    <PhaseLeaderboard
      phase="july"
      slug="july_region"
      region={region as Region}
      demoRows={demoRows}
      isPreview
    />
  );
}
