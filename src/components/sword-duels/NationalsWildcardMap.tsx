"use client";

import Link from "next/link";
import type { NationalsWildcardModel } from "@/lib/products/sword-duels/build-nationals-wildcard-model";
import { wildcardScoresMap } from "@/lib/products/sword-duels/build-nationals-wildcard-model";
import { swordDuelsPath, SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";
import { NationalsRepGrid } from "./NationalsRepGrid";
import { NationalsWildcardSlot } from "./NationalsWildcardSlot";
import { WildcardRoundArena } from "./WildcardRoundArena";

interface Props {
  model: NationalsWildcardModel;
  scores: Record<string, number>;
  confirmedWildcardId?: string;
  adminMode?: boolean;
  tvMode?: boolean;
  /** Public view hides draft wildcard scores until published */
  publicView?: boolean;
}

export function NationalsWildcardMap({
  model,
  scores,
  confirmedWildcardId,
  adminMode = false,
  tvMode = false,
  publicView = false,
}: Props) {
  const showTiebreak =
    model.phase === "tiebreak_pending" || model.phase === "tiebreak_resolved";

  const wildcardPhase =
    model.phase === "auto_wildcard"
      ? "auto"
      : model.phase === "tiebreak_resolved"
        ? "resolved"
        : model.phase === "tiebreak_pending"
          ? "pending"
          : "empty";

  const arenaScores =
    publicView && model.wildcardRound?.status === "tiebreak_draft"
      ? {}
      : wildcardScoresMap(
          model.wildcardScores.map((s) => ({
            ...s,
            points: scores[s.branch_id] ?? s.points,
          })),
          model.tiebreakCandidates,
          !publicView
        );

  const repCount = model.roster.publishedAreaCount;
  const totalAreas = model.roster.totalAreaCount;
  const wildcardSlot = model.targetFieldSize;

  return (
    <div className="space-y-8">
      <div className="sd-neon-panel overflow-hidden p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-stretch overflow-hidden rounded-lg shadow-lg">
              <span className="bg-gradient-to-r from-emerald-400 to-lime-400 px-4 py-1.5 text-sm font-black uppercase tracking-widest text-sd-deep">
                Sword Duels
              </span>
              <span className="bg-fuchsia-500/25 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-fuchsia-100 ring-1 ring-inset ring-fuchsia-400/40">
                Nationals
              </span>
            </div>
            <h2
              className={`mt-3 font-bold text-white ${tvMode ? "text-3xl" : "text-xl"}`}
            >
              Road to {wildcardSlot}
            </h2>
            <p className={`mt-1 text-sd-muted ${tvMode ? "text-base" : "text-sm"}`}>
              {repCount} of {totalAreas} area representatives locked · Wild card
              fills slot {wildcardSlot}
            </p>
          </div>
          <div className="rounded-xl bg-emerald-500/10 px-4 py-3 text-right ring-1 ring-emerald-400/25 ring-inset">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200/80">
              Field size
            </p>
            <p className="text-2xl font-black tabular-nums text-white">
              {model.lockedCount} / {wildcardSlot}
            </p>
            <p className="text-[10px] text-sd-muted/70">
              {model.allFieldLocked ? "Full roster" : "Wildcard pending"}
            </p>
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sd-glow">
              Phase 1 · Area champions
            </p>
            <h3 className="text-lg font-semibold text-white">
              {repCount} locked representative{repCount === 1 ? "" : "s"}
            </h3>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ring-1 ring-inset ${
              model.roster.allAreaFinalsPublished
                ? "bg-emerald-500/15 text-emerald-100 ring-emerald-400/30"
                : "bg-sd-deep/50 text-sd-muted/75 ring-emerald-800/35"
            }`}
          >
            {model.roster.allAreaFinalsPublished
              ? "All areas complete"
              : `${totalAreas - repCount} area${totalAreas - repCount === 1 ? "" : "s"} remaining`}
          </span>
        </div>
        {repCount > 0 ? (
          <NationalsRepGrid reps={model.areaReps} tvMode={tvMode} />
        ) : (
          <p className="text-sm text-sd-muted/70">
            Area representatives appear here as each area final is published.
          </p>
        )}
      </section>

      <div className="flex justify-center" aria-hidden>
        <div className="flex flex-col items-center gap-1">
          <div className="h-8 w-px bg-gradient-to-b from-emerald-400/50 to-fuchsia-400/50" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-fuchsia-300/70">
            Then wildcard
          </span>
          <div className="h-8 w-px bg-gradient-to-b from-fuchsia-400/50 to-transparent" />
        </div>
      </div>

      <section className="space-y-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fuchsia-300/90">
            Phase 2 · Wild card
          </p>
          <h3 className="text-lg font-semibold text-white">
            Slot {wildcardSlot}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-sd-muted/80">
            Among all area-final losers, the rep at the{" "}
            <span className="text-fuchsia-200/90">2nd-highest score tier</span>{" "}
            earns the wild card. Ties open the wildcard round below.
          </p>
        </div>

        {model.phase === "awaiting_areas" ? (
          <div className="sd-inset mx-auto max-w-md rounded-xl px-4 py-6 text-center text-sm text-sd-muted/70">
            Wildcard selection unlocks once all {totalAreas} area finals are
            published.
          </div>
        ) : (
          <>
            <div className="flex justify-center">
              <NationalsWildcardSlot
                rep={model.wildcardRep}
                phase={wildcardPhase}
                tiedScore={model.tiedScore}
                tvMode={tvMode}
              />
            </div>

            {showTiebreak && model.tiebreakCandidates.length > 0 && (
              <WildcardRoundArena
                candidates={model.tiebreakCandidates}
                scores={arenaScores}
                tiedScore={model.tiedScore}
                confirmedId={confirmedWildcardId}
                tvMode={tvMode}
              />
            )}

            {model.phase === "auto_wildcard" && model.wildcardRep && (
              <p className="text-center text-xs text-fuchsia-200/55">
                No tiebreak needed —{" "}
                <span className="font-medium text-fuchsia-100/90">
                  {model.wildcardRep.repName}
                </span>{" "}
                had the sole 2nd-highest loser score (
                {model.wildcardRep.areaFinalScore} pts).
              </p>
            )}
          </>
        )}
      </section>

      {adminMode && (
        <p className="text-center text-[10px] text-sd-muted/55">
          Scoring controls are below. Publish updates the live nationals map.
        </p>
      )}

      {!adminMode && (
        <p className="text-center text-[10px] text-sd-muted/55">
          <Link href={swordDuelsPath("nationals")} className="sd-link">
            Admin wildcard scoring →
          </Link>
          {" · "}
          <Link href={SWORD_DUELS_PUBLIC} className="sd-link">
            Area tournaments
          </Link>
        </p>
      )}
    </div>
  );
}
