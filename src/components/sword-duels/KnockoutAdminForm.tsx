"use client";

import { useMemo, useState, useTransition } from "react";
import {
  KNOCKOUT_ROUND_LABELS,
  type KnockoutMatch,
  type KnockoutRoundKey,
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
import { AdminConfirmPanel } from "@/components/admin/AdminConfirmPanel";
import { NationalsKnockoutMap } from "./NationalsKnockoutMap";
import { SdCollapsibleSection } from "./SdCollapsibleSection";
import { SdButton } from "@/components/ui/SdButton";

const ROUND_ORDER: KnockoutRoundKey[] = ["r16", "qf", "sf", "final"];

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

  const nextMatch = useMemo(
    () =>
      editableMatches.find((m) => dbById.get(m.id!)?.status !== "published") ??
      null,
    [editableMatches, dbById]
  );

  const matchesByRound = useMemo(() => {
    return ROUND_ORDER.map((round) => ({
      round,
      label: KNOCKOUT_ROUND_LABELS[round],
      matches: editableMatches.filter((m) => m.round === round),
    })).filter((g) => g.matches.length > 0);
  }, [editableMatches]);

  const publishedCount = useMemo(
    () =>
      editableMatches.filter((m) => dbById.get(m.id!)?.status === "published")
        .length,
    [editableMatches, dbById]
  );

  function scrollToMatch(matchId: string) {
    document
      .getElementById(`knockout-admin-match-${matchId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

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
            <div className="sd-inset flex flex-wrap items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm">
              <p className="text-sd-muted">
                <span className="font-semibold text-white">
                  {publishedCount}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-white">
                  {editableMatches.length}
                </span>{" "}
                matches published
              </p>
              {nextMatch ? (
                <button
                  type="button"
                  className="sd-link text-left font-medium"
                  onClick={() => scrollToMatch(nextMatch.id!)}
                >
                  Next up: {nextMatch.label} →
                </button>
              ) : (
                <span className="text-emerald-300">Bracket complete</span>
              )}
            </div>

            {matchesByRound.map((group) => (
              <SdCollapsibleSection
                key={group.round}
                title={group.label}
                subtitle={`${group.matches.filter((m) => dbById.get(m.id!)?.status === "published").length} of ${group.matches.length} published`}
                defaultOpen={
                  group.round === nextMatch?.round ||
                  group.matches.some(
                    (m) => dbById.get(m.id!)?.status !== "published"
                  )
                }
              >
                <div className="space-y-4">
                  {group.matches.map((match) => (
                    <KnockoutMatchPanel
                      key={match.id}
                      match={match}
                      db={dbById.get(match.id!)!}
                      initialScores={scoresMapForMatch(match.id!, scoresMap)}
                      disabled={pending}
                      isNext={nextMatch?.id === match.id}
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
              </SdCollapsibleSection>
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
  isNext,
  onSave,
  onPublish,
  onUnpublish,
}: {
  match: KnockoutMatch;
  db: SdKnockoutMatch;
  initialScores: Record<string, number>;
  disabled: boolean;
  isNext?: boolean;
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
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);

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
      id={`knockout-admin-match-${match.id}`}
      className={`scroll-mt-24 space-y-3 rounded-xl p-4 ${
        isNext
          ? "sd-neon-panel ring-2 ring-cyan-400/40"
          : isPublished
            ? "sd-neon-panel ring-1 ring-lime-400/30"
            : "sd-inset"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium text-white">{match.label}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isNext && !isPublished && (
            <span className="rounded-full bg-cyan-400/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-100 ring-1 ring-cyan-400/35">
              Next up
            </span>
          )}
          {isPublished && (
            <span className="rounded-full bg-lime-400/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-lime-100 ring-1 ring-lime-400/35">
              Published
            </span>
          )}
        </div>
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

      {showUnpublishConfirm && (
        <AdminConfirmPanel
          title="Unpublish knockout match?"
          tone="danger"
          confirmLabel="Unpublish match"
          busy={disabled}
          onConfirm={() => {
            setShowUnpublishConfirm(false);
            onUnpublish();
          }}
          onCancel={() => setShowUnpublishConfirm(false)}
        >
          <p>
            This reverts the match to draft and resets advancement for later
            rounds that depended on this result. Only unpublish if scores were
            entered in error.
          </p>
        </AdminConfirmPanel>
      )}

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
        {isPublished && !showUnpublishConfirm && (
          <SdButton
            type="button"
            variant="danger"
            disabled={disabled}
            onClick={() => setShowUnpublishConfirm(true)}
          >
            Unpublish
          </SdButton>
        )}
      </div>
    </div>
  );
}
