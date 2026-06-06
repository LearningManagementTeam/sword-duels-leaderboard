import Link from "next/link";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { AreaGroupSplitPanel } from "@/components/sword-duels/AreaGroupSplitPanel";
import { AreaTournamentMap } from "@/components/sword-duels/AreaTournamentMap";
import {
  SdAreaScoreStickyNav,
  type SdAreaScoreNavItem,
} from "@/components/sword-duels/SdAreaScoreStickyNav";
import { SdSetScoresForm } from "@/components/sword-duels/SdSetScoresForm";
import { decodeAreaSlug } from "@/lib/products/sword-duels/area-groups";
import { SD_SET_FLOW } from "@/lib/products/sword-duels/scoring-config";
import {
  getSdAreaContext,
  getSdEvent,
  participantsForSetType,
} from "@/lib/products/sword-duels/queries";
import { swordDuelsPath, SWORD_DUELS_ADMIN, SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";
import { areaSlug } from "@/lib/products/sword-duels/area-groups";
import type { SdSetType } from "@/lib/products/sword-duels/types";

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
  const missingSets = sets.some((s) => !s.id);

  function setLockReason(setType: SdSetType): string | null {
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

      <AreaGroupSplitPanel
        bracket={bracket}
        groupSortMode={event.group_sort_mode}
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
                set={set}
                setType={set.set_type}
                participants={participants}
                initialScores={scoreMap.get(set.id) ?? []}
                canEdit={!lock}
                lockedReason={lock}
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
