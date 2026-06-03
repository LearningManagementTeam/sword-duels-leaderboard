import { HomeSponsorLogoCarousel } from "@/components/home/HomeSponsorLogoCarousel";
import { getActiveSponsorLogos, type BrandingConfig } from "@/lib/branding";

interface Props {
  branding: BrandingConfig;
}

export function HomeSponsorLogoSection({ branding }: Props) {
  const logos = getActiveSponsorLogos(branding);

  if (logos.length === 0) {
    return null;
  }

  return <HomeSponsorLogoCarousel logos={logos} />;
}
