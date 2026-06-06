"use client";

import { usePathname } from "next/navigation";
import type { SdPublicJourneyState } from "@/lib/products/sword-duels/public-journey";
import { SdPublicJourneyBar } from "./SdPublicJourneyBar";
import { SwordDuelsPublicNav } from "./SwordDuelsPublicNav";

interface Props {
  journey: SdPublicJourneyState | null;
}

export function SwordDuelsPublicChrome({ journey }: Props) {
  const pathname = usePathname() ?? "";

  if (pathname.includes("/sword-duels/tv")) {
    return null;
  }

  return (
    <>
      <SwordDuelsPublicNav />
      {journey && journey.totalAreas > 0 && (
        <SdPublicJourneyBar journey={journey} />
      )}
    </>
  );
}
