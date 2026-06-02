"use client";

import { useMemo, useState } from "react";
import { saveBranchRepresentatives } from "@/lib/actions/admin";
import type { Branch } from "@/lib/types";
import { REGION_LABELS } from "@/lib/scoring-config";
import type { Region } from "@/lib/scoring-config";

type RowState = {
  branch_id: string;
  branch_code: string;
  branch_name: string;
  area: string;
  region: Region;
  representative_1: string;
  representative_2: string;
};

interface Props {
  branches: Branch[];
  initialWithReps: number;
}

export function RepresentativesEditor({ branches, initialWithReps }: Props) {
  const [rows, setRows] = useState<RowState[]>(() =>
    branches.map((b) => ({
      branch_id: b.id,
      branch_code: b.branch_code,
      branch_name: b.branch_name,
      area: b.area,
      region: b.region,
      representative_1: b.representative_1 ?? "",
      representative_2: b.representative_2 ?? "",
    }))
  );
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const areas = useMemo(
    () => [...new Set(rows.map((r) => r.area))].sort(),
    [rows]
  );

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (areaFilter && r.area !== areaFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.branch_name.toLowerCase().includes(q) ||
          r.branch_code.toLowerCase().includes(q) ||
          r.representative_1.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [rows, search, areaFilter]);

  const filledCount = rows.filter((r) => r.representative_1.trim()).length;

  function updateRow(
    branch_id: string,
    field: "representative_1" | "representative_2",
    value: string
  ) {
    setRows((prev) =>
      prev.map((r) =>
        r.branch_id === branch_id ? { ...r, [field]: value } : r
      )
    );
  }

  async function handleSaveAll() {
    setLoading(true);
    setMessage("");
    setError(false);
    try {
      const result = await saveBranchRepresentatives(
        rows.map((r) => ({
          branch_id: r.branch_id,
          representative_1: r.representative_1,
          representative_2: r.representative_2,
        }))
      );
      if (result.ok) {
        setMessage(`Saved representatives for ${result.count} branches.`);
      } else {
        setError(true);
        setMessage(result.errors.join(" "));
      }
    } catch (e) {
      setError(true);
      setMessage(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setLoading(false);
    }
  }

  if (branches.length === 0) {
    return (
      <p className="text-amber-200">
        Import participating branches first (Admin → Branches), then return here.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Edit in table</h2>
        <p className="mt-1 text-sm text-slate-400">
          Update names anytime. Leave blank to clear a representative. Click
          save when finished.
        </p>
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 text-sm">
        <span className="font-medium text-emerald-300">{filledCount}</span>
        <span className="text-slate-400">
          {" "}
          of {rows.length} branches have a primary representative
        </span>
        {initialWithReps !== filledCount && (
          <span className="text-slate-500"> (unsaved edits in table)</span>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <input
          type="search"
          placeholder="Search branch or representative…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[200px] flex-1 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm"
        />
        <select
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm"
        >
          <option value="">All areas</option>
          {areas.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <div className="max-h-[50vh] overflow-auto rounded-lg border border-slate-700">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="sticky top-0 bg-slate-800 text-slate-300">
            <tr>
              <th className="px-2 py-2 text-left">Branch</th>
              <th className="px-2 py-2 text-left">Area</th>
              <th className="px-2 py-2 text-left">Region</th>
              <th className="px-2 py-2 text-left">Representative 1</th>
              <th className="px-2 py-2 text-left">Representative 2</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.branch_id} className="border-t border-slate-800">
                <td className="px-2 py-1">
                  <div className="font-medium">{row.branch_name}</div>
                  <div className="text-xs text-slate-500">{row.branch_code}</div>
                </td>
                <td className="px-2 py-1 text-slate-400">{row.area}</td>
                <td className="px-2 py-1 text-slate-400">
                  {REGION_LABELS[row.region]}
                </td>
                <td className="px-2 py-1">
                  <input
                    value={row.representative_1}
                    onChange={(e) =>
                      updateRow(row.branch_id, "representative_1", e.target.value)
                    }
                    placeholder="Primary name"
                    className="w-full min-w-[140px] rounded border border-slate-600 bg-slate-950 px-2 py-1"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    value={row.representative_2}
                    onChange={(e) =>
                      updateRow(row.branch_id, "representative_2", e.target.value)
                    }
                    placeholder="Optional"
                    className="w-full min-w-[140px] rounded border border-slate-600 bg-slate-950 px-2 py-1"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500">
        Showing {filtered.length} of {rows.length} branches
      </p>

      <button
        type="button"
        disabled={loading}
        onClick={handleSaveAll}
        className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-amber-400 disabled:opacity-50"
      >
        {loading ? "Saving…" : "Save all representatives"}
      </button>

      {message && (
        <p
          className={`text-sm ${error ? "text-red-300" : "text-emerald-300"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
