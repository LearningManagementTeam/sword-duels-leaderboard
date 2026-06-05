import Link from "next/link";
import { AreaGroupSplitPanel } from "@/components/sword-duels/AreaGroupSplitPanel";
import { AreaGroupStandingsPanel } from "@/components/sword-duels/AreaGroupStandingsPanel";
import { AreaTournamentMap } from "@/components/sword-duels/AreaTournamentMap";
import { SwordDuelsPublicFooter } from "@/components/sword-duels/SwordDuelsPublicFooter";
import { SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";
import { areaSlug, decodeAreaSlug } from "@/lib/products/sword-duels/area-groups";
import {
  filterPublicScores,
  getSdPublicArea,
} from "@/lib/products/sword-duels/public-queries";

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

      <AreaGroupStandingsPanel
        bracket={bracket}
        groupSets={groupSets}
        publicScores={publicScores}
        defaultOpen={groupSets.some((s) => s.status === "published")}
      />

      <SwordDuelsPublicFooter
        sharePath={`${SWORD_DUELS_PUBLIC}/${areaSlug(area)}`}
        shareTitle={`Share ${area} — Sword Duels`}
      />
    </div>
  );
}
