import { CollapsibleCompetitionMap } from "@/components/home/CollapsibleCompetitionMap";
import { HomeCarouselSection } from "@/components/home/HomeCarouselSection";
import { HomeFullLeaderboardCta } from "@/components/home/HomeFullLeaderboardCta";
import { HomeStandingsPreview } from "@/components/home/HomeStandingsPreview";
import { SetupBanner } from "@/components/SetupBanner";
import { ShareCard } from "@/components/ShareCard";
import { getPublicSiteUrl } from "@/lib/site-url";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const configured = isSupabaseConfigured();
  const siteUrl = getPublicSiteUrl();

  return (
    <div className="space-y-6 sm:space-y-8">
      <HomeStandingsPreview />

      {!configured && <SetupBanner />}

      <HomeFullLeaderboardCta />

      <HomeCarouselSection />

      <CollapsibleCompetitionMap />

      <ShareCard url={siteUrl} />
    </div>
  );
}
