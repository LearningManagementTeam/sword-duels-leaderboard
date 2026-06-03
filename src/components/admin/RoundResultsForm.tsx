"use client";

import { useCallback, useState } from "react";
import { saveRoundResults, publishRound } from "@/lib/actions/admin";
import { DraftStandingsPreview } from "@/components/admin/DraftStandingsPreview";
import type { Branch } from "@/lib/types";
import type { SeasonSlug } from "@/lib/scoring-config";

interface Props {
  roundId: string;
  roundName: string;
  status: string;
  seasonSlug: SeasonSlug;
  branches: Branch[];
  initial: Map<string, { points: number; wins: number; losses: number }>;
}

export function RoundResultsForm({
  roundId,
  roundName,
  status,
  seasonSlug,
  branches,
  initial,
}: Props) {
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

      <div className="max-h-[60vh] overflow-auto rounded-lg border border-slate-700">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-800">
            <tr>
              <th className="px-2 py-2 text-left">Branch</th>
              <th className="px-2 py-2 text-right">Points</th>
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
                    step={0.01}
                    value={row.points}
                    onChange={(e) => {
                      const next = [...values];
                      next[i] = { ...next[i], points: Number(e.target.value) };
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
        <button
          type="button"
          disabled={loading}
          onClick={handlePublish}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-amber-400 disabled:opacity-50"
        >
          Save & publish
        </button>
      </div>
      {message && <p className="text-sm text-amber-200">{message}</p>}
    </div>
  );
}
