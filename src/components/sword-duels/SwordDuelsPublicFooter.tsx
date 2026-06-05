import { HomeCarouselSection } from "@/components/home/HomeCarouselSection";
import { HomeSponsorLogoSection } from "@/components/home/HomeSponsorLogoSection";
import { ShareCard } from "@/components/ShareCard";
import { getBranding } from "@/lib/data/content-queries";
import { getPublicSiteUrl } from "@/lib/site-url";
import { SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";

interface Props {
  /** Path after site origin, e.g. `/sword-duels` or `/sword-duels/Area%201` */
  sharePath?: string;
  shareTitle?: string;
}

export async function SwordDuelsPublicFooter({
  sharePath = SWORD_DUELS_PUBLIC,
  shareTitle = "Share Sword Duels standings",
}: Props) {
  const branding = await getBranding();
  const shareUrl = `${getPublicSiteUrl()}${sharePath.startsWith("/") ? sharePath : `/${sharePath}`}`;

  return (
    <div className="mx-auto max-w-3xl space-y-6 pt-8">
      <HomeSponsorLogoSection branding={branding} />
      <HomeCarouselSection branding={branding} />
      <ShareCard url={shareUrl} title={shareTitle} />
    </div>
  );
}
