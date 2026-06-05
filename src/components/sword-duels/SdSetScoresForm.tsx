"use client";

import { useMemo, useState } from "react";
import {
  publishSdSet,
  saveSdSetScores,
  unpublishSdSet,
  updateSdSetScoringMode,
  type SdScoreInput,
} from "@/lib/actions/sword-duels-admin";
import { computeSetResults } from "@/lib/products/sword-duels/scoring";
import { SD_SET_FLOW, SD_SCORING_MODE_LABELS } from "@/lib/products/sword-duels/scoring-config";
import type {
  SdAreaGroupBranch,
  SdScoringMode,
  SdSet,
  SdSetScore,
  SdSetType,
} from "@/lib/products/sword-duels/types";
import { SdButton } from "@/components/ui/SdButton";

function setMeta(setType: SdSetType) {
  return SD_SET_FLOW.find((s) => s.key === setType);
}

interface Props {
  set: SdSet;
  setType: SdSetType;
  participants: SdAreaGroupBranch[];
  initialScores: SdSetScore[];
  canEdit: boolean;
  lockedReason?: string | null;
}

type RowState = {
  branch_id: string;
  branch_code: string;
  branch_name: string;
  representative_1?: string | null;
  representative_2?: string | null;
  representative_1_employee_no?: string | null;
  representative_1_position?: string | null;
  representative_2_employee_no?: string | null;
  representative_2_position?: string | null;
  points: string;
  hearts: string;
  is_eliminated: boolean;
  active_representative: 1 | 2;
};

