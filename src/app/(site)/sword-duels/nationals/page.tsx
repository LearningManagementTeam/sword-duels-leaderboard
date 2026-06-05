import Link from "next/link";
import { SetupBanner } from "@/components/SetupBanner";
import { NationalsKnockoutMap } from "@/components/sword-duels/NationalsKnockoutMap";
import { NationalsWildcardMap } from "@/components/sword-duels/NationalsWildcardMap";
import { SwordDuelsPublicFooter } from "@/components/sword-duels/SwordDuelsPublicFooter";
import { wildcardScoresMap } from "@/lib/products/sword-duels/build-nationals-wildcard-model";
import {
  buildHybridKnockoutEntrants,
  buildKnockoutFromNationalsModel,
} from "@/lib/products/sword-duels/build-nationals-knockout";
import { entrantFromWildcard } from "@/lib/products/sword-duels/nationals-entrant";
import { buildNationalsKnockoutBracket } from "@/lib/products/sword-duels/nationals-knockout-bracket";
import { getSdNationalsContext } from "@/lib/products/sword-duels/nationals-queries";
import { getSdEvent } from "@/lib/products/sword-duels/queries";
import { SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sword Duels Nationals — Wild card",
};

export default async function SwordDuelsNationalsPage() {
  const configured = isSupabaseConfigured();
  if (!configured) {
    return (
      <div className="space-y-6">
        <SetupBanner />
      </div>
    );
  }

  const event = await getSdEvent();
  if (!event) {
    return (
      <p className="text-sd-muted">Sword Duels event not configured.</p>
    );
  }

  let context: Awaited<ReturnType<typeof getSdNationalsContext>> | null = null;
  try {
    context = await getSdNationalsContext(event.id);
  } catch {
    return (
      <div className="space-y-4">
        <p className="text-sd-muted">
          Nationals wildcard tables are not ready. Run migration{" "}
          <code className="text-xs">019_sd_nationals_wildcard.sql</code> (or{" "}
          <code className="text-xs">016_sword_duels_repair.sql</code>) in
          Supabase, then refresh.
        </p>
        <Link href={SWORD_DUELS_PUBLIC} className="sd-link text-sm">
          ← Back to Sword Duels
        </Link>
      </div>
    );
  }

  const { model } = context;
  const scores = wildcardScoresMap(
    context.wildcardScores,
    model.tiebreakCandidates,
    false
  );

  const wildcardEntrant =
    model.wildcardRep && model.allFieldLocked
      ? entrantFromWildcard({
          branchId: model.wildcardRep.id,
          area: model.wildcardRep.area,
          region:
            model.losers.find((l) => l.id === model.wildcardRep!.id)?.region ??
            "ncr",
          repName: model.wildcardRep.repName,
          branchName:
            model.losers.find((l) => l.id === model.wildcardRep!.id)
              ?.branchLabel ?? model.wildcardRep.area,
          branchCode:
            model.losers.find((l) => l.id === model.wildcardRep!.id)?.branchCode,
          employeeNo:
            model.losers.find((l) => l.id === model.wildcardRep!.id)?.employeeNo,
          position:
            model.losers.find((l) => l.id === model.wildcardRep!.id)?.position,
        })
      : null;

  const knockoutModel = model.allFieldLocked
    ? buildKnockoutFromNationalsModel(model)
    : buildNationalsKnockoutBracket(
        buildHybridKnockoutEntrants(
          model.areaReps,
          model.roster.totalAreaCount || 15,
          wildcardEntrant
        )
      );

  return (
    <div className="space-y-10">
      <NationalsWildcardMap
        model={model}
        scores={scores}
        confirmedWildcardId={
          model.wildcardRound?.status === "tiebreak_published"
            ? model.wildcardRound.winner_branch_id ?? undefined
            : undefined
        }
        publicView
      />

      <section className="space-y-4 border-t border-emerald-500/15 pt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sd-glow">
              Phase 3 · Nationals knockout
            </p>
            <h2 className="text-lg font-semibold text-white">
              Area vs Area bracket
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-sd-muted/80">
              {model.allFieldLocked
                ? "Full field locked — knockout pairings ready."
                : "Placeholder pairings shown until all area reps and the wild card are locked."}
            </p>
          </div>
          <Link
            href="/preview/sword-duels/nationals/knockout"
            className="sd-link text-sm"
          >
            Full placeholder preview →
          </Link>
        </div>
        <NationalsKnockoutMap
          model={knockoutModel}
          preview={!model.allFieldLocked}
        />
      </section>

      <SwordDuelsPublicFooter
        sharePath={`${SWORD_DUELS_PUBLIC}/nationals`}
        shareTitle="Share Sword Duels Nationals"
      />
    </div>
  );
}
