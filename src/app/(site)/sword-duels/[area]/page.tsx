import Link from "next/link";
import { AreaGroupSplitPanel } from "@/components/sword-duels/AreaGroupSplitPanel";
import { AreaTournamentMap } from "@/components/sword-duels/AreaTournamentMap";
import { SwordDuelsPublicFooter } from "@/components/sword-duels/SwordDuelsPublicFooter";
import { SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";
import { areaSlug, decodeAreaSlug } from "@/lib/products/sword-duels/area-groups";
import {
  filterPublicScores,
  getSdPublicArea,
} from "@/lib/products/sword-duels/public-queries";
import { computeSetResults } from "@/lib/products/sword-duels/scoring";
import { SD_SET_LABELS } from "@/lib/products/sword-duels/types";

export const revalidate = 30;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ area: string }>;
}) {
  const { area: areaParam } = await params;
  const area = decodeAreaSlug(areaParam);
  return { title: `${area} — Sword Duels` };
}

export default async function SwordDuelsAreaPublicPage({
  params,
}: {
  params: Promise<{ area: string }>;
}) {
  const { area: areaParam } = await params;
  const area = decodeAreaSlug(areaParam);
  const ctx = await getSdPublicArea(area);

  if (!ctx) {
    return (
      <div className="space-y-4">
        <p className="text-sd-muted">Area not found.</p>
        <Link href={SWORD_DUELS_PUBLIC} className="sd-link">
          ← Sword Duels
        </Link>
      </div>
    );
  }

  const { bracket, sets, scoreMap, event } = ctx;
  const publicScores = filterPublicScores(sets, scoreMap);

  const groupSets = sets.filter(
    (s) => s.set_type === "group_a" || s.set_type === "group_b"
  );

  return (
    <div className="space-y-8">
      <div className="sd-page-header">
        <Link href={SWORD_DUELS_PUBLIC} className="sd-link text-sm">
          ← All areas
        </Link>
        <h1>{area}</h1>
        <p>Live tournament map — updates when the committee publishes each set.</p>
        <p className="mt-2">
          <Link
            href={`${SWORD_DUELS_PUBLIC}/tv?area=${encodeURIComponent(area)}`}
            className="sd-link text-sm"
          >
            Open TV bracket view →
          </Link>
        </p>
      </div>

      <AreaGroupSplitPanel
        bracket={bracket}
        groupSortMode={event.group_sort_mode}
      />

      <AreaTournamentMap
        bracket={bracket}
        sets={sets}
        scoresBySetId={publicScores}
      />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Group standings</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {groupSets.map((set) => {
            const pool =
              set.set_type === "group_a" ? bracket.groupA : bracket.groupB;
            const scores = publicScores.get(set.id) ?? [];
            const { ranked } = computeSetResults(
              pool,
              scores,
              set.scoring_mode
            );
            const published = set.status === "published";

            return (
              <div key={set.id} className="sd-neon-panel p-4">
                <h3 className="font-medium text-white">
                  {SD_SET_LABELS[set.set_type]}
                </h3>
                {!published ? (
                  <p className="mt-2 text-sm text-sd-muted">Awaiting results</p>
                ) : (
                  <ol className="mt-3 space-y-2 text-sm">
                    {ranked.map((r) => (
                      <li
                        key={r.branch_id}
                        className={`flex justify-between gap-2 ${
                          r.is_winner ? "text-emerald-300" : "text-sd-muted"
                        }`}
                      >
                        <span>
                          #{r.rank} {r.active_representative_name ?? r.branch_name}
                          {r.is_winner && " ★"}
                        </span>
                        <span className="tabular-nums">{r.points}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <SwordDuelsPublicFooter
        sharePath={`${SWORD_DUELS_PUBLIC}/${areaSlug(area)}`}
        shareTitle={`Share ${area} — Sword Duels`}
      />
    </div>
  );
}
