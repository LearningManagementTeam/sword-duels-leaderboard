import type { Metadata } from "next";
import Link from "next/link";
import { SdAreaSchedulePanel } from "@/components/sword-duels/SdAreaSchedulePanel";
import { AreaGroupSplitPanel } from "@/components/sword-duels/AreaGroupSplitPanel";
import { AreaGroupStandingsPanel } from "@/components/sword-duels/AreaGroupStandingsPanel";
import { AreaTournamentMap } from "@/components/sword-duels/AreaTournamentMap";
import { SwordDuelsPublicFooter } from "@/components/sword-duels/SwordDuelsPublicFooter";
import { SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";
import { areaSlug, decodeAreaSlug } from "@/lib/products/sword-duels/area-groups";
import {
  getSdPublicAreaSummary,
  resolveAreaChampionDisplayName,
} from "@/lib/products/sword-duels/public-area-summary";
import {
  publishStateForArea,
} from "@/lib/products/sword-duels/area-schedules";
import { getSdAreaSchedules } from "@/lib/data/content-queries";
import {
  filterPublicScores,
  getSdPublicArea,
} from "@/lib/products/sword-duels/public-queries";
import {
  areaShareCopy,
  buildSdPageMetadata,
} from "@/lib/products/sword-duels/share-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ area: string }>;
}): Promise<Metadata> {
  const { area: areaParam } = await params;
  const area = decodeAreaSlug(areaParam);
  const sharePath = `${SWORD_DUELS_PUBLIC}/${areaSlug(area)}`;

  try {
    const ctx = await getSdPublicArea(area);
    if (ctx) {
      const championName = resolveAreaChampionDisplayName(
        ctx.sets,
        ctx.scoreMap,
        ctx.bracket
      );
      const summary = getSdPublicAreaSummary(ctx.sets, championName);
      const copy = areaShareCopy(area, summary.label, championName);
      return buildSdPageMetadata({ ...copy, path: sharePath });
    }
  } catch {
    /* fall through */
  }

  return buildSdPageMetadata({
    title: `${area} — Sword Duels`,
    description: `Live ${area} tournament bracket and standings.`,
    path: sharePath,
  });
}

export default async function SwordDuelsAreaPublicPage({
  params,
}: {
  params: Promise<{ area: string }>;
}) {
  const { area: areaParam } = await params;
  const area = decodeAreaSlug(areaParam);
  const [ctx, schedules] = await Promise.all([
    getSdPublicArea(area),
    getSdAreaSchedules(),
  ]);

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
  const championName = resolveAreaChampionDisplayName(
    sets,
    scoreMap,
    bracket
  );
  const summary = getSdPublicAreaSummary(sets, championName);
  const shareCopy = areaShareCopy(area, summary.label, championName);

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

      <SdAreaSchedulePanel
        area={area}
        config={schedules}
        publishState={publishStateForArea(sets)}
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
        shareTitle={`Share — ${shareCopy.title}`}
        shareDescription={shareCopy.description}
      />
    </div>
  );
}
