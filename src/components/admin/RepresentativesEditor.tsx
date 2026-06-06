"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminActionHint, AdminActionRow } from "@/components/admin/AdminActionHint";
import { EmploymentStatusBadge } from "@/components/admin/EmploymentStatusBadge";
import { saveBranchRepresentatives } from "@/lib/actions/admin";
import { ADMIN_ROSTER_HINTS } from "@/lib/admin-action-hints";
import type { EmploymentStatus } from "@/lib/employee-types";
import { repSnapshot, type RepresentativeSavePayload } from "@/lib/representative-fields";
import type { Branch } from "@/lib/types";
import { REGION_LABELS } from "@/lib/scoring-config";
import type { Region } from "@/lib/scoring-config";

type RowState = RepresentativeSavePayload & {
  branch_code: string;
  branch_name: string;
  area: string;
  region: Region;
  representative_1_employment_status?: EmploymentStatus | null;
  representative_2_employment_status?: EmploymentStatus | null;
};

interface Props {
  branches: Branch[];
  initialWithReps: number;
}

type RepField =
  | "representative_1"
  | "representative_1_employee_no"
  | "representative_1_position"
  | "representative_2"
  | "representative_2_employee_no"
  | "representative_2_position";

function branchToRow(b: Branch): RowState {
  return {
    branch_id: b.id,
    branch_code: b.branch_code,
    branch_name: b.branch_name,
    area: b.area,
    region: b.region,
    representative_1: b.representative_1 ?? "",
    representative_2: b.representative_2 ?? "",
    representative_1_employee_no: b.representative_1_employee_no ?? "",
    representative_1_position: b.representative_1_position ?? "",
    representative_2_employee_no: b.representative_2_employee_no ?? "",
    representative_2_position: b.representative_2_position ?? "",
    representative_1_employment_status: b.representative_1_employment_status ?? null,
    representative_2_employment_status: b.representative_2_employment_status ?? null,
  };
}

function RepBlock({
  title,
  nameField,
  empField,
  posField,
  status,
  row,
  onUpdate,
}: {
  title: string;
  nameField: "representative_1" | "representative_2";
  empField: "representative_1_employee_no" | "representative_2_employee_no";
  posField: "representative_1_position" | "representative_2_position";
  status?: EmploymentStatus | null;
  row: RowState;
  onUpdate: (branch_id: string, field: RepField, value: string) => void;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-emerald-500/15 bg-sd-deep/20 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-sd-muted/80">
          {title}
        </p>
        <EmploymentStatusBadge status={status} />
      </div>
      {status === "resigned" && row[nameField].trim() && (
        <p className="text-xs text-amber-200/90">
          This employee is marked resigned. Update their status on the Employees
          page if they are competing again.
        </p>
      )}
      <label className="block text-xs">
        <span className="text-sd-muted/70">Name</span>
        <input
          value={row[nameField]}
          onChange={(e) => onUpdate(row.branch_id, nameField, e.target.value)}
          placeholder="Full name"
          className="mt-1 w-full rounded sd-input px-2 py-1.5 text-sm"
        />
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block text-xs">
          <span className="text-sd-muted/70">Employee no.</span>
          <input
            value={row[empField]}
            onChange={(e) => onUpdate(row.branch_id, empField, e.target.value)}
            placeholder="e.g. 102345"
            className="mt-1 w-full rounded sd-input px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block text-xs">
          <span className="text-sd-muted/70">Position</span>
          <input
            value={row[posField]}
            onChange={(e) => onUpdate(row.branch_id, posField, e.target.value)}
            placeholder="Job title"
            className="mt-1 w-full rounded sd-input px-2 py-1.5 text-sm"
          />
        </label>
      </div>
    </div>
  );
}

