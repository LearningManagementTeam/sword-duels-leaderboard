"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { saveRoundResults, publishRound } from "@/lib/actions/admin";
import { DraftStandingsPreview } from "@/components/admin/DraftStandingsPreview";
import { InfoTip } from "@/components/admin/InfoTip";
import { getRoundMechanics } from "@/lib/scoring-config";
import type { Branch } from "@/lib/types";
import type { SeasonSlug } from "@/lib/scoring-config";

interface Props {
  roundId: string;
  roundName: string;
  roundNumber: number;
  status: string;
  seasonSlug: SeasonSlug;
  branches: Branch[];
  eliminatedBranches?: Branch[];
  priorRoundNumber?: number | null;
  supportsManualAdvances?: boolean;
  initial: Map<string, { points: number; wins: number; losses: number }>;
}

export function RoundResultsForm({
  roundId,
  roundName,
  roundNumber,
  status,
  seasonSlug,
  branches,
  eliminatedBranches = [],
  priorRoundNumber,
  supportsManualAdvances = false,
  initial,
}: Props) {
  const mechanics = getRoundMechanics(seasonSlug, roundNumber);
  const pointsMax = mechanics?.maxPoints;
  const pointsStep = pointsMax != null ? 1 : 0.01;

  const clampPoints = (value: number) => {
    let n = Math.max(0, value);
    if (pointsMax != null) n = Math.min(pointsMax, n);
    return n;
  };
  const [showEliminated, setShowEliminated] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState(() =>
    branches.map((b) => ({
      branch_id: b.id,
      branch_name: b.branch_name,
      points: initial.get(b.id)?.points ?? 0,
      wins: initial.get(b.id)?.wins ?? 0,
      losses: initial.get(b.id)?.losses ?? 0,
    }))
  );

  const getDraftResults = useCallback(
    () =>
      values.map((v) => ({
        branch_id: v.branch_id,
        points: Number(v.points),
        wins: Number(v.wins),
        losses: Number(v.losses),
      })),
    [values]
  );

  async function handleSave() {
    setLoading(true);
    setMessage("");
    try {
      await saveRoundResults(
        roundId,
        values.map((v) => ({
          branch_id: v.branch_id,
          points: Number(v.points),
          wins: Number(v.wins),
          losses: Number(v.losses),
        }))
      );
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
      await saveRoundResults(
        roundId,
        values.map((v) => ({
          branch_id: v.branch_id,
          points: Number(v.points),
          wins: Number(v.wins),
          losses: Number(v.losses),
        }))
      );
      await publishRound(roundId);
      setMessage("Round published.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold">{roundName}</h2>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            status === "published"
              ? "bg-emerald-800 text-emerald-100"
              : "bg-slate-700 text-slate-200"
          }`}
        >
          {status}
        </span>
      </div>

      <ol className="flex flex-wrap gap-2 text-xs text-slate-400">
        <li className="rounded bg-slate-800 px-2 py-1">1. Enter scores</li>
        <li className="rounded bg-slate-800 px-2 py-1">2. Draft preview</li>
        <li className="rounded bg-slate-800 px-2 py-1">3. Publish</li>
        {supportsManualAdvances && (
          <li className="rounded bg-amber-500/20 px-2 py-1 text-amber-200">
            4. Advancement picks
          </li>
        )}
      </ol>

      {supportsManualAdvances && (
        <p className="text-sm">
          <Link
            href={`/admin/rounds/${roundId}/advances`}
            className="text-amber-300 underline hover:text-amber-200"
          >
            Manage advancement picks
          </Link>
          <span className="text-slate-500">
            {" "}
            — add extra branches after the automatic cut (e.g. tied perfect scores)
          </span>
        </p>
      )}

      <p className="text-xs text-slate-500">
        <Link href="/admin/mechanics" className="text-amber-400/80 hover:underline">
          Competition rules
        </Link>{" "}
        · public{" "}
        <Link href="/mechanics" className="hover:underline" target="_blank">
          /mechanics
        </Link>
      </p>

      {mechanics && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <p className="font-medium text-amber-200">{mechanics.label}</p>
          <p className="mt-1 text-amber-100/90">{mechanics.description}</p>
          <p className="mt-1 text-xs text-amber-200/70">
            Ties: higher points → more wins → branch name (A–Z)
          </p>
        </div>
      )}

      {eliminatedBranches.length > 0 && priorRoundNumber && (
        <div className="rounded-lg border border-slate-700 bg-slate-900/40">
          <button
            type="button"
            onClick={() => setShowEliminated(!showEliminated)}
            className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-slate-400 hover:text-slate-200"
          >
            <span>
              Eliminated after Round {priorRoundNumber} ({eliminatedBranches.length}{" "}
              branches — read-only)
            </span>
            <span>{showEliminated ? "▲" : "▼"}</span>
          </button>
          {showEliminated && (
            <ul className="max-h-40 overflow-auto border-t border-slate-800 px-4 py-2 text-xs text-slate-500">
              {eliminatedBranches.map((b) => (
                <li key={b.id}>{b.branch_name}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="max-h-[60vh] overflow-auto rounded-lg border border-slate-700">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-800">
            <tr>
              <th className="px-2 py-2 text-left">Branch</th>
              <th className="px-2 py-2 text-right">
                Points{pointsMax != null ? ` (0–${pointsMax})` : ""}
              </th>
              <th className="px-2 py-2 text-right">Wins</th>
              <th className="px-2 py-2 text-right">Losses</th>
            </tr>
          </thead>
          <tbody>
            {values.map((row, i) => (
              <tr key={row.branch_id} className="border-t border-slate-800">
                <td className="px-2 py-1">{row.branch_name}</td>
                <td className="px-2 py-1">
                  <input
                    type="number"
                    min={0}
                    max={pointsMax}
                    step={pointsStep}
                    value={row.points}
                    onChange={(e) => {
                      const next = [...values];
                      next[i] = {
                        ...next[i],
                        points: clampPoints(Number(e.target.value)),
                      };
                      setValues(next);
                    }}
                    className="w-24 rounded border border-slate-600 bg-slate-950 px-2 py-1 text-right"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="number"
                    min={0}
                    value={row.wins}
                    onChange={(e) => {
                      const next = [...values];
                      next[i] = { ...next[i], wins: Number(e.target.value) };
                      setValues(next);
                    }}
                    className="w-16 rounded border border-slate-600 bg-slate-950 px-2 py-1 text-right"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="number"
                    min={0}
                    value={row.losses}
                    onChange={(e) => {
                      const next = [...values];
                      next[i] = { ...next[i], losses: Number(e.target.value) };
                      setValues(next);
                    }}
                    className="w-16 rounded border border-slate-600 bg-slate-950 px-2 py-1 text-right"
                  />
                </td>
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
          className="rounded-lg bg-slate-700 px-4 py-2 text-sm hover:bg-slate-600 disabled:opacity-50"
        >
          Save draft
        </button>
        <span className="inline-flex items-center">
          <button
            type="button"
            disabled={loading}
            onClick={handlePublish}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-amber-400 disabled:opacity-50"
          >
            Save & publish
          </button>
          <InfoTip>
            Publishing updates public leaderboards and applies regional elimination
            for this round. Only enter scores for branches still in the competition.
          </InfoTip>
        </span>
      </div>
      {message && <p className="text-sm text-amber-200">{message}</p>}
    </div>
  );
}
