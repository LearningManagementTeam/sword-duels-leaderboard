"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { saveRoundResults, publishRound } from "@/lib/actions/admin";
import { DraftStandingsPreview } from "@/components/admin/DraftStandingsPreview";
import { InfoTip } from "@/components/admin/InfoTip";
import { getRoundMechanics } from "@/lib/scoring-config";
import type { Branch } from "@/lib/types";
import type { SeasonSlug } from "@/lib/scoring-config";
import { REGIONS, REGION_LABELS } from "@/lib/scoring-config";

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
  initial: Map<string, { points: number; wins: number; losses: number }>;
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
  const pointsMax = mechanics?.maxPoints;
  const pointsStep = pointsMax != null ? 1 : 0.01;

  const clampPoints = (value: number) => {
    let n = Math.max(0, value);
    if (pointsMax != null) n = Math.min(pointsMax, n);
    return n;
  };
  const [showOut, setShowOut] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState(() =>
    branches.map((b) => ({
      branch_id: b.id,
      branch_name: b.branch_name,
      points: initial.get(b.id)?.points ?? 0,
    }))
  );

  const getDraftResults = useCallback(
    () =>
      values.map((v) => ({
        branch_id: v.branch_id,
        points: Number(v.points),
      })),
    [values]
  );

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

      <ol className="flex flex-wrap gap-2 text-xs text-sd-muted">
        <li className="rounded bg-sd-panel px-2 py-1">1. Enter points</li>
        <li className="rounded bg-sd-panel px-2 py-1">2. Draft preview</li>
        <li className="rounded bg-sd-panel px-2 py-1">3. Publish</li>
        {supportsManualAdvances && (
          <li className="rounded bg-cyan-500/20 px-2 py-1 text-cyan-200">
            4. Advancement / tie-breaker picks
          </li>
        )}
      </ol>

      {supportsManualAdvances && (
        <p className="text-sm">
          <Link
            href={`/admin/rounds/${roundId}/advances`}
            className="text-sd-glow underline hover:text-emerald-200"
          >
            Manage advancement picks
          </Link>
          <span className="text-sd-muted/80">
            {" "}
            — add tie-breaker winners or extra advancers after publish
          </span>
        </p>
      )}

      <p className="text-xs text-sd-muted">
        <Link href="/admin/mechanics" className="text-sd-glow/90 hover:underline">
          Competition rules
        </Link>{" "}
        · Scoring uses <strong className="text-white">points only</strong> (no
        wins/losses). Ties at the cut get a <strong className="text-cyan-200">Tie breaker</strong>{" "}
        status until resolved.
      </p>

      {status === "published" && (
        <div className="sd-glass flex flex-wrap items-center gap-2 rounded-xl px-3 py-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-sd-muted/70">
            Export CSV
          </span>
          {seasonSlug === "august_finals" ? (
            <a
              href="/api/export/august"
              className="rounded-lg border border-sd-glow/30 px-3 py-1 text-sd-muted hover:text-white"
            >
              August finals
            </a>
          ) : (
            REGIONS.map((region) => (
              <a
                key={region}
                href={`/api/export/${seasonSlug === "june_area" ? "june" : "july"}?region=${region}`}
                className="rounded-lg border border-sd-glow/30 px-3 py-1 text-sd-muted hover:text-white"
              >
                {REGION_LABELS[region]}
              </a>
            ))
          )}
        </div>
      )}

      {mechanics && (
        <div className="rounded-lg border border-sd-glow/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-50/90">
          <p className="font-medium text-sd-glow">{mechanics.label}</p>
          <p className="mt-1">{mechanics.description}</p>
          <p className="mt-1 text-xs text-sd-muted">
            Tie-break: higher points, then branch name A–Z at the regional cut.
          </p>
        </div>
      )}

      {tieBreakerBranches.length > 0 && priorRoundNumber && (
        <div className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
          <p className="font-medium">
            {tieBreakerBranches.length} branch
            {tieBreakerBranches.length === 1 ? "" : "es"} need tie breaker after
            Round {priorRoundNumber}
          </p>
          <p className="mt-1 text-xs text-cyan-200/80">
            They are not in this score list. After the tie-breaker round, use
            advancement picks or update scores and re-publish.
          </p>
          <ul className="mt-2 max-h-24 overflow-auto text-xs text-cyan-100/90">
            {tieBreakerBranches.map((b) => (
              <li key={b.id}>{b.branch_name}</li>
            ))}
          </ul>
        </div>
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
                {tieBreakerBranches.map((b) => (
                  <li key={b.id} className="text-cyan-300/90">
                    {b.branch_name} — tie breaker pending
                  </li>
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
              <th className="px-3 py-2 text-right text-sd-muted">
                Points{pointsMax != null ? ` (0–${pointsMax})` : ""}
              </th>
            </tr>
          </thead>
          <tbody>
            {values.map((row, i) => (
              <tr
                key={row.branch_id}
                className="border-t border-sd-glow/10 transition hover:bg-emerald-500/5"
              >
                <td className="px-3 py-2 text-white">{row.branch_name}</td>
                <td className="px-3 py-2">
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
                    className="sd-input w-28 rounded-lg px-2 py-1.5 text-right tabular-nums"
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
          className="sd-btn-ghost rounded-lg px-4 py-2 text-sm disabled:opacity-50"
        >
          Save draft
        </button>
        <span className="inline-flex items-center">
          <button
            type="button"
            disabled={loading}
            onClick={handlePublish}
            className="sd-btn-primary rounded-lg px-4 py-2 text-sm disabled:opacity-50"
          >
            Save & publish
          </button>
          <InfoTip>
            Publishing applies the regional cut. Branches tied at the line get
            Tie breaker status; use advancement picks after publish to add
            winners.
          </InfoTip>
        </span>
      </div>
      {message && <p className="text-sm text-sd-glow">{message}</p>}
    </div>
  );
}
