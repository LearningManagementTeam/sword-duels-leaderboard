"use client";

import { useMemo, useState } from "react";
import { StatusBadge } from "./StatusBadge";
import type { StandingRow } from "@/lib/types";
import { REGION_LABELS, TIE_BREAKER_LABELS } from "@/lib/scoring-config";
import type { Region } from "@/lib/scoring-config";

interface Props {
  rows: StandingRow[];
  advancementCutoff?: number;
  showArea?: boolean;
  showRegion?: boolean;
  showRepresentatives?: boolean;
  compact?: boolean;
}

export function LeaderboardTable({
  rows,
  advancementCutoff = 24,
  showArea = true,
  showRegion = false,
  showRepresentatives = false,
  compact = false,
}: Props) {
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const areas = useMemo(
    () => [...new Set(rows.map((r) => r.area))].sort(),
    [rows]
  );

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !r.branch_name.toLowerCase().includes(q) &&
          !r.branch_code.toLowerCase().includes(q) &&
          !(r.representative_1?.toLowerCase().includes(q) ?? false) &&
          !(r.representative_2?.toLowerCase().includes(q) ?? false)
        ) {
          return false;
        }
      }
      if (areaFilter && r.area !== areaFilter) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      return true;
    });
  }, [rows, search, areaFilter, statusFilter]);

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <input
            type="search"
            placeholder="Search branch name or code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[200px] flex-1 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500"
          />
          {showArea && (
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white"
            >
              <option value="">All areas</option>
              {areas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          )}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="advanced">Advancing</option>
            <option value="eliminated">Eliminated</option>
            <option value="regional_finalist">Regional finalist</option>
            <option value="champion">Champion</option>
          </select>
        </div>
      )}

      <p className="text-xs text-slate-400">
        Tie-breakers: {TIE_BREAKER_LABELS.join(" → ")}
      </p>

      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-800/80 text-slate-300">
            <tr>
              <th className="px-3 py-2 font-medium">Rank</th>
              <th className="px-3 py-2 font-medium">Branch</th>
              {showArea && <th className="px-3 py-2 font-medium">Area</th>}
              {showRegion && (
                <th className="px-3 py-2 font-medium">Region</th>
              )}
              {showRepresentatives && (
                <th className="px-3 py-2 font-medium">Representatives</th>
              )}
              <th className="px-3 py-2 font-medium text-right">R1</th>
              <th className="px-3 py-2 font-medium text-right">R2</th>
              <th className="px-3 py-2 font-medium text-right">R3</th>
              <th className="px-3 py-2 font-medium text-right">Total</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    7 +
                    (showArea ? 1 : 0) +
                    (showRegion ? 1 : 0) +
                    (showRepresentatives ? 1 : 0)
                  }
                  className="px-3 py-8 text-center text-slate-400"
                >
                  No standings published yet.
                </td>
              </tr>
            ) : (
              filtered.flatMap((row) => {
                const showCutLine =
                  advancementCutoff > 0 &&
                  row.rank === advancementCutoff + 1 &&
                  filtered.some((r) => r.rank === advancementCutoff);

                const colSpan =
                  7 +
                  (showArea ? 1 : 0) +
                  (showRegion ? 1 : 0) +
                  (showRepresentatives ? 1 : 0);
                const items = [];

                if (showCutLine) {
                  items.push(
                    <tr key={`cut-${row.branch_id}`}>
                      <td
                        colSpan={colSpan}
                        className="border-y-2 border-dashed border-amber-500/60 bg-amber-500/10 px-3 py-1 text-center text-xs font-medium text-amber-300"
                      >
                        Cut line — top {advancementCutoff} advance
                      </td>
                    </tr>
                  );
                }

                items.push(
                    <tr
                      key={row.branch_id}
                      className={`border-t border-slate-800 ${
                        row.rank <= advancementCutoff
                          ? "bg-emerald-950/30"
                          : ""
                      }`}
                    >
                      <td className="px-3 py-2 font-mono text-slate-300">
                        {row.rank}
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-white">
                          {row.branch_name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {row.branch_code}
                        </div>
                      </td>
                      {showArea && (
                        <td className="px-3 py-2 text-slate-300">{row.area}</td>
                      )}
                      {showRegion && (
                        <td className="px-3 py-2 text-slate-300">
                          {REGION_LABELS[row.region as Region]}
                        </td>
                      )}
                      {showRepresentatives && (
                        <td className="px-3 py-2 text-slate-300">
                          <div className="text-xs">
                            {row.representative_1 || "—"}
                          </div>
                          {row.representative_2 && (
                            <div className="text-xs text-slate-500">
                              {row.representative_2}
                            </div>
                          )}
                        </td>
                      )}
                      <td className="px-3 py-2 text-right tabular-nums">
                        {row.round1_points}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {row.round2_points}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {row.round3_points}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums text-amber-300">
                        {row.total_points}
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge status={row.status} />
                      </td>
                    </tr>
                );
                return items;
              })
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">
        Showing {filtered.length} of {rows.length} branches
      </p>
    </div>
  );
}
