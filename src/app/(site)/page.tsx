import { HomeEventTimeline } from "@/components/home/HomeEventTimeline";
import { HomeFeaturedHero } from "@/components/home/HomeFeaturedHero";
import { HomeProgramsStrip } from "@/components/home/HomeProgramsStrip";
import { SdPublicJourneyBar } from "@/components/sword-duels/SdPublicJourneyBar";
import { CollapsibleCompetitionMap } from "@/components/home/CollapsibleCompetitionMap";
import { CollapsibleFullTournamentMap } from "@/components/home/CollapsibleFullTournamentMap";
import { HomeCarouselSection } from "@/components/home/HomeCarouselSection";
import { SetupBanner } from "@/components/SetupBanner";
import { ShareCard } from "@/components/ShareCard";
import {
  getBranding,
  getCompetitionMap,
  getEventSchedule,
  getEventsCalendar,
  getNcPhaseSchedules,
  getSdAreaSchedules,
  getSiteHomeConfig,
} from "@/lib/data/content-queries";
import { loadHomeEventTimeline } from "@/lib/home-event-timeline";
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
  const [eventSchedule, sdAreaSchedules, ncPhaseSchedules, eventsCalendar] =
    await Promise.all([
      getEventSchedule(),
      getSdAreaSchedules(),
      getNcPhaseSchedules(),
      getEventsCalendar(),
    ]);
  const [branding, homeConfig, sdJourney, ncStatusLine, timeline] =
    await Promise.all([
      getBranding(),
      getSiteHomeConfig(),
      configured
        ? loadPublicJourneyState().catch(() => null)
        : Promise.resolve(null),
      loadNcHomeStatusLine(mapConfig),
      loadHomeEventTimeline(
        eventSchedule,
        sdAreaSchedules,
        ncPhaseSchedules,
        eventsCalendar
      ),
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

      {featured === "sword_duels" &&
        sdJourney &&
        sdJourney.totalAreas > 0 && (
          <div className="mx-auto max-w-3xl">
            <SdPublicJourneyBar journey={sdJourney} />
          </div>
        )}

      {!configured && <SetupBanner />}

      <div className="mx-auto max-w-3xl space-y-6 sm:space-y-8">
        <HomeProgramsStrip
          featured={featured}
          sdJourney={sdJourney}
          ncStatusLine={ncStatusLine}
        />
        <HomeEventTimeline
          upcoming={timeline.upcoming}
          recent={timeline.recent}
          featured={featured}
        />
        <HomeCarouselSection branding={branding} />
        <CollapsibleCompetitionMap
          mapConfig={mapConfig}
          defaultOpen={featured === "national_competitions"}
        />
        <CollapsibleFullTournamentMap
          featured={featured}
          sdTournamentFormat={sdJourney?.tournamentFormat}
        />
        <ShareCard
          url={shareUrl}
          title={shareTitle}
          description={shareDescription}
        />
      </div>
    </div>
  );
}
