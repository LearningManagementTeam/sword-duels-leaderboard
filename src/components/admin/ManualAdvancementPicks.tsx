"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { saveManualAdvances } from "@/lib/actions/admin";
import { REGION_LABELS, type Region } from "@/lib/scoring-config";
import type { AdvancementPickBranch } from "@/lib/data/admin-queries";

interface RegionData {
  autoAdvanced: AdvancementPickBranch[];
  eligibleExtra: AdvancementPickBranch[];
  selectedIds: string[];
  survivorCut: number;
  maxScoreCount: number;
}

interface Props {
  roundId: string;
  roundName: string;
  roundNumber: number;
  nextRound: number;
  mechanicsLabel: string | null;
  maxPoints: number | null;
  regions: Record<Region, RegionData>;
}

export function ManualAdvancementPicks({
  roundId,
  roundName,
  roundNumber,
  nextRound,
  mechanicsLabel,
  maxPoints,
  regions,
}: Props) {
  const [region, setRegion] = useState<Region>("luzon");
  const [selected, setSelected] = useState<Record<Region, Set<string>>>(() => ({
    luzon: new Set(regions.luzon.selectedIds),
    ncr: new Set(regions.ncr.selectedIds),
    vismin: new Set(regions.vismin.selectedIds),
  }));
  const [onlyMax, setOnlyMax] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const data = regions[region];

  const filteredExtra = useMemo(() => {
    if (!onlyMax || maxPoints == null) return data.eligibleExtra;
    return data.eligibleExtra.filter((b) => b.points >= maxPoints);
  }, [data.eligibleExtra, onlyMax, maxPoints]);

  function toggle(branchId: string) {
    setSelected((prev) => {
      const next = { ...prev };
      const set = new Set(prev[region]);
      if (set.has(branchId)) set.delete(branchId);
      else set.add(branchId);
      next[region] = set;
      return next;
    });
  }

  async function handleSave() {
    setLoading(true);
    setMessage("");
    try {
      await saveManualAdvances(roundId, region, [...selected[region]]);
      setMessage("Advancement picks saved. Public board updated.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/rounds/${roundId}`}
          className="text-sm text-slate-400 hover:text-white"
        >
          ← Back to {roundName}
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Manage advancement</h1>
        <p className="mt-1 text-sm text-slate-400">
          After Round {roundNumber}, add extra branches per region that should
          still advance to Round {nextRound} (e.g. many tied perfect scores).
        </p>
        {mechanicsLabel && (
          <p className="mt-2 text-sm text-amber-200">{mechanicsLabel}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {(["luzon", "ncr", "vismin"] as Region[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRegion(r)}
            className={`rounded-lg px-4 py-2 text-sm ${
              r === region
                ? "bg-amber-500 text-slate-900 font-semibold"
                : "bg-slate-800 text-slate-200 hover:bg-slate-700"
            }`}
          >
            {REGION_LABELS[r]}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4 text-sm text-slate-300">
        <p>
          Automatic cut: top <strong>{data.survivorCut}</strong> in{" "}
          {REGION_LABELS[region]} advance.
          {maxPoints != null && data.maxScoreCount > 0 && (
            <>
              {" "}
              <strong>{data.maxScoreCount}</strong> eliminated branch
              {data.maxScoreCount === 1 ? "" : "es"} scored the max (
              {maxPoints}) and may need a manual pick.
            </>
          )}
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="font-semibold text-emerald-300">
          Auto-advanced ({data.autoAdvanced.length})
        </h2>
        <ul className="max-h-40 overflow-auto rounded-lg border border-slate-800 bg-slate-950/50 text-sm">
          {data.autoAdvanced.map((b) => (
            <li
              key={b.branch_id}
              className="flex justify-between border-b border-slate-800/80 px-3 py-1.5"
            >
              <span>{b.branch_name}</span>
              <span className="tabular-nums text-slate-400">
                {b.points} pts · rank {b.rank}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-amber-300">
            Also advance to Round {nextRound}
          </h2>
          {maxPoints != null && (
            <label className="flex items-center gap-2 text-sm text-slate-400">
              <input
                type="checkbox"
                checked={onlyMax}
                onChange={(e) => setOnlyMax(e.target.checked)}
              />
              Show only max score ({maxPoints})
            </label>
          )}
        </div>

        <ul className="max-h-[40vh] overflow-auto rounded-lg border border-slate-700">
          {filteredExtra.length === 0 ? (
            <li className="px-3 py-6 text-center text-slate-500">
              No eliminated branches to add in this region.
            </li>
          ) : (
            filteredExtra.map((b) => (
              <li
                key={b.branch_id}
                className="flex items-center gap-3 border-b border-slate-800 px-3 py-2 text-sm hover:bg-slate-800/50"
              >
                <input
                  type="checkbox"
                  checked={selected[region].has(b.branch_id)}
                  onChange={() => toggle(b.branch_id)}
                />
                <span className="flex-1">{b.branch_name}</span>
                <span className="tabular-nums text-slate-400">
                  {b.points} pts · {b.wins} W · rank {b.rank}
                </span>
              </li>
            ))
          )}
        </ul>
        <p className="text-xs text-slate-500">
          Selected: {selected[region].size} extra branch
          {selected[region].size === 1 ? "" : "es"}
        </p>
      </section>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={handleSave}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-amber-400 disabled:opacity-50"
        >
          {loading ? "Saving…" : `Save picks for ${REGION_LABELS[region]}`}
        </button>
      </div>
      {message && <p className="text-sm text-amber-200">{message}</p>}
    </div>
  );
}
