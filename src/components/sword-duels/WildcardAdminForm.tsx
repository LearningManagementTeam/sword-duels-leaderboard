"use client";

import { useMemo, useState, useTransition } from "react";
import {
  publishSdWildcardRoundForm,
  saveSdWildcardScores,
  syncSdWildcardRoundForm,
  unpublishSdWildcardRoundForm,
} from "@/lib/actions/sword-duels-admin";
import type { NationalsWildcardModel } from "@/lib/products/sword-duels/build-nationals-wildcard-model";
import {
  previewWildcardLeader,
  wildcardScoresMap,
} from "@/lib/products/sword-duels/build-nationals-wildcard-model";
import { NationalsWildcardMap } from "./NationalsWildcardMap";
import { SdButton } from "@/components/ui/SdButton";

interface Props {
  model: NationalsWildcardModel;
}

export function WildcardAdminForm({ model }: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initialDraft = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of model.wildcardScores) {
      map[s.branch_id] = String(s.points);
    }
    return map;
  }, [model.wildcardScores]);

  const [draft, setDraft] = useState<Record<string, string>>(initialDraft);

  const candidates = model.tiebreakCandidates;
  const roundStatus = model.wildcardRound?.status;
  const canEditScores = roundStatus === "tiebreak_draft";
  const isPublished = roundStatus === "tiebreak_published";

  const numericScores = useMemo(() => {
    const out: Record<string, number> = {};
    for (const c of candidates) {
      const raw = draft[c.id] ?? "";
      const n = Number(raw);
      if (raw !== "" && !Number.isNaN(n)) out[c.id] = n;
    }
    return out;
  }, [candidates, draft]);

  const leader = previewWildcardLeader(
    candidates,
    candidates.map((c) => ({
      branch_id: c.id,
      area: c.area,
      area_final_score: c.areaFinalScore,
      points: numericScores[c.id] ?? 0,
    }))
  );

  const displayScores = wildcardScoresMap(
    model.wildcardScores.map((s) => ({
      ...s,
      points: draft[s.branch_id] !== undefined ? Number(draft[s.branch_id]) || 0 : s.points,
    })),
    candidates,
    true
  );

  function run(action: () => Promise<void>, success: string) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        await action();
        setMessage(success);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="space-y-8">
      <NationalsWildcardMap
        model={model}
        scores={displayScores}
        confirmedWildcardId={
          isPublished ? model.wildcardRound?.winner_branch_id ?? undefined : undefined
        }
        adminMode
      />

      <section className="sd-wildcard-arena space-y-4 p-5">
        <div>
          <h2 className="text-lg font-semibold text-white">Wildcard round scoring</h2>
          <p className="mt-1 text-sm text-fuchsia-100/55">
            Runs after every area final is published. Tied 2nd-highest losers enter
            this round — highest wildcard score claims slot{" "}
            {model.targetFieldSize}.
          </p>
        </div>

        {model.phase === "awaiting_areas" && (
          <div className="rounded-lg bg-purple-950/40 px-4 py-3 text-sm text-purple-100/80 ring-1 ring-purple-400/25 ring-inset">
            {model.roster.publishedAreaCount} of {model.roster.totalAreaCount}{" "}
            area finals published. Wildcard selection unlocks when all areas have
            a locked representative.
          </div>
        )}

        {model.phase === "auto_wildcard" && model.wildcardRep && (
          <div className="rounded-lg bg-purple-950/40 px-4 py-3 text-sm text-purple-100/80 ring-1 ring-purple-400/25 ring-inset">
            Auto-selected:{" "}
            <strong className="text-white">{model.wildcardRep.repName}</strong>{" "}
            (sole 2nd-highest loser score at {model.wildcardRep.areaFinalScore}{" "}
            pts). No tiebreak needed.
          </div>
        )}

        {canEditScores && candidates.length > 0 && (
          <div className="overflow-x-auto">
            <table className="sd-table w-full min-w-[28rem] text-sm">
              <thead>
                <tr>
                  <th className="text-left">Candidate</th>
                  <th className="text-left">Area</th>
                  <th className="text-right">Area-final loss</th>
                  <th className="text-right">Wildcard pts</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => (
                  <tr key={c.id}>
                    <td className="font-medium text-white">{c.repName}</td>
                    <td className="text-sd-muted">{c.area}</td>
                    <td className="text-right tabular-nums text-fuchsia-200/70">
                      {c.areaFinalScore}
                    </td>
                    <td className="text-right">
                      <input
                        type="number"
                        min={0}
                        className="sd-input w-20 text-right tabular-nums"
                        value={draft[c.id] ?? ""}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            [c.id]: e.target.value,
                          }))
                        }
                        placeholder="0"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isPublished && model.wildcardRep && (
          <p className="text-sm font-medium text-fuchsia-100">
            ✓ Slot {model.targetFieldSize} locked: {model.wildcardRep.repName}
          </p>
        )}

        {leader && canEditScores && (
          <p className="text-xs text-fuchsia-200/60">
            Current leader:{" "}
            <span className="font-semibold text-fuchsia-100">
              {leader.repName}
            </span>
          </p>
        )}

        {error && <p className="text-sm text-red-300">{error}</p>}
        {message && <p className="text-sm text-emerald-300">{message}</p>}

        <div className="flex flex-wrap gap-3">
          <SdButton
            type="button"
            disabled={pending || !canEditScores || candidates.length === 0}
            onClick={() =>
              run(
                () =>
                  saveSdWildcardScores(
                    candidates.map((c) => ({
                      branch_id: c.id,
                      points: Number(draft[c.id] ?? 0) || 0,
                    }))
                  ),
                "Draft scores saved."
              )
            }
          >
            Save draft scores
          </SdButton>
          <button
            type="button"
            disabled={pending || !canEditScores || !leader}
            onClick={() => run(publishSdWildcardRoundForm, "Wildcard published.")}
            className="rounded-lg bg-gradient-to-r from-fuchsia-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_16px_rgb(217_70_239/0.35)] disabled:opacity-40"
          >
            Publish wildcard · Slot {model.targetFieldSize}
          </button>
          {isPublished && (
            <SdButton
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() =>
                run(unpublishSdWildcardRoundForm, "Wildcard unpublished.")
              }
            >
              Unpublish wildcard
            </SdButton>
          )}
          <SdButton
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() =>
              run(syncSdWildcardRoundForm, "Wildcard state synced from area finals.")
            }
          >
            Sync from area finals
          </SdButton>
        </div>
      </section>
    </div>
  );
}
