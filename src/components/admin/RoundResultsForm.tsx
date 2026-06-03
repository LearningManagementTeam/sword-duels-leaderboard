"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { saveRoundResults, publishRound } from "@/lib/actions/admin";
import { DraftStandingsPreview } from "@/components/admin/DraftStandingsPreview";
import { InfoTip } from "@/components/admin/InfoTip";
import {
  getRoundMechanics,
  requiredSurvivorsPerRegion,
  type Region,
} from "@/lib/scoring-config";
import type { Branch } from "@/lib/types";
import type { SeasonSlug } from "@/lib/scoring-config";
import { REGIONS, REGION_LABELS } from "@/lib/scoring-config";

interface RowValue {
  branch_id: string;
  branch_name: string;
  region: Region;
  points: number;
  survived: boolean;
  finish_order: number | null;
}

interface Props {
  roundId: string;
  roundName: string;
  roundNumber: number;
  status: string;
  seasonSlug: SeasonSlug;
  branches: Branch[];
  tieBreakerBranches?: Branch[];
  eliminatedBranches?: Branch[];
  priorRoundNumber?: number | null;
  supportsManualAdvances?: boolean;
  initial: Map<
    string,
    { points: number; wins: number; losses: number; finish_order?: number | null }
  >;
}

export function RoundResultsForm({
  roundId,
  roundName,
  roundNumber,
  status,
  seasonSlug,
  branches,
  tieBreakerBranches = [],
  eliminatedBranches = [],
  priorRoundNumber,
  supportsManualAdvances = false,
  initial,
}: Props) {
  const mechanics = getRoundMechanics(seasonSlug, roundNumber);
  const kind = mechanics?.kind ?? "quiz";
  const maxPoints =
    mechanics?.kind === "quiz"
      ? mechanics.maxPoints
      : mechanics?.kind === "race_to_correct"
        ? mechanics.maxCorrect
        : 1;

  const [showOut, setShowOut] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState<RowValue[]>(() =>
    branches.map((b) => {
      const init = initial.get(b.id);
      const points = init?.points ?? 0;
      return {
        branch_id: b.id,
        branch_name: b.branch_name,
        region: b.region,
        points,
        survived: points >= 1,
        finish_order: init?.finish_order ?? null,
      };
    })
  );

  const survivorCounts = useMemo(() => {
    const counts: Record<Region, number> = { luzon: 0, ncr: 0, vismin: 0 };
    if (kind !== "last_man_standing") return counts;
    for (const row of values) {
      if (row.survived) counts[row.region]++;
    }
    return counts;
  }, [values, kind]);

  const getDraftResults = useCallback(() => {
    return values.map((v) => {
      if (kind === "last_man_standing") {
        return {
          branch_id: v.branch_id,
          points: v.survived ? 1 : 0,
          finish_order: null as number | null,
        };
      }
      if (kind === "race_to_correct") {
        return {
          branch_id: v.branch_id,
          points: v.points,
          finish_order: v.points === maxPoints ? v.finish_order : null,
        };
      }
      return {
        branch_id: v.branch_id,
        points: v.points,
        finish_order: null as number | null,
      };
    });
  }, [values, kind, maxPoints]);

  async function handleSave() {
    setLoading(true);
    setMessage("");
    try {
      await saveRoundResults(roundId, getDraftResults());
      setMessage("Draft saved.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish() {
    if (!confirm(`Publish ${roundName}? This updates the public leaderboard.`)) {
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      await saveRoundResults(roundId, getDraftResults());
      await publishRound(roundId);
      setMessage(
        "Round published. Consider updating the Competition map on the home page."
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setLoading(false);
    }
  }

  function updateRow(index: number, patch: Partial<RowValue>) {
    setValues((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-white">{roundName}</h2>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            status === "published"
              ? "bg-emerald-800 text-emerald-100"
              : "bg-sd-panel text-sd-muted"
          }`}
        >
          {status}
        </span>
      </div>

      {mechanics && (
        <div className="rounded-lg border border-sd-glow/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-50/90">
          <p className="font-medium text-sd-glow">{mechanics.label}</p>
          <p className="mt-1">{mechanics.description}</p>
        </div>
      )}

      {kind === "last_man_standing" && (
        <div className="flex flex-wrap gap-2 text-xs">
          {REGIONS.map((region) => {
            const required =
              requiredSurvivorsPerRegion(seasonSlug, roundNumber, region) ?? 0;
            const count = survivorCounts[region];
            const ok = count === required;
            return (
              <span
                key={region}
                className={`rounded-lg px-3 py-1.5 ${
                  ok
                    ? "bg-emerald-500/20 text-emerald-100"
                    : "bg-amber-500/15 text-amber-100"
                }`}
              >
                {REGION_LABELS[region]}: {count}/{required} survived
              </span>
            );
          })}
        </div>
      )}

      {supportsManualAdvances && (
        <p className="text-sm">
          <Link
            href={`/admin/rounds/${roundId}/advances`}
            className="text-sd-glow underline hover:text-emerald-200"
          >
            Manage advancement picks
          </Link>
        </p>
      )}

      {(eliminatedBranches.length > 0 || tieBreakerBranches.length > 0) &&
        priorRoundNumber && (
          <div className="rounded-lg border border-sd-glow/15 bg-sd-panel/50">
            <button
              type="button"
              onClick={() => setShowOut(!showOut)}
              className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-sd-muted hover:text-white"
            >
              <span>
                Not competing this round ({eliminatedBranches.length} eliminated
                {tieBreakerBranches.length > 0
                  ? `, ${tieBreakerBranches.length} tie breaker`
                  : ""}
                )
              </span>
              <span>{showOut ? "▲" : "▼"}</span>
            </button>
            {showOut && (
              <ul className="max-h-40 overflow-auto border-t border-sd-glow/10 px-4 py-2 text-xs text-sd-muted">
                {eliminatedBranches.map((b) => (
                  <li key={b.id}>{b.branch_name} — eliminated</li>
                ))}
              </ul>
            )}
          </div>
        )}

      <div className="max-h-[60vh] overflow-auto rounded-xl border border-sd-glow/20 sd-glass">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-sd-panel/95 backdrop-blur">
            <tr>
              <th className="px-3 py-2 text-left text-sd-muted">Branch</th>
              {kind === "last_man_standing" && (
                <th className="px-3 py-2 text-center text-sd-muted">Survived</th>
              )}
              {kind !== "last_man_standing" && (
                <th className="px-3 py-2 text-right text-sd-muted">
                  {kind === "race_to_correct" ? "Correct (0–5)" : `Score (0–${maxPoints})`}
                </th>
              )}
              {kind === "race_to_correct" && (
                <th className="px-3 py-2 text-right text-sd-muted">Finish order</th>
              )}
            </tr>
          </thead>
          <tbody>
            {values.map((row, i) => (
              <tr
                key={row.branch_id}
                className="border-t border-sd-glow/10 transition hover:bg-emerald-500/5"
              >
                <td className="px-3 py-2 text-white">{row.branch_name}</td>
                {kind === "last_man_standing" && (
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={row.survived}
                      onChange={(e) =>
                        updateRow(i, { survived: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-emerald-500/50"
                    />
                  </td>
                )}
                {kind !== "last_man_standing" && (
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      max={maxPoints}
                      step={1}
                      value={row.points}
                      onChange={(e) => {
                        const points = Math.min(
                          maxPoints,
                          Math.max(0, Number(e.target.value))
                        );
                        updateRow(i, {
                          points,
                          finish_order:
                            kind === "race_to_correct" && points !== maxPoints
                              ? null
                              : row.finish_order,
                        });
                      }}
                      className="sd-input w-28 rounded-lg px-2 py-1.5 text-right tabular-nums"
                    />
                  </td>
                )}
                {kind === "race_to_correct" && (
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={1}
                      max={32}
                      step={1}
                      disabled={row.points !== maxPoints}
                      value={row.finish_order ?? ""}
                      placeholder="—"
                      onChange={(e) =>
                        updateRow(i, {
                          finish_order: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                      className="sd-input w-24 rounded-lg px-2 py-1.5 text-right tabular-nums disabled:opacity-40"
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DraftStandingsPreview
        roundId={roundId}
        seasonSlug={seasonSlug}
        getDraftResults={getDraftResults}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={handleSave}
          className="sd-btn-ghost rounded-lg px-4 py-2 text-sm disabled:opacity-50"
        >
          Save draft
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={handlePublish}
          className="sd-btn-primary rounded-lg px-4 py-2 text-sm disabled:opacity-50"
        >
          Save & publish
        </button>
        <InfoTip>
          Publishing applies the regional cut. Use advancement picks for tie
          breakers.
        </InfoTip>
      </div>
      {message && <p className="text-sm text-sd-glow">{message}</p>}
    </div>
  );
}
