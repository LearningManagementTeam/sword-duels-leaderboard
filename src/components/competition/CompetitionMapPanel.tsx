import { CompetitionMapDisplay } from "@/components/competition/CompetitionMapDisplay";
import { getCompetitionMap } from "@/lib/data/content-queries";
import { getRemainingContestantsForMap } from "@/lib/data/competition-map-queries";
import type { CompetitionMapConfig } from "@/lib/competition-map";

interface Props {
  config?: CompetitionMapConfig;
}

export async function CompetitionMapPanel({ config: configProp }: Props) {
  const config = configProp ?? (await getCompetitionMap());
  const remaining = await getRemainingContestantsForMap(config);

  return <CompetitionMapDisplay config={config} remaining={remaining} />;
}
