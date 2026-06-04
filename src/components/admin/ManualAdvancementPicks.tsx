"use client";

import { useMemo, useState } from "react";
import { InfoTip } from "@/components/admin/InfoTip";
import { saveManualAdvances } from "@/lib/actions/admin";
import { REGION_LABELS, type Region } from "@/lib/scoring-config";
import type { AdvancementPickBranch } from "@/lib/data/admin-queries";

const ALL_REGIONS: Region[] = ["luzon", "ncr", "vismin"];

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
  const [savedRegions, setSavedRegions] = useState<Set<Region>>(() => {
    const initial = new Set<Region>();
    for (const r of ALL_REGIONS) {
      if (regions[r].selectedIds.length > 0) initial.add(r);
    }
    return initial;
  });

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
      setSavedRegions((prev) => new Set(prev).add(region));
      setMessage("Advancement picks saved. Public board updated.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="sd-page-header">
        <h1>
          Manage advancement
          <InfoTip>
            The system keeps the top N per region automatically. Check extra
            branches here only when the committee wants more than the automatic
            cut (e.g. many 10/10 scores). Save separately for each region.
          </InfoTip>
        </h1>
        <p>
          After Round {roundNumber}, add extra branches per region that should
          still advance to Round {nextRound} (e.g. many tied perfect scores).
        </p>
        {mechanicsLabel && (
          <p className="mt-2 text-sm text-sd-glow">{mechanicsLabel}</p>
        )}
      </div>

      <p className="text-sm text-sd-muted">
        <span className="font-medium text-sd-glow">{savedRegions.size}</span> of{" "}
        {ALL_REGIONS.length} regions saved
        {savedRegions.size < ALL_REGIONS.length && (
          <span className="text-sd-muted/70">
            {" "}
            — save each region tab after reviewing picks
          </span>
        )}
      </p>

      <div className="flex flex-wrap gap-2">
        {ALL_REGIONS.map((r) => {
          const isSaved = savedRegions.has(r);
          return (
            <button
              key={r}
              type="button"
              onClick={() => setRegion(r)}
              className={`rounded-lg px-4 py-2 text-sm transition ${
                r === region
                  ? "bg-gradient-to-r from-sd-lime to-emerald-400 font-semibold text-sd-deep"
                  : "sd-glass text-sd-muted hover:text-white"
              }`}
            >
              {REGION_LABELS[r]}
              {isSaved && (
                <span
                  className={`ml-1.5 text-xs ${
                    r === region ? "text-sd-deep/80" : "text-emerald-300/90"
                  }`}
                  aria-hidden
                >
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="sd-neon-panel p-4 text-sm text-sd-muted">
        <p>
          Automatic cut: top <strong className="text-white">{data.survivorCut}</strong> in{" "}
          {REGION_LABELS[region]} advance.
          {maxPoints != null && data.maxScoreCount > 0 && (
            <>
              {" "}
              <strong className="text-white">{data.maxScoreCount}</strong> eliminated branch
              {data.maxScoreCount === 1 ? "" : "es"} scored the max (
              {maxPoints}) and may need a manual pick.
            </>
          )}
        </p>
      </div>

      <section className="sd-neon-panel space-y-2 p-4">
        <h2 className="font-semibold text-sd-glow">
          Auto-advanced ({data.autoAdvanced.length})
        </h2>
        <ul className="sd-inset max-h-40 overflow-auto rounded-xl text-sm">
          {data.autoAdvanced.map((b) => (
            <li
              key={b.branch_id}
              className="flex justify-between border-b border-emerald-900/30 px-3 py-1.5 last:border-0"
            >
              <span>{b.branch_name}</span>
              <span className="tabular-nums text-sd-muted/70">
                {b.points} pts · rank {b.rank}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="sd-neon-panel space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-fuchsia-200">
            Also advance to Round {nextRound}
          </h2>
          {maxPoints != null && (
            <label className="flex items-center gap-2 text-sm text-sd-muted">
              <input
                type="checkbox"
                checked={onlyMax}
                onChange={(e) => setOnlyMax(e.target.checked)}
                className="accent-emerald-500"
              />
              Show only max score ({maxPoints})
            </label>
          )}
        </div>

        <ul className="sd-inset max-h-[40vh] overflow-auto rounded-xl">
          {filteredExtra.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-sd-muted/70">
              The automatic cut already decided who advances in{" "}
              {REGION_LABELS[region]} — no extra picks needed here.
            </li>
          ) : (
            filteredExtra.map((b) => (
              <li
                key={b.branch_id}
                className="flex items-center gap-3 border-b border-emerald-900/20 px-3 py-2 text-sm hover:bg-emerald-500/5"
              >
                <input
                  type="checkbox"
                  checked={selected[region].has(b.branch_id)}
                  onChange={() => toggle(b.branch_id)}
                  className="accent-emerald-500"
                />
                <span className="flex-1">{b.branch_name}</span>
                <span className="tabular-nums text-sd-muted/70">
                  {b.points} pts · rank {b.rank}
                  {b.isTieBreaker && (
                    <span className="ml-1 text-fuchsia-300">· tie breaker</span>
                  )}
                </span>
              </li>
            ))
          )}
        </ul>
        <p className="text-xs text-sd-muted/60">
          Selected: {selected[region].size} extra branch
          {selected[region].size === 1 ? "" : "es"}
        </p>
      </section>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={handleSave}
          className="sd-btn-primary rounded-lg px-4 py-2 text-sm disabled:opacity-50"
        >
          {loading ? "Saving…" : `Save picks for ${REGION_LABELS[region]}`}
        </button>
      </div>
      {message && <p className="text-sm text-sd-glow">{message}</p>}
    </div>
  );
}
