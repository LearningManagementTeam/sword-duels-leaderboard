import { CollapsibleCompetitionMap } from "@/components/home/CollapsibleCompetitionMap";
import { HomeCarouselSection } from "@/components/home/HomeCarouselSection";
import { HomeStandingsPreview } from "@/components/home/HomeStandingsPreview";
import { SetupBanner } from "@/components/SetupBanner";
import { ShareCard } from "@/components/ShareCard";
import { getBranding, getCompetitionMap } from "@/lib/data/content-queries";
import { getPublicSiteUrl } from "@/lib/site-url";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const revalidate = 30;

export default async function HomePage() {
  const configured = isSupabaseConfigured();
  const siteUrl = getPublicSiteUrl();
  const [mapConfig, branding] = await Promise.all([
    getCompetitionMap(),
    getBranding(),
  ]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <HomeStandingsPreview mapConfig={mapConfig} branding={branding} />

      {!configured && <SetupBanner />}

      <div className="mx-auto max-w-3xl space-y-6 sm:space-y-8">
        <HomeCarouselSection branding={branding} />
        <CollapsibleCompetitionMap mapConfig={mapConfig} />
        <ShareCard url={siteUrl} />
      </div>
    </div>
  );
}
