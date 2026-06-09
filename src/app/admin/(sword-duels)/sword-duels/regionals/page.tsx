import Link from "next/link";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { buildRegionalStandings } from "@/lib/products/sword-duels/regional-standings";
import { loadNationalsRoster } from "@/lib/products/sword-duels/nationals-wildcard-data";
import {
  getSdEvent,
  getSdSetsForEvent,
  getSdSetScores,
  scoresBySetId,
} from "@/lib/products/sword-duels/queries";
import { isRegionalAverageFormat } from "@/lib/products/sword-duels/tournament-format";
import { REGIONS, REGION_LABELS } from "@/lib/scoring-config";
import { SWORD_DUELS_ADMIN, swordDuelsPath } from "@/lib/admin-routes";

export const dynamic = "force-dynamic";

export default async function AdminSdRegionalsPage() {
  const event = await getSdEvent();
  if (!event) {
    return <p className="text-sd-muted">Sword Duels event not configured.</p>;
  }

  if (!isRegionalAverageFormat(event.tournament_format)) {
    return (
      <div className="space-y-4">
        <AdminBreadcrumb
          items={[
            { label: "Sword Duels", href: SWORD_DUELS_ADMIN },
            { label: "Regionals" },
          ]}
        />
        <p className="text-sd-muted">
          Regional rounds are only used in{" "}
          <strong className="text-white">Version 2</strong>. Switch format on the{" "}
          <Link href={SWORD_DUELS_ADMIN} className="sd-link">
            dashboard
          </Link>
          .
        </p>
      </div>
    );
  }

  const [roster, sets] = await Promise.all([
    loadNationalsRoster(event.id),
    getSdSetsForEvent(event.id),
  ]);
  const regionalIds = sets
    .filter((s) => s.set_type.startsWith("regional_"))
    .map((s) => s.id);
  const scoreMap = scoresBySetId(await getSdSetScores(regionalIds));

  return (
    <div className="space-y-6">
      <AdminBreadcrumb
        items={[
          { label: "Sword Duels", href: SWORD_DUELS_ADMIN },
          { label: "Regional rounds" },
        ]}
      />
      <div className="sd-page-header">
        <h1>Regional rounds</h1>
        <p>
          After all area finals are published, score three rounds per region
          (Luzon, NCR, VisMin). Highest average wins the regional slot for
          finals.
        </p>
        {!roster.allAreaFinalsPublished && (
          <p className="mt-2 text-sm text-amber-200/90">
            {roster.publishedAreaCount} of {roster.totalAreaCount} area finals
            published — finish area battles before regional scoring.
          </p>
        )}
      </div>

      <ul className="grid gap-4 sm:grid-cols-3">
        {REGIONS.map((region) => {
          const standings = buildRegionalStandings({
            region,
            areaReps: roster.areaReps,
            sets,
            scoreMap,
          });
          return (
            <li key={region} className="sd-neon-panel p-4">
              <h2 className="font-semibold text-white">
                {REGION_LABELS[region]}
              </h2>
              <p className="mt-1 text-sm text-sd-muted">
                {standings.rows.length} area rep
                {standings.rows.length === 1 ? "" : "s"} ·{" "}
                {standings.roundsPublished}/3 rounds published
              </p>
              {standings.champion && (
                <p className="mt-2 text-sm text-emerald-200">
                  Leader: {standings.champion.repName} (
                  {standings.champion.average?.toFixed(2)} avg)
                </p>
              )}
              <Link
                href={swordDuelsPath("regionals", region)}
                className="sd-link mt-3 inline-block text-sm font-medium"
              >
                Score rounds →
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
