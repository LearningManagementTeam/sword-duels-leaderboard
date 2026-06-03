import { CompetitionMapDisplay } from "@/components/competition/CompetitionMapDisplay";
import { getCompetitionMap } from "@/lib/data/content-queries";
import { getRemainingContestantsForMap } from "@/lib/data/competition-map-queries";

export async function CompetitionMapPanel() {
  const config = await getCompetitionMap();
  const remaining = await getRemainingContestantsForMap(config);

  return <CompetitionMapDisplay config={config} remaining={remaining} />;
}
