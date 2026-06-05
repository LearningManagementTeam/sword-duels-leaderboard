"use client";

import { useMemo, useState, useTransition } from "react";
import {
  KNOCKOUT_ROUND_LABELS,
  type KnockoutMatch,
} from "@/lib/products/sword-duels/nationals-knockout-bracket";
import type { NationalsKnockoutModel } from "@/lib/products/sword-duels/nationals-knockout-bracket";
import type { NationalsWildcardModel } from "@/lib/products/sword-duels/build-nationals-wildcard-model";
import type { SdKnockoutMatch } from "@/lib/products/sword-duels/types";
import {
  publishSdKnockoutMatchForm,
  saveSdKnockoutMatchScores,
  syncSdKnockoutBracketForm,
  unpublishSdKnockoutMatchForm,
} from "@/lib/actions/sword-duels-admin";
import { scoresMapForMatch } from "@/lib/products/sword-duels/merge-knockout-model";
import { NationalsKnockoutMap } from "./NationalsKnockoutMap";
import { SdButton } from "@/components/ui/SdButton";

interface Props {
  wildcardModel: NationalsWildcardModel;
  knockoutModel: NationalsKnockoutModel | null;
  dbMatches: SdKnockoutMatch[];
  scoresByMatchId: Record<string, { branch_id: string; points: number }[]>;
}

function flatMatches(model: NationalsKnockoutModel): KnockoutMatch[] {
  return model.rounds.flat();
}

export function KnockoutAdminForm({
  wildcardModel,
  knockoutModel,
  dbMatches,
  scoresByMatchId,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scoresMap = useMemo(() => {
    const m = new Map<string, { branch_id: string; points: number }[]>();
    for (const [k, v] of Object.entries(scoresByMatchId)) {
      m.set(k, v);
    }
    return m;
  }, [scoresByMatchId]);

  const dbById = useMemo(
    () => new Map(dbMatches.map((m) => [m.id, m])),
    [dbMatches]
  );

  const editableMatches = useMemo(() => {
    if (!knockoutModel) return [];
    return flatMatches(knockoutModel).filter((m) => {
      if (!m.id) return false;
      const db = dbById.get(m.id);
      if (!db) return false;
      return m.entrantA && m.entrantB;
    });
  }, [knockoutModel, dbById]);

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

  if (!wildcardModel.allFieldLocked) {
    return (
      <section className="sd-neon-panel space-y-3 p-5">
        <h2 className="text-lg font-semibold text-white">Knockout bracket</h2>
        <p className="text-sm text-sd-muted">
          Unlocks when all area representatives and the wild card are locked.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-8 border-t border-emerald-500/15 pt-8">
      {knockoutModel ? (
        <NationalsKnockoutMap model={knockoutModel} preview={false} />
      ) : (
        <div className="sd-neon-panel p-4 text-sm text-amber-100">
          Knockout bracket not initialized. Sync after the field is locked.
        </div>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Knockout scoring</h2>
            <p className="mt-1 text-sm text-sd-muted">
              Score and publish each match in order — winners advance to the next
              round automatically.
            </p>
          </div>
          <SdButton
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() =>
              run(
                () => syncSdKnockoutBracketForm(),
                "Knockout bracket synced from locked field."
              )
            }
          >
            Sync bracket
          </SdButton>
        </div>

        {editableMatches.length === 0 ? (
          <p className="text-sm text-sd-muted">
            No matches ready to score yet. Sync the bracket first.
          </p>
        ) : (
          <div className="space-y-4">
            {editableMatches.map((match) => (
              <KnockoutMatchPanel
                key={match.id}
                match={match}
                db={dbById.get(match.id!)!}
                initialScores={scoresMapForMatch(match.id!, scoresMap)}
                disabled={pending}
                onSave={(scores) =>
                  run(
                    () => saveSdKnockoutMatchScores(match.id!, scores),
                    "Scores saved."
                  )
                }
                onPublish={(scores) =>
                  run(async () => {
                    await saveSdKnockoutMatchScores(match.id!, scores);
                    await publishSdKnockoutMatchForm(match.id!);
                  }, "Match published — winner advanced.")
                }
                onUnpublish={() =>
                  run(
                    () => unpublishSdKnockoutMatchForm(match.id!),
                    "Match reverted to draft."
                  )
                }
              />
            ))}
          </div>
        )}

        {message && <p className="text-sm text-emerald-300">{message}</p>}
        {error && <p className="text-sm text-red-300">{error}</p>}
      </section>
    </div>
  );
}

function KnockoutMatchPanel({
  match,
  db,
  initialScores,
  disabled,
  onSave,
  onPublish,
  onUnpublish,
}: {
  match: KnockoutMatch;
  db: SdKnockoutMatch;
  initialScores: Record<string, number>;
  disabled: boolean;
  onSave: (scores: { branch_id: string; points: number }[]) => void;
  onPublish: (scores: { branch_id: string; points: number }[]) => void;
  onUnpublish: () => void;
}) {
  const [scoreA, setScoreA] = useState(
    String(initialScores[match.entrantA!.id] ?? 0)
  );
  const [scoreB, setScoreB] = useState(
    String(initialScores[match.entrantB!.id] ?? 0)
  );

  const isPublished = db.status === "published";
  const canEdit = !isPublished;

  function handleSave() {
    onSave([
      { branch_id: match.entrantA!.id, points: Number(scoreA) || 0 },
      { branch_id: match.entrantB!.id, points: Number(scoreB) || 0 },
    ]);
  }

  function handlePublish() {
    const scores = [
      { branch_id: match.entrantA!.id, points: Number(scoreA) || 0 },
      { branch_id: match.entrantB!.id, points: Number(scoreB) || 0 },
    ];
    onPublish(scores);
  }

  return (
    <div
      className={`sd-neon-panel space-y-3 p-4 ${
        isPublished ? "ring-1 ring-lime-400/30" : ""
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-sd-glow">
            {KNOCKOUT_ROUND_LABELS[match.round]}
          </p>
          <p className="font-medium text-white">{match.label}</p>
        </div>
        {isPublished && (
          <span className="rounded-full bg-lime-400/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-lime-100 ring-1 ring-lime-400/35">
            Published
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {[match.entrantA!, match.entrantB!].map((entrant, i) => (
          <div key={entrant.id} className="space-y-1">
            <label className="text-xs text-sd-muted">
              {entrant.repName}{" "}
              <span className="text-sd-muted/60">({entrant.area})</span>
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              disabled={!canEdit || disabled}
              value={i === 0 ? scoreA : scoreB}
              onChange={(e) =>
                i === 0 ? setScoreA(e.target.value) : setScoreB(e.target.value)
              }
              className="w-full rounded sd-input px-3 py-2 text-sm tabular-nums"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {canEdit && (
          <>
            <SdButton type="button" disabled={disabled} onClick={handleSave}>
              Save draft
            </SdButton>
            <SdButton
              type="button"
              variant="primary"
              disabled={disabled}
              onClick={handlePublish}
            >
              Publish match
            </SdButton>
          </>
        )}
        {isPublished && (
          <SdButton
            type="button"
            variant="danger"
            disabled={disabled}
            onClick={onUnpublish}
          >
            Unpublish
          </SdButton>
        )}
      </div>
    </div>
  );
}
