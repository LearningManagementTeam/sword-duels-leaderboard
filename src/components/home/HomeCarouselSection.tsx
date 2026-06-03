import { HomePhotoCarousel } from "@/components/home/HomePhotoCarousel";
import { getActiveCarouselSlides } from "@/lib/branding";
import { getBranding } from "@/lib/data/content-queries";

export async function HomeCarouselSection() {
  const branding = await getBranding();
  const slides = getActiveCarouselSlides(branding);

  if (slides.length === 0) {
    return null;
  }

  return <HomePhotoCarousel slides={slides} />;
}
