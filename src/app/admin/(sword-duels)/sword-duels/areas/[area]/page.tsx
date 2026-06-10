import Link from "next/link";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { AreaBattleSchedulesEditor } from "@/components/sword-duels/admin/AreaBattleSchedulesEditor";
import { AreaGroupAssignmentEditor } from "@/components/sword-duels/admin/AreaGroupAssignmentEditor";
import { getSdAreaSchedules } from "@/lib/data/content-queries";
import { isManualAreaGroup } from "@/lib/products/sword-duels/area-groups";
import { AreaTournamentMap } from "@/components/sword-duels/AreaTournamentMap";
import {
  SdAreaScoreStickyNav,
  type SdAreaScoreNavItem,
} from "@/components/sword-duels/SdAreaScoreStickyNav";
import { SdSetScoresForm } from "@/components/sword-duels/SdSetScoresForm";
import { decodeAreaSlug } from "@/lib/products/sword-duels/area-groups";
import { SD_SET_FLOW } from "@/lib/products/sword-duels/scoring-config";
import {
  getSdAreaBranches,
  getSdAreaContext,
  getSdEvent,
  participantsForSetType,
} from "@/lib/products/sword-duels/queries";
import { swordDuelsPath, SWORD_DUELS_ADMIN, SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";
import { areaSlug } from "@/lib/products/sword-duels/area-groups";
import { isRegionalAverageFormat } from "@/lib/products/sword-duels/tournament-format";
import type { SdAreaSetType } from "@/lib/products/sword-duels/types";

export const dynamic = "force-dynamic";

export default async function SwordDuelsAreaPage({
  params,
}: {
  params: Promise<{ area: string }>;
}) {
  const { area: areaParam } = await params;
  const area = decodeAreaSlug(areaParam);
  const event = await getSdEvent();
  if (!event) {
    return <p className="text-sd-muted">Event not found.</p>;
  }

  const ctx = await getSdAreaContext(event.id, area);
  if (!ctx) {
    return (
      <div className="space-y-4">
        <p className="text-sd-muted">Area not found: {area}</p>
        <Link href={swordDuelsPath("areas")} className="sd-link">
          ← All areas
        </Link>
      </div>
    );
  }

  const { bracket, sets, scoreMap } = ctx;
  const schedules = await getSdAreaSchedules();
  const areaSchedule = schedules.byArea[area] ?? {};
  const areaBranches = await getSdAreaBranches(area);
  const isManual = isManualAreaGroup(event.manual_area_groups ?? [], area);
  const groupLockReason = (() => {
    const ga = sets.find((s) => s.set_type === "group_a");
    const gb = sets.find((s) => s.set_type === "group_b");
    if (ga?.status === "published" || gb?.status === "published") {
      return "Group A or Group B is already published — unpublish before changing groups.";
    }
    const fin = sets.find((s) => s.set_type === "area_final");
    if (fin?.status === "published") {
      return "Area final is published — groups are locked.";
    }
    return null;
  })();
  const missingSets = sets.some((s) => !s.id);
  const isV2 = isRegionalAverageFormat(event.tournament_format);
  const areaFinalUnpublishWarning = isV2
    ? "This can reset regional rounds and national finals progress. Only unpublish if the area final result was entered in error."
    : undefined;

  function setLockReason(setType: SdAreaSetType): string | null {
    if (setType === "area_final") {
      const ga = sets.find((s) => s.set_type === "group_a");
      const gb = sets.find((s) => s.set_type === "group_b");
      if (ga?.status !== "published" || gb?.status !== "published") {
        return "Publish Set 1 (Group A) and Set 2 (Group B) before the area final.";
      }
    }
    return null;
  }

  const scoreNavItems: SdAreaScoreNavItem[] = SD_SET_FLOW.map((step) => {
    const set = sets.find((s) => s.set_type === step.key);
    const lock = setLockReason(step.key);
    let status: SdAreaScoreNavItem["status"] = "locked";
    if (set?.id && !lock) {
      status = set.status === "published" ? "published" : "draft";
    }
    return {
      setType: step.key,
      title: step.title,
      status,
    };
  });

  return (
    <div className="space-y-8 pb-24">
      <AdminBreadcrumb
        items={[
          { label: "Sword Duels", href: SWORD_DUELS_ADMIN },
          { label: "Areas", href: swordDuelsPath("areas") },
          { label: area },
        ]}
      />
      <div className="sd-page-header">
        <h1>{area}</h1>
        <p>
          Two group battles produce Spot 1 and Spot 2; the area final crowns one
          area representative.
        </p>
        <p className="mt-2 text-sm">
          <Link
            href={`${SWORD_DUELS_PUBLIC}/${areaSlug(area)}`}
            className="sd-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open public area map →
          </Link>
        </p>
      </div>

      <AreaBattleSchedulesEditor area={area} initial={areaSchedule} />

      <AreaGroupAssignmentEditor
        area={area}
        areaBranches={areaBranches.map((b) => ({
          id: b.id,
          branch_code: b.branch_code,
          branch_name: b.branch_name,
          representative_1: b.representative_1,
          representative_2: b.representative_2,
        }))}
        bracket={bracket}
        groupSortMode={event.group_sort_mode ?? "branch_code"}
        isManual={isManual}
        lockedReason={groupLockReason}
      />

      {missingSets ? (
        <div className="sd-neon-panel p-4 text-sm text-amber-100">
          Sets not initialized for this area.{" "}
          <Link href={SWORD_DUELS_ADMIN} className="sd-link">
            Sync brackets from the dashboard
          </Link>{" "}
          first.
        </div>
      ) : (
        <AreaTournamentMap
          bracket={bracket}
          sets={sets}
          scoresBySetId={scoreMap}
          scheduleConfig={schedules}
        />
      )}

      <section className="space-y-6">
        <h2 className="text-lg font-semibold text-white">Score entry</h2>
        {sets.map((set) => {
          if (!set.id) return null;
          const lock = setLockReason(set.set_type);
          const participants = participantsForSetType(
            bracket,
            set.set_type,
            sets
          );
          return (
            <div key={set.set_type} id={set.set_type} className="scroll-mt-24">
              <SdSetScoresForm
                key={`${set.id}-${set.status}`}
                set={set}
                setType={set.set_type}
                participants={participants}
                initialScores={scoreMap.get(set.id) ?? []}
                canEdit={!lock}
                lockedReason={lock}
                areaFinalUnpublishWarning={
                  set.set_type === "area_final"
                    ? areaFinalUnpublishWarning
                    : undefined
                }
              />
            </div>
          );
        })}
      </section>

      <section className="sd-inset rounded-lg p-4 text-sm text-sd-muted">
        <p className="font-medium text-white">Mechanics reminder</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          {SD_SET_FLOW.map((step) => (
            <li key={step.key}>
              <strong className="text-white">{step.title}</strong> —{" "}
              {step.description}
            </li>
          ))}
        </ol>
      </section>

      {!missingSets && <SdAreaScoreStickyNav area={area} items={scoreNavItems} />}
    </div>
  );
}
