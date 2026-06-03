import { redirect } from "next/navigation";
import { getCompetitionMap } from "@/lib/data/content-queries";
import { previewPhaseRegionalBoardPath } from "@/lib/public-standings-route";

export default async function PreviewJunePage() {
  const config = await getCompetitionMap();
  redirect(previewPhaseRegionalBoardPath("june", config.regionHighlight));
}
