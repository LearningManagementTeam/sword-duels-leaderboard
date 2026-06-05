"use client";

import { useMemo, useState } from "react";
import { buildNationalsWildcardModel } from "@/lib/products/sword-duels/build-nationals-wildcard-model";
import { pickWildcardRoundWinner } from "@/lib/products/sword-duels/wildcard-selection";
import { NationalsWildcardMap } from "./NationalsWildcardMap";
import { useWildcardPreviewState } from "./useWildcardPreviewState";

export function WildcardPreviewAdmin() {
  const {
    state,
    hydrated,
    updateScores,
    confirmWildcard,
    resetPreview,
    setForceTiebreak,
  } = useWildcardPreviewState();

  const model = useMemo(
    () => buildNationalsWildcardModel(state),
    [state]
  );

  const [draftScores, setDraftScores] = useState<Record<string, number>>({});

  const mergedScores = { ...state.wildcardScores, ...draftScores };

  if (!hydrated) {
    return (
      <p className="text-sm text-sd-muted">Loading wildcard preview state…</p>
    );
  }

  const candidates = model.tiebreakCandidates;
  const previewWinner = pickWildcardRoundWinner(candidates, mergedScores);

  function handleScoreChange(id: string, raw: string) {
    const val = raw === "" ? NaN : Number(raw);
    setDraftScores((prev) => {
      const next = { ...prev };
      if (Number.isNaN(val)) delete next[id];
      else next[id] = val;
      return next;
    });
  }

  function saveDraftScores() {
    updateScores({ ...state.wildcardScores, ...draftScores });
    setDraftScores({});
  }

  function publishWildcard() {
    if (!previewWinner) return;
    updateScores({ ...state.wildcardScores, ...draftScores });
    confirmWildcard(previewWinner.id);
    setDraftScores({});
  }

  return (
    <div className="space-y-8">
      <NationalsWildcardMap
        model={model}
        scores={{ ...state.wildcardScores, ...draftScores }}
        confirmedWildcardId={state.confirmedWildcardId}
        adminMode
      />

      <section className="sd-wildcard-arena space-y-4 p-5">
        <div>
          <h2 className="text-lg font-semibold text-white">Admin · Wildcard scoring</h2>
          <p className="mt-1 text-sm text-fuchsia-100/55">
            Enter wildcard-round scores for tied candidates, then publish slot 16.
            Stored locally in this browser only.
          </p>
        </div>

        {model.phase === "auto_wildcard" && !state.forceTiebreak && (
          <div className="rounded-lg bg-purple-950/40 px-4 py-3 text-sm text-purple-100/80 ring-1 ring-purple-400/25 ring-inset">
            Demo data auto-selects{" "}
            <strong className="text-white">{model.wildcardRep?.repName}</strong>.
            Enable tiebreak mode below to rehearse the wildcard round UI.
          </div>
        )}

        <label className="flex cursor-pointer items-center gap-2 text-sm text-fuchsia-100/80">
          <input
            type="checkbox"
            checked={!!state.forceTiebreak}
            onChange={(e) => setForceTiebreak(e.target.checked)}
            className="rounded border-fuchsia-400/40"
          />
          Force tiebreak mode (rehearse wildcard round)
        </label>

        {(model.phase === "tiebreak_pending" ||
          model.phase === "tiebreak_resolved" ||
          state.forceTiebreak) &&
          candidates.length > 0 && (
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
                          value={
                            draftScores[c.id] ??
                            state.wildcardScores[c.id] ??
                            ""
                          }
                          onChange={(e) => handleScoreChange(c.id, e.target.value)}
                          placeholder="0"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={saveDraftScores}
            disabled={Object.keys(draftScores).length === 0}
            className="sd-btn-secondary rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40"
          >
            Save draft scores
          </button>
          <button
            type="button"
            onClick={publishWildcard}
            disabled={!previewWinner || candidates.length === 0}
            className="rounded-lg bg-gradient-to-r from-fuchsia-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_16px_rgb(217_70_239/0.35)] disabled:opacity-40"
          >
            Publish wildcard · Slot 16
          </button>
          <button
            type="button"
            onClick={resetPreview}
            className="sd-btn-ghost rounded-lg px-4 py-2 text-sm font-semibold text-fuchsia-200/70"
          >
            Reset preview
          </button>
        </div>

        {previewWinner && candidates.length > 0 && !state.confirmedWildcardId && (
          <p className="text-xs text-fuchsia-200/60">
            Current leader:{" "}
            <span className="font-semibold text-fuchsia-100">
              {previewWinner.repName}
            </span>{" "}
            — publish to lock slot 16.
          </p>
        )}

        {state.confirmedWildcardId && model.wildcardRep && (
          <p className="text-sm font-medium text-fuchsia-100">
            ✓ Slot 16 locked: {model.wildcardRep.repName}
          </p>
        )}
      </section>
    </div>
  );
}
