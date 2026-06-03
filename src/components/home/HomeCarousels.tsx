import Link from "next/link";
import { SdCarousel, SdCarouselItem } from "@/components/ui/SdCarousel";

const seasons = [
  { href: "/june", label: "June", sub: "Area-wide · Top 24" },
  { href: "/july", label: "July", sub: "Regional · 3 finalists" },
  { href: "/august", label: "August", sub: "Finals" },
];

const regions = [
  { href: "/june/luzon", label: "Luzon" },
  { href: "/june/ncr", label: "NCR" },
  { href: "/june/vismin", label: "VisMin" },
];

export function HomeSeasonCarousel() {
  return (
    <SdCarousel duration="32s" label="Season path">
      {seasons.map((s) => (
        <SdCarouselItem key={s.href}>
          <Link href={s.href} className="flex items-center gap-2 hover:text-sd-glow">
            <span className="font-semibold text-sd-glow">{s.label}</span>
            <span className="text-xs text-sd-muted/80">{s.sub}</span>
          </Link>
        </SdCarouselItem>
      ))}
    </SdCarousel>
  );
}

export function HomeRegionCarousel() {
  return (
    <SdCarousel duration="28s" label="Quick region links">
      {regions.map((r) => (
        <SdCarouselItem key={r.href}>
          <Link href={r.href} className="text-sd-glow hover:text-white">
            June · {r.label} →
          </Link>
        </SdCarouselItem>
      ))}
      <SdCarouselItem>
        <Link href="/mechanics" className="hover:text-white">
          How it works →
        </Link>
      </SdCarouselItem>
    </SdCarousel>
  );
}
