import { HomeSdHero } from "@/components/home/HomeSdHero";
import { HomeStandingsPreview } from "@/components/home/HomeStandingsPreview";
import type { BrandingConfig } from "@/lib/branding";
import type { CompetitionMapConfig } from "@/lib/competition-map";
import type { SdPublicJourneyState } from "@/lib/products/sword-duels/public-journey";
import type { ResolvedFeaturedProgram, SiteHomeConfig } from "@/lib/site-home-config";

interface Props {
  featured: ResolvedFeaturedProgram;
  branding: BrandingConfig;
  mapConfig: CompetitionMapConfig;
  homeConfig: SiteHomeConfig;
  sdJourney: SdPublicJourneyState | null;
}

export async function HomeFeaturedHero({
  featured,
  branding,
  mapConfig,
  homeConfig,
  sdJourney,
}: Props) {
  if (featured === "sword_duels") {
    return (
      <HomeSdHero
        branding={branding}
        journey={sdJourney}
        homeConfig={homeConfig}
      />
    );
  }

  return (
    <HomeStandingsPreview
      mapConfig={mapConfig}
      branding={branding}
      homeConfig={homeConfig}
    />
  );
}
