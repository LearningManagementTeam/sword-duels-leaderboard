import { HeroLogo } from "@/components/branding/HeroLogo";
import { CollapsibleCompetitionMap } from "@/components/home/CollapsibleCompetitionMap";
import { HomeCarouselSection } from "@/components/home/HomeCarouselSection";
import { HomeStandingsPreview } from "@/components/home/HomeStandingsPreview";
import { SetupBanner } from "@/components/SetupBanner";
import { ShareCard } from "@/components/ShareCard";
import { getBranding } from "@/lib/data/content-queries";
import { getPublicSiteUrl } from "@/lib/site-url";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const configured = isSupabaseConfigured();
  const branding = await getBranding();
  const siteUrl = getPublicSiteUrl();

  return (
    <div className="space-y-6 sm:space-y-8">
      <HomeStandingsPreview />

      {!configured && <SetupBanner />}

      <div className="flex flex-col items-stretch gap-4 sm:gap-5">
        <HeroLogo branding={branding} priority layout="home" />
        <HomeCarouselSection />
      </div>

      <CollapsibleCompetitionMap />

      <ShareCard url={siteUrl} />
    </div>
  );
}
