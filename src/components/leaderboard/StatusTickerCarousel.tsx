import { SdCarousel, SdCarouselItem } from "@/components/ui/SdCarousel";

interface Props {
  lastPublished: string | null;
}

export function StatusTickerCarousel({ lastPublished }: Props) {
  const items = [
    "Advancing — qualified for next round",
    "Tie breaker — play-off for remaining slots",
    "Eliminated — out at published round",
  ];

  if (lastPublished) {
    const when = new Date(lastPublished).toLocaleString("en-PH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    items.push(`Last published: ${when}`);
  }

  return (
    <SdCarousel duration="30s" label="Status legend">
      {items.map((text) => (
        <SdCarouselItem key={text}>{text}</SdCarouselItem>
      ))}
    </SdCarousel>
  );
}
