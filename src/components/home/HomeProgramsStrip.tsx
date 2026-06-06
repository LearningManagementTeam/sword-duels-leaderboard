import Link from "next/link";
import { SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";
import type { SdPublicJourneyState } from "@/lib/products/sword-duels/public-journey";

interface Props {
  sdJourney?: SdPublicJourneyState | null;
}

function sdProgressLine(journey: SdPublicJourneyState): string {
  if (journey.knockoutComplete) {
    return "National champion crowned";
  }
  if (journey.nationalsPhase === "knockout") {
    return "Nationals knockout underway";
  }
  if (journey.areasComplete) {
    return "Wild card phase — area reps locked";
  }
  if (journey.totalAreas > 0) {
    return `${journey.areasPublished} of ${journey.totalAreas} area reps locked`;
  }
  return "Area group battles — 2 spots fight for 1 area representative";
}

export function HomeProgramsStrip({ sdJourney }: Props) {
  const sdSubtitle =
    sdJourney && sdJourney.totalAreas > 0
      ? sdProgressLine(sdJourney)
      : "Area group battles — 2 spots fight for 1 area representative";

  return (
    <section className="sd-neon-panel mx-auto max-w-3xl p-5">
      <h2 className="text-base font-semibold text-white">Programs</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Link
          href="/june"
          className="sd-inset block rounded-lg p-4 transition hover:ring-1 hover:ring-emerald-400/25"
        >
          <p className="font-medium text-white">National Competitions</p>
          <p className="mt-1 text-xs text-sd-muted">
            June area-wide → July regional → The Nationals
          </p>
        </Link>
        <Link
          href={SWORD_DUELS_PUBLIC}
          className="sd-inset block rounded-lg p-4 transition hover:ring-1 hover:ring-cyan-400/25"
        >
          <p className="font-medium text-white">Sword Duels</p>
          <p className="mt-1 text-xs text-sd-muted">{sdSubtitle}</p>
          {sdJourney &&
            !sdJourney.areasComplete &&
            sdJourney.totalAreas > 0 && (
              <div className="sd-neon-track mt-2.5 h-1 overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-lime-400 transition-all"
                  style={{
                    width: `${Math.round((sdJourney.areasPublished / sdJourney.totalAreas) * 100)}%`,
                  }}
                />
              </div>
            )}
        </Link>
      </div>
    </section>
  );
}
