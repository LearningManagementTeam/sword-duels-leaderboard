import { notFound } from "next/navigation";
import { PhaseLeaderboard } from "@/components/PhaseLeaderboard";
import { REGIONS, type Region } from "@/lib/scoring-config";

export const revalidate = 30;

export default async function JulyRegionPage({
  params,
}: {
  params: Promise<{ region: string }>;
}) {
  const { region } = await params;
  if (!REGIONS.includes(region as Region)) notFound();

  return (
    <PhaseLeaderboard
      phase="july"
      slug="july_region"
      region={region as Region}
    />
  );
}
