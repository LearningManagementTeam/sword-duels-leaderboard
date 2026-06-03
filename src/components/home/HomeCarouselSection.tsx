import { HomePhotoCarousel } from "@/components/home/HomePhotoCarousel";
import { getActiveCarouselSlides, type BrandingConfig } from "@/lib/branding";

interface Props {
  branding: BrandingConfig;
}

export async function HomeCarouselSection({ branding }: Props) {
  const slides = getActiveCarouselSlides(branding);

  if (slides.length === 0) {
    return null;
  }

  return <HomePhotoCarousel slides={slides} />;
}
