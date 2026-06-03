import { redirect } from "next/navigation";
import { getCompetitionMap } from "@/lib/data/content-queries";
import { phaseRegionalBoardPath } from "@/lib/public-standings-route";

export const revalidate = 30;

export default async function JunePage() {
  const config = await getCompetitionMap();
  redirect(phaseRegionalBoardPath("june", config.regionHighlight));
}