export function RepresentativesEditor({ branches, initialWithReps }: Props) {
  const initialRows = useMemo(() => branches.map(branchToRow), [branches]);

  const [rows, setRows] = useState<RowState[]>(initialRows);
  const [baseline, setBaseline] = useState<RowState[]>(initialRows);

  useEffect(() => {
    setRows(initialRows);
    setBaseline(initialRows);
  }, [initialRows]);

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
          r.representative_1.toLowerCase().includes(q) ||
          r.representative_1_employee_no.toLowerCase().includes(q) ||
          r.representative_1_position.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [rows, search, areaFilter]);

  const filledCount = rows.filter((r) => r.representative_1.trim()).length;

  const baselineById = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of baseline) {
      map.set(row.branch_id, repSnapshot(row));
    }
    return map;
  }, [baseline]);

  const dirtyRows = useMemo(
    () => rows.filter((r) => repSnapshot(r) !== baselineById.get(r.branch_id)),
    [rows, baselineById]
  );

  const hasUnsavedChanges = dirtyRows.length > 0;

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasUnsavedChanges]);

  function updateRow(branch_id: string, field: RepField, value: string) {
    setRows((prev) =>
      prev.map((r) => (r.branch_id === branch_id ? { ...r, [field]: value } : r))
    );
  }

  async function handleSaveAll() {
    if (dirtyRows.length === 0) {
      setMessage("No changes to save.");
      setError(false);
      return;
    }

    setLoading(true);
    setMessage("");
    setError(false);
    try {
      const result = await saveBranchRepresentatives(
        dirtyRows.map((r) => ({
          branch_id: r.branch_id,
          representative_1: r.representative_1,
          representative_2: r.representative_2,
          representative_1_employee_no: r.representative_1_employee_no,
          representative_1_position: r.representative_1_position,
          representative_2_employee_no: r.representative_2_employee_no,
          representative_2_position: r.representative_2_position,
        }))
      );
      if (result.ok) {
        setBaseline([...rows]);
        setMessage(`Saved ${result.count} changed branch${result.count === 1 ? "" : "es"}.`);
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
      <p className="text-sd-glow">
        Import participating branches first (Admin → Branches), then return here.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Edit representatives</h2>
        <p className="mt-1 text-sm text-sd-muted">
          Name, employee number, and position for each rep. Stored on the branch
          roster for future LMS use.
        </p>
      </div>

      <div className="sd-alert-info text-sm">
        <span className="font-medium text-emerald-300">{filledCount}</span>
        <span> of {rows.length} branches have a primary representative</span>
        {hasUnsavedChanges && (
          <span className="text-amber-200/90">
            {" "}
            · {dirtyRows.length} unsaved change
            {dirtyRows.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <input
          type="search"
          placeholder="Search branch, name, employee no., position…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[200px] flex-1 rounded-lg sd-input px-3 py-2 text-sm"
        />
        <select
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value)}
          className="rounded-lg sd-input px-3 py-2 text-sm"
        >
          <option value="">All areas</option>
          {areas.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <ul className="space-y-4 md:hidden">
        {filtered.map((row) => (
          <li key={row.branch_id} className="sd-neon-panel space-y-3 p-4">
            <div>
              <p className="font-medium text-white">{row.branch_name}</p>
              <p className="text-xs text-sd-muted/70">
                {row.branch_code} · {row.area} · {REGION_LABELS[row.region]}
              </p>
            </div>
            <RepBlock
              title="Representative 1"
              nameField="representative_1"
              empField="representative_1_employee_no"
              posField="representative_1_position"
              status={row.representative_1_employment_status}
              row={row}
              onUpdate={updateRow}
            />
            <RepBlock
              title="Representative 2"
              nameField="representative_2"
              empField="representative_2_employee_no"
              posField="representative_2_position"
              status={row.representative_2_employment_status}
              row={row}
              onUpdate={updateRow}
            />
          </li>
        ))}
      </ul>

      <div className="sd-table-wrap sd-inset hidden max-h-[55vh] md:block">
        <table className="sd-table min-w-[960px]">
          <thead className="sticky top-0 z-10 bg-sd-deep/95 shadow-[0_1px_0_rgb(74_222_128/0.25)] backdrop-blur-md">
            <tr>
              <th className="px-2 py-2 text-left">Branch</th>
              <th className="px-2 py-2 text-left">Area</th>
              <th className="px-2 py-2 text-left" colSpan={3}>
                Representative 1
              </th>
              <th className="px-2 py-2 text-left" colSpan={3}>
                Representative 2
              </th>
            </tr>
            <tr className="text-[10px] uppercase text-sd-muted/60">
              <th colSpan={2} />
              <th className="px-2 py-1 font-normal">Name</th>
              <th className="px-2 py-1 font-normal">Emp. no.</th>
              <th className="px-2 py-1 font-normal">Position</th>
              <th className="px-2 py-1 font-normal">Name</th>
              <th className="px-2 py-1 font-normal">Emp. no.</th>
              <th className="px-2 py-1 font-normal">Position</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.branch_id} className="border-t border-emerald-900/20">
                <td className="px-2 py-1">
                  <div className="font-medium">{row.branch_name}</div>
                  <div className="text-xs text-sd-muted/60">{row.branch_code}</div>
                </td>
                <td className="px-2 py-1 text-sd-muted">{row.area}</td>
                {(
                  [
                    ["representative_1", "Primary name"],
                    ["representative_1_employee_no", "Emp no."],
                    ["representative_1_position", "Position"],
                    ["representative_2", "Optional"],
                    ["representative_2_employee_no", "Emp no."],
                    ["representative_2_position", "Position"],
                  ] as const
                ).map(([field, placeholder]) => (
                  <td key={field} className="px-2 py-1">
                    <input
                      value={row[field]}
                      onChange={(e) =>
                        updateRow(row.branch_id, field, e.target.value)
                      }
                      placeholder={placeholder}
                      className="w-full min-w-[100px] rounded sd-input px-2 py-1 text-sm"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-sd-muted/60">
        Showing {filtered.length} of {rows.length} branches
      </p>

      {hasUnsavedChanges && (
        <AdminActionHint hint={ADMIN_ROSTER_HINTS.unsavedRepresentatives} />
      )}

      <AdminActionRow hint={ADMIN_ROSTER_HINTS.saveRepresentatives}>
        <button
          type="button"
          disabled={loading || !hasUnsavedChanges}
          onClick={handleSaveAll}
          className="sd-btn-primary rounded-lg px-5 py-2.5 text-sm disabled:opacity-50"
        >
          {loading
            ? "Saving…"
            : hasUnsavedChanges
              ? `Save ${dirtyRows.length} change${dirtyRows.length === 1 ? "" : "s"}`
              : "No changes to save"}
        </button>
      </AdminActionRow>

      {message && (
        <p
          className={`text-sm ${error ? "sd-alert-warning" : "sd-alert-info"}`}
          role="status"
        >
          {message}
        </p>
      )}
    </div>
  );
}
