import Link from "next/link";
import { HeroLogo } from "@/components/branding/HeroLogo";
import { CompetitionMapPanel } from "@/components/competition/CompetitionMapPanel";
import { HomeCarouselSection } from "@/components/home/HomeCarouselSection";
import { HomeLastPublished } from "@/components/home/HomeLastPublished";
import { HomeStandingsHub } from "@/components/home/HomeStandingsHub";
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
    <div className="space-y-8">
      <HeroLogo branding={branding} priority />

      <HomeCarouselSection />

      <CompetitionMapPanel />

      {!configured && <SetupBanner />}

      <HomeStandingsHub />

      <HomeLastPublished />

      <ShareCard url={siteUrl} />

      <p className="text-sm text-sd-muted/70">
        Want to see sample data first?{" "}
        <Link
          href="/preview"
          className="text-sd-glow underline hover:text-emerald-200"
        >
          Open preview leaderboards
        </Link>
      </p>
    </div>
  );
}
