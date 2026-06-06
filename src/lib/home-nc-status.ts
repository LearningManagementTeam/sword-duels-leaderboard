import { getMilestoneMeta } from "@/lib/competition-map";
import type { CompetitionMapConfig } from "@/lib/competition-map";
import { getLatestPublishedRoundNumber, getSeasonBySlug } from "@/lib/data/queries";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export async function loadNcHomeStatusLine(
  mapConfig: CompetitionMapConfig
): Promise<string> {
  if (!isSupabaseConfigured()) {
    return mapConfig.publicCaption || "June area-wide → July regional → The Nationals";
  }

  const meta = getMilestoneMeta(mapConfig.milestoneId);
  if (meta.seasonSlug) {
    const season = await getSeasonBySlug(meta.seasonSlug);
    if (season) {
      const round = await getLatestPublishedRoundNumber(season.id);
      if (round > 0) {
        const phase =
          meta.seasonSlug === "june_area"
            ? "June"
            : meta.seasonSlug === "july_region"
              ? "July"
              : "The Nationals";
        return `${phase} · Round ${round} published`;
      }
    }
  }

  return (
    mapConfig.publicCaption.trim() ||
    "June area-wide → July regional → The Nationals"
  );
}
