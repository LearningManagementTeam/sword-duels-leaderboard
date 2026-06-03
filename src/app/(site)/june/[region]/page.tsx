import { notFound } from "next/navigation";
import { PhaseLeaderboard } from "@/components/PhaseLeaderboard";
import { REGIONS, type Region } from "@/lib/scoring-config";

export default async function JuneRegionPage({
  params,
}: {
  params: Promise<{ region: string }>;
}) {
  const { region } = await params;
  if (!REGIONS.includes(region as Region)) notFound();

  return (
    <PhaseLeaderboard
      phase="june"
      slug="june_area"
      region={region as Region}
    />
  );
}
