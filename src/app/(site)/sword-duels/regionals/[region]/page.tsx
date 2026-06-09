import Link from "next/link";
import { notFound } from "next/navigation";
import { RegionalStandingsPanel } from "@/components/sword-duels/RegionalStandingsPanel";
import { SwordDuelsPublicFooter } from "@/components/sword-duels/SwordDuelsPublicFooter";
import { buildRegionalStandings } from "@/lib/products/sword-duels/regional-standings";
import { loadNationalsRoster } from "@/lib/products/sword-duels/nationals-wildcard-data";
import {
  getSdEvent,
  getSdSetsForEvent,
  getSdSetScores,
  scoresBySetId,
} from "@/lib/products/sword-duels/queries";
import { isRegionalAverageFormat } from "@/lib/products/sword-duels/tournament-format";
import { REGIONS, REGION_LABELS, type Region } from "@/lib/scoring-config";
import { SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";

export const dynamic = "force-dynamic";

export default async function SwordDuelsRegionalPublicPage({
  params,
}: {
  params: Promise<{ region: string }>;
}) {
  const { region: regionParam } = await params;
  if (!(REGIONS as readonly string[]).includes(regionParam)) {
    notFound();
  }
  const region = regionParam as Region;

  const event = await getSdEvent();
  if (!event || !isRegionalAverageFormat(event.tournament_format)) {
    notFound();
  }

  const [roster, sets] = await Promise.all([
    loadNationalsRoster(event.id),
    getSdSetsForEvent(event.id),
  ]);
  const publishedRegionalIds = sets
    .filter(
      (s) =>
        s.area === region &&
        s.set_type.startsWith("regional_") &&
        s.status === "published"
    )
    .map((s) => s.id);
  const scoreMap = scoresBySetId(await getSdSetScores(publishedRegionalIds));

  const standings = buildRegionalStandings({
    region,
    areaReps: roster.areaReps,
    sets: sets.filter(
      (s) =>
        s.status === "published" ||
        (s.area === region && s.set_type.startsWith("regional_"))
    ),
    scoreMap,
  });

  return (
    <div className="space-y-8">
      <div className="sd-page-header">
        <Link href={SWORD_DUELS_PUBLIC} className="sd-link text-sm">
          ← Sword Duels
        </Link>
        <h1>{REGION_LABELS[region]} regional standings</h1>
        <p>
          Area representatives compete in three rounds. Highest average advances
          to the national finals.
        </p>
        <p className="mt-2 text-sm">
          <Link href={`${SWORD_DUELS_PUBLIC}/nationals`} className="sd-link">
            National finals →
          </Link>
        </p>
      </div>

      <RegionalStandingsPanel model={standings} />

      <SwordDuelsPublicFooter
        sharePath={`${SWORD_DUELS_PUBLIC}/regionals/${region}`}
        shareTitle={`${REGION_LABELS[region]} — Sword Duels regional standings`}
        shareDescription={`Live ${REGION_LABELS[region]} regional averages for Sword Duels.`}
      />
    </div>
  );
}
