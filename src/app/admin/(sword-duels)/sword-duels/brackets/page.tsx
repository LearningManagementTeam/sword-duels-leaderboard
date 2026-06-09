import Link from "next/link";
import { AreaTournamentMap } from "@/components/sword-duels/AreaTournamentMap";
import { areaSetsForBracket } from "@/lib/products/sword-duels/public-queries";
import { getSdAreaBrackets, getSdEvent, getSdSetsForEvent, getSdSetScores, scoresBySetId } from "@/lib/products/sword-duels/queries";
import { areaSlug } from "@/lib/products/sword-duels/area-groups";
import { swordDuelsPath } from "@/lib/admin-routes";

export const dynamic = "force-dynamic";

export default async function SwordDuelsBracketsPage() {
  const event = await getSdEvent();
  if (!event) {
    return <p className="text-sd-muted">Event not configured.</p>;
  }

  const brackets = await getSdAreaBrackets(event.id);
  const sets = await getSdSetsForEvent(event.id);
  const setIds = sets.map((s) => s.id);
  const scoreRows = await getSdSetScores(setIds);
  const scoreMap = scoresBySetId(scoreRows);

  return (
    <div className="space-y-8">
      <div className="sd-page-header">
        <h1>Tournament maps</h1>
        <p>All area brackets — updates when sets are published.</p>
      </div>
      {brackets.length === 0 ? (
        <p className="text-sm text-sd-muted">
          Sync brackets from the dashboard after branches are loaded.
        </p>
      ) : (
        <div className="space-y-8">
          {brackets.map((bracket) => {
            const areaSets = areaSetsForBracket(sets, bracket.area);
            return (
              <div key={bracket.area} className="space-y-2">
                <Link
                  href={swordDuelsPath("areas", areaSlug(bracket.area))}
                  className="sd-link text-sm"
                >
                  Edit scores →
                </Link>
                <AreaTournamentMap
                  bracket={bracket}
                  sets={areaSets}
                  scoresBySetId={scoreMap}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
