import { SdCarousel, SdCarouselItem } from "@/components/ui/SdCarousel";

interface Props {
  items: string[];
}

export function PhaseHighlightsCarousel({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <SdCarousel duration="36s" label="Competition highlights">
      {items.map((text) => (
        <SdCarouselItem key={text}>{text}</SdCarouselItem>
      ))}
    </SdCarousel>
  );
}
