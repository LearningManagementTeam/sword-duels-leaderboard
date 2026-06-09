import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { RegionalStandingsPanel } from "@/components/sword-duels/RegionalStandingsPanel";
import { SdRegionalScoresForm } from "@/components/sword-duels/SdRegionalScoresForm";
import { priorRegionalSetType } from "@/lib/products/sword-duels/format-guards";
import {
  SD_REGIONAL_SET_ORDER,
  SD_REGIONAL_SET_LABELS,
  type SdRegionalSetType,
} from "@/lib/products/sword-duels/regional-rounds";
import { buildRegionalStandings } from "@/lib/products/sword-duels/regional-standings";
import { getSdRegionalContext } from "@/lib/products/sword-duels/queries";
import { getSdEvent } from "@/lib/products/sword-duels/queries";
import { isRegionalAverageFormat } from "@/lib/products/sword-duels/tournament-format";
import { REGIONS, REGION_LABELS, type Region } from "@/lib/scoring-config";
import { SWORD_DUELS_ADMIN, swordDuelsPath } from "@/lib/admin-routes";

export const dynamic = "force-dynamic";

function regionalLockReason(
  setType: SdRegionalSetType,
  ctx: Awaited<ReturnType<typeof getSdRegionalContext>>
): string | null {
  if (!ctx.allAreaFinalsPublished) {
    return "Publish all area finals before regional rounds.";
  }
  if (ctx.participants.length === 0) {
    return "No area representatives in this region yet.";
  }
  const prior = priorRegionalSetType(setType);
  if (prior) {
    const priorSet = ctx.sets.find((s) => s.set_type === prior);
    if (priorSet?.status !== "published") {
      return `Publish ${SD_REGIONAL_SET_LABELS[prior]} first.`;
    }
  }
  return null;
}

export default async function AdminSdRegionalScorePage({
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

  const ctx = await getSdRegionalContext(event.id, region);
  const standings = buildRegionalStandings({
    region,
    areaReps: ctx.roster.areaReps,
    sets: ctx.allSets,
    scoreMap: ctx.scoreMap,
  });

  return (
    <div className="space-y-8">
      <AdminBreadcrumb
        items={[
          { label: "Sword Duels", href: SWORD_DUELS_ADMIN },
          { label: "Regionals", href: swordDuelsPath("regionals") },
          { label: REGION_LABELS[region] },
        ]}
      />
      <div className="sd-page-header">
        <h1>{REGION_LABELS[region]} — regional rounds</h1>
        <p>
          Score each area representative once per round. Standings use the
          average of all published rounds.
        </p>
        <Link
          href={`/sword-duels/regionals/${region}`}
          className="sd-link mt-2 inline-block text-sm"
          target="_blank"
          rel="noopener noreferrer"
        >
          Public standings →
        </Link>
      </div>

      <RegionalStandingsPanel model={standings} showDraftScores />

      {SD_REGIONAL_SET_ORDER.map((setType) => {
        const set = ctx.sets.find((s) => s.set_type === setType)!;
        const lock = regionalLockReason(setType, ctx);
        const scores = set.id ? (ctx.scoreMap.get(set.id) ?? []) : [];
        return (
          <SdRegionalScoresForm
            key={setType}
            set={set}
            setType={setType}
            participants={ctx.participants}
            initialScores={scores}
            canEdit={!lock}
            lockedReason={lock}
          />
        );
      })}
    </div>
  );
}
