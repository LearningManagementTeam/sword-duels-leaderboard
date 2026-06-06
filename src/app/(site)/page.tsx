import { HomeFeaturedHero } from "@/components/home/HomeFeaturedHero";
import { HomeProgramsStrip } from "@/components/home/HomeProgramsStrip";
import { CollapsibleCompetitionMap } from "@/components/home/CollapsibleCompetitionMap";
import { HomeCarouselSection } from "@/components/home/HomeCarouselSection";
import { SetupBanner } from "@/components/SetupBanner";
import { ShareCard } from "@/components/ShareCard";
import {
  getBranding,
  getCompetitionMap,
  getSiteHomeConfig,
} from "@/lib/data/content-queries";
import { loadNcHomeStatusLine } from "@/lib/home-nc-status";
import { SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";
import { loadPublicJourneyState } from "@/lib/products/sword-duels/public-journey";
import {
  buildSdPageMetadata,
  journeyShareCopy,
} from "@/lib/products/sword-duels/share-metadata";
import { resolveFeaturedProgram } from "@/lib/site-home-config";
import { getPublicSiteUrl } from "@/lib/site-url";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const revalidate = 30;

export async function generateMetadata(): Promise<Metadata> {
  const [homeConfig, sdJourney] = await Promise.all([
    getSiteHomeConfig(),
    loadPublicJourneyState().catch(() => null),
  ]);
  const featured = resolveFeaturedProgram(homeConfig, sdJourney);

  if (featured === "sword_duels") {
    const copy = journeyShareCopy(sdJourney);
    return buildSdPageMetadata({ ...copy, path: SWORD_DUELS_PUBLIC });
  }

  const mapConfig = await getCompetitionMap();
  return {
    title: "Sword Duels Leaderboard",
    description:
      mapConfig.publicCaption ||
      "Dynamic leaderboard for June Area-wide, July Regional, and The Nationals",
  };
}

export default async function HomePage() {
  const configured = isSupabaseConfigured();
  const siteUrl = getPublicSiteUrl();
  const mapConfig = await getCompetitionMap();
  const [branding, homeConfig, sdJourney, ncStatusLine] = await Promise.all([
    getBranding(),
    getSiteHomeConfig(),
    configured
      ? loadPublicJourneyState().catch(() => null)
      : Promise.resolve(null),
    loadNcHomeStatusLine(mapConfig),
  ]);

  const featured = resolveFeaturedProgram(homeConfig, sdJourney);
  const sdShare = journeyShareCopy(sdJourney);
  const shareUrl =
    featured === "sword_duels"
      ? `${siteUrl}${SWORD_DUELS_PUBLIC}`
      : siteUrl;
  const shareTitle =
    featured === "sword_duels"
      ? `Share — ${sdShare.title}`
      : "Share this leaderboard";
  const shareDescription =
    featured === "sword_duels"
      ? sdShare.description
      : mapConfig.publicCaption ||
        "Scan the code or copy the link so branches can follow live standings.";

  return (
    <div className="space-y-6 sm:space-y-8">
      <HomeFeaturedHero
        featured={featured}
        branding={branding}
        mapConfig={mapConfig}
        homeConfig={homeConfig}
        sdJourney={sdJourney}
      />

      {!configured && <SetupBanner />}

      <div className="mx-auto max-w-3xl space-y-6 sm:space-y-8">
        <HomeProgramsStrip
          featured={featured}
          sdJourney={sdJourney}
          ncStatusLine={ncStatusLine}
        />
        <HomeCarouselSection branding={branding} />
        <CollapsibleCompetitionMap mapConfig={mapConfig} />
        <ShareCard
          url={shareUrl}
          title={shareTitle}
          description={shareDescription}
        />
      </div>
    </div>
  );
}