export function SdSetScoresForm({
  set,
  setType,
  participants,
  initialScores,
  canEdit,
  lockedReason,
}: Props) {
  const scoreByBranch = useMemo(
    () => new Map(initialScores.map((s) => [s.branch_id, s])),
    [initialScores]
  );

  const [rows, setRows] = useState<RowState[]>(() =>
    participants.map((p) => {
      const s = scoreByBranch.get(p.branch_id);
      return {
        branch_id: p.branch_id,
        branch_code: p.branch_code,
        branch_name: p.branch_name,
        representative_1: p.representative_1,
        representative_2: p.representative_2,
        representative_1_employee_no: p.representative_1_employee_no,
        representative_1_position: p.representative_1_position,
        representative_2_employee_no: p.representative_2_employee_no,
        representative_2_position: p.representative_2_position,
        points: s ? String(s.points) : "0",
        hearts: s?.hearts_remaining != null ? String(s.hearts_remaining) : "3",
        is_eliminated: s?.is_eliminated ?? false,
        active_representative: s?.active_representative === 2 ? 2 : 1,
      };
    })
  );
  const [mode, setMode] = useState<SdScoringMode>(set.scoring_mode);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const meta = setMeta(setType);
  const modeInfo = SD_SCORING_MODE_LABELS[mode];

  const preview = useMemo(() => {
    const scores: SdSetScore[] = rows.map((r) => ({
      branch_id: r.branch_id,
      points: Number(r.points) || 0,
      hearts_remaining:
        mode === "survival" ? Number(r.hearts) || 0 : null,
      is_eliminated: mode === "survival" ? r.is_eliminated : false,
    }));
    return computeSetResults(participants, scores, mode);
  }, [rows, participants, mode]);

  const topTwoSurvivorIds = useMemo(() => {
    if (mode !== "survival") return new Set<string>();
    const survivors = preview.ranked.filter(
      (r) => !r.is_eliminated && (r.hearts_remaining ?? 0) > 0
    );
    return new Set(survivors.slice(0, 2).map((r) => r.branch_id));
  }, [preview, mode]);

  const isPublished = set.status === "published";
  const disabled = !canEdit || isPublished || !set.id;

  async function handleSave() {
    if (!set.id) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (mode !== set.scoring_mode) {
        await updateSdSetScoringMode(set.id, mode);
      }
      const payload: SdScoreInput[] = rows.map((r) => ({
        branch_id: r.branch_id,
        points: Number(r.points) || 0,
        hearts_remaining:
          mode === "survival" ? Number(r.hearts) || 0 : null,
        is_eliminated: mode === "survival" ? r.is_eliminated : false,
        active_representative: r.active_representative,
      }));
      await saveSdSetScores(set.id, payload);
      setMessage("Scores saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function handlePublish() {
    if (!set.id) return;
    setBusy(true);
    setError(null);
    try {
      await handleSave();
      const { winnerId } = await publishSdSet(set.id);
      setMessage(
        winnerId
          ? `Published. Winner locked in.`
          : "Published."
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleUnpublish() {
    if (!set.id) return;
    if (
      setType === "area_final" &&
      !window.confirm(
        "Unpublishing the area final resets wildcard selection and knockout bracket progress. Continue?"
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await unpublishSdSet(set.id);
      setMessage("Reverted to draft.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unpublish failed");
    } finally {
      setBusy(false);
    }
  }

  if (participants.length === 0) {
    return (
      <div className="sd-inset rounded-lg p-4 text-sm text-sd-muted">
        {lockedReason ?? "No participants for this set yet."}
      </div>
    );
  }

  return (
    <div className="sd-neon-panel space-y-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-xl">
          <h3 className="font-semibold text-white">
            {meta?.title ?? setType}
          </h3>
          <p className="mt-1 text-xs text-sd-muted">{meta?.description}</p>
          <p className="mt-1 text-xs">
            {isPublished ? (
              <span className="text-emerald-300">Published</span>
            ) : (
              <span className="text-sd-muted">Draft</span>
            )}
            {meta?.spotLabel && (
              <span className="text-sd-muted"> · earns {meta.spotLabel}</span>
            )}
          </p>
        </div>
        <label className="text-xs text-sd-muted">
          Scoring mode
          <select
            value={mode}
            disabled={disabled}
            onChange={(e) => setMode(e.target.value as SdScoringMode)}
            className="mt-1 block rounded sd-input px-2 py-1.5 text-sm"
          >
            <option value="high_score">
              {SD_SCORING_MODE_LABELS.high_score.label}
            </option>
            <option value="survival">
              {SD_SCORING_MODE_LABELS.survival.label}
            </option>
          </select>
          <span className="mt-1 block max-w-[14rem] text-[10px] leading-snug text-sd-muted/70">
            {modeInfo.description}
          </span>
        </label>
      </div>

      {lockedReason && !canEdit && (
        <p className="text-sm text-amber-200/90">{lockedReason}</p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead>
            <tr className="border-b border-emerald-500/15 text-xs uppercase tracking-wide text-sd-muted">
              <th className="px-2 py-2">Branch</th>
              <th className="px-2 py-2">Competing rep</th>
              <th className="px-2 py-2">Points</th>
              {mode === "survival" && (
                <>
                  <th className="px-2 py-2">Hearts</th>
                  <th className="px-2 py-2">Out</th>
                </>
              )}
              <th className="px-2 py-2">Preview</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const ranked = preview.ranked.find(
                (r) => r.branch_id === row.branch_id
              );
              return (
                <tr
                  key={row.branch_id}
                  className={`border-b border-emerald-500/10 ${
                    ranked?.is_winner
                      ? "bg-emerald-500/10"
                      : topTwoSurvivorIds.has(row.branch_id)
                        ? "bg-cyan-500/5"
                        : ""
                  }`}
                >
                  <td className="px-2 py-2">
                    <span className="font-medium text-white">
                      {row.branch_name}
                    </span>
                    <span className="block text-[10px] text-sd-muted">
                      {row.branch_code}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-xs">
                    <select
                      disabled={disabled}
                      value={row.active_representative}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r) =>
                            r.branch_id === row.branch_id
                              ? {
                                  ...r,
                                  active_representative: Number(
                                    e.target.value
                                  ) as 1 | 2,
                                }
                              : r
                          )
                        )
                      }
                      className="w-full max-w-[11rem] rounded sd-input px-2 py-1 text-xs"
                    >
                      <option value={1}>
                        Rep 1: {row.representative_1?.trim() || "—"}
                      </option>
                      <option value={2}>
                        Rep 2: {row.representative_2?.trim() || "—"}
                      </option>
                    </select>
                    <p className="mt-1 text-[10px] text-sd-muted/60">
                      Record who competed in this set
                    </p>
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      disabled={disabled}
                      value={row.points}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r) =>
                            r.branch_id === row.branch_id
                              ? { ...r, points: e.target.value }
                              : r
                          )
                        )
                      }
                      className="w-20 rounded sd-input px-2 py-1 text-sm tabular-nums"
                    />
                  </td>
                  {mode === "survival" && (
                    <>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min={0}
                          max={3}
                          disabled={disabled}
                          value={row.hearts}
                          onChange={(e) =>
                            setRows((prev) =>
                              prev.map((r) =>
                                r.branch_id === row.branch_id
                                  ? { ...r, hearts: e.target.value }
                                  : r
                              )
                            )
                          }
                          className="w-16 rounded sd-input px-2 py-1 text-sm tabular-nums"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="checkbox"
                          disabled={disabled}
                          checked={row.is_eliminated}
                          onChange={(e) =>
                            setRows((prev) =>
                              prev.map((r) =>
                                r.branch_id === row.branch_id
                                  ? { ...r, is_eliminated: e.target.checked }
                                  : r
                              )
                            )
                          }
                        />
                      </td>
                    </>
                  )}
                  <td className="px-2 py-2 text-xs tabular-nums text-sd-muted">
                    #{ranked?.rank ?? "—"}
                    {topTwoSurvivorIds.has(row.branch_id) && mode === "survival" && (
                      <span className="ml-1 text-cyan-300">top 2</span>
                    )}
                    {ranked?.is_winner && (
                      <span className="ml-1 text-emerald-300">★ spot</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2">
        {!isPublished && (
          <>
            <SdButton
              type="button"
              disabled={disabled || busy}
              onClick={handleSave}
            >
              Save draft
            </SdButton>
            <SdButton
              type="button"
              variant="primary"
              disabled={disabled || busy || !set.id}
              onClick={handlePublish}
            >
              Publish set
            </SdButton>
          </>
        )}
        {isPublished && set.id && (
          <SdButton
            type="button"
            variant="danger"
            disabled={busy}
            onClick={handleUnpublish}
          >
            Unpublish
          </SdButton>
        )}
      </div>

      {message && <p className="text-sm text-emerald-300">{message}</p>}
      {error && <p className="text-sm text-red-300">{error}</p>}
    </div>
  );
}
