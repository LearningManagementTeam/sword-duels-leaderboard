"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EmployeeRepPicker } from "@/components/admin/EmployeeRepPicker";
import { EmploymentStatusBadge } from "@/components/admin/EmploymentStatusBadge";
import { RepAvatar } from "@/components/ui/RepAvatar";
import { saveBranchRepresentatives } from "@/lib/actions/admin";
import { ADMIN_ROSTER_HINTS } from "@/lib/admin-action-hints";
import { resolveEmployeePhotoUrl } from "@/lib/employee-photo-storage";
import type { EmployeePickerRow, EmploymentStatus } from "@/lib/employee-types";
import { repSnapshot, type RepresentativeSavePayload } from "@/lib/representative-fields";
import type { Branch } from "@/lib/types";
import { REGION_LABELS } from "@/lib/scoring-config";
import type { Region } from "@/lib/scoring-config";

type RowState = RepresentativeSavePayload & {
  branch_code: string;
  branch_name: string;
  area: string;
  region: Region;
  representative_1_employee_id: string | null;
  representative_2_employee_id: string | null;
  representative_1_photo_path: string | null;
  representative_2_photo_path: string | null;
  representative_1_employment_status: EmploymentStatus | null;
  representative_2_employment_status: EmploymentStatus | null;
};

type RepSlot = 1 | 2;

type StatusFilter =
  | "all"
  | "incomplete"
  | "missing_rep2"
  | "needs_attention"
  | "unsaved";

interface Props {
  branches: Branch[];
  employees: EmployeePickerRow[];
  initialWithReps: number;
}

const SLOT_FIELDS: Record<
  RepSlot,
  {
    name: "representative_1" | "representative_2";
    empNo: "representative_1_employee_no" | "representative_2_employee_no";
    position: "representative_1_position" | "representative_2_position";
    employeeId: "representative_1_employee_id" | "representative_2_employee_id";
    photoPath: "representative_1_photo_path" | "representative_2_photo_path";
    status: "representative_1_employment_status" | "representative_2_employment_status";
  }
> = {
  1: {
    name: "representative_1",
    empNo: "representative_1_employee_no",
    position: "representative_1_position",
    employeeId: "representative_1_employee_id",
    photoPath: "representative_1_photo_path",
    status: "representative_1_employment_status",
  },
  2: {
    name: "representative_2",
    empNo: "representative_2_employee_no",
    position: "representative_2_position",
    employeeId: "representative_2_employee_id",
    photoPath: "representative_2_photo_path",
    status: "representative_2_employment_status",
  },
};

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
    representative_1_employee_id: b.representative_1_employee_id ?? null,
    representative_2_employee_id: b.representative_2_employee_id ?? null,
    representative_1_photo_path: b.representative_1_photo_path ?? null,
    representative_2_photo_path: b.representative_2_photo_path ?? null,
    representative_1_employment_status: b.representative_1_employment_status ?? null,
    representative_2_employment_status: b.representative_2_employment_status ?? null,
  };
}

function repNeedsAttention(row: RowState, slot: RepSlot): boolean {
  const fields = SLOT_FIELDS[slot];
  const name = row[fields.name].trim();
  if (!name) return false;

  if (row[fields.status] === "resigned") return true;

  const empNo = row[fields.empNo].trim();
  const linked = Boolean(row[fields.employeeId]);
  if (empNo && !linked) return true;

  return false;
}

function rowNeedsAttention(row: RowState): boolean {
  return repNeedsAttention(row, 1) || repNeedsAttention(row, 2);
}

function rowIsDirty(row: RowState, baselineById: Map<string, string>): boolean {
  return repSnapshot(row) !== baselineById.get(row.branch_id);
}

function RepSummaryCell({ row, slot }: { row: RowState; slot: RepSlot }) {
  const fields = SLOT_FIELDS[slot];
  const name = row[fields.name].trim();
  if (!name) {
    return <span className="text-sd-muted/50">—</span>;
  }

  const photoUrl = resolveEmployeePhotoUrl(row[fields.photoPath]);
  const attention = repNeedsAttention(row, slot);

  return (
    <div className="flex min-w-0 items-center gap-2">
      <RepAvatar name={name} photoUrl={photoUrl} size="sm" muted={attention} />
      <div className="min-w-0">
        <p className="truncate text-white">{name}</p>
        {row[fields.empNo] && (
          <p className="truncate text-[10px] text-sd-muted">{row[fields.empNo]}</p>
        )}
      </div>
      {attention && (
        <span
          className="shrink-0 text-amber-300"
          title="Resigned or not linked to HRIS directory"
        >
          ⚠
        </span>
      )}
    </div>
  );
}

function RepBlock({
  title,
  slot,
  row,
  employees,
  onApplyEmployee,
  onFieldChange,
}: {
  title: string;
  slot: RepSlot;
  row: RowState;
  employees: EmployeePickerRow[];
  onApplyEmployee: (branchId: string, slot: RepSlot, employee: EmployeePickerRow | null) => void;
  onFieldChange: (
    branchId: string,
    slot: RepSlot,
    field: "name" | "employee_no" | "position",
    value: string
  ) => void;
}) {
  const fields = SLOT_FIELDS[slot];

  return (
    <div className="space-y-2 rounded-lg border border-emerald-500/15 bg-sd-deep/20 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-sd-muted/80">
          {title}
        </p>
        <EmploymentStatusBadge status={row[fields.status]} />
      </div>
      {row[fields.status] === "resigned" && row[fields.name].trim() && (
        <p className="text-xs text-amber-200/90">
          This employee is marked resigned. Update their status in HRIS → Employee
          directory if they are competing again.
        </p>
      )}
      <EmployeeRepPicker
        employees={employees}
        employeeId={row[fields.employeeId]}
        employeeNo={row[fields.empNo]}
        name={row[fields.name]}
        position={row[fields.position]}
        photoPath={row[fields.photoPath]}
        employmentStatus={row[fields.status]}
        onApply={(employee) => onApplyEmployee(row.branch_id, slot, employee)}
        onEmployeeNoChange={(value) =>
          onFieldChange(row.branch_id, slot, "employee_no", value)
        }
        onNameChange={(value) => onFieldChange(row.branch_id, slot, "name", value)}
        onPositionChange={(value) =>
          onFieldChange(row.branch_id, slot, "position", value)
        }
      />
    </div>
  );
}

function RepresentativesEditDrawer({
  row,
  employees,
  filteredRows,
  onClose,
  onApplyEmployee,
  onFieldChange,
  onNavigate,
}: {
  row: RowState;
  employees: EmployeePickerRow[];
  filteredRows: RowState[];
  onClose: () => void;
  onApplyEmployee: (branchId: string, slot: RepSlot, employee: EmployeePickerRow | null) => void;
  onFieldChange: (
    branchId: string,
    slot: RepSlot,
    field: "name" | "employee_no" | "position",
    value: string
  ) => void;
  onNavigate: (branchId: string) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const index = filteredRows.findIndex((r) => r.branch_id === row.branch_id);
  const hasPrev = index > 0;
  const hasNext = index >= 0 && index < filteredRows.length - 1;

  const handleClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowLeft" && hasPrev) {
        onNavigate(filteredRows[index - 1]!.branch_id);
      }
      if (e.key === "ArrowRight" && hasNext) {
        onNavigate(filteredRows[index + 1]!.branch_id);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose, hasPrev, hasNext, index, filteredRows, onNavigate]);

  useEffect(() => {
    panelRef.current?.focus();
  }, [row.branch_id]);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-sd-deep/70 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rep-drawer-title"
        className="flex h-full w-full max-w-lg flex-col border-l border-emerald-500/20 bg-sd-deep shadow-2xl outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-emerald-500/15 p-4">
          <div className="min-w-0">
            <h2 id="rep-drawer-title" className="truncate text-lg font-semibold text-white">
              {row.branch_name}
            </h2>
            <p className="text-xs text-sd-muted">
              {row.branch_code} · {row.area} · {REGION_LABELS[row.region]}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="sd-btn-ghost shrink-0 rounded-lg px-2 py-1 text-sm"
          >
            Close
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <RepBlock
            title="Representative 1"
            slot={1}
            row={row}
            employees={employees}
            onApplyEmployee={onApplyEmployee}
            onFieldChange={onFieldChange}
          />
          <RepBlock
            title="Representative 2"
            slot={2}
            row={row}
            employees={employees}
            onApplyEmployee={onApplyEmployee}
            onFieldChange={onFieldChange}
          />
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-emerald-500/15 p-4">
          <button
            type="button"
            disabled={!hasPrev}
            onClick={() => onNavigate(filteredRows[index - 1]!.branch_id)}
            className="sd-btn-ghost rounded-lg px-3 py-1.5 text-xs disabled:opacity-40"
          >
            ← Previous
          </button>
          <p className="text-[10px] text-sd-muted">
            {index + 1} of {filteredRows.length}
          </p>
          <button
            type="button"
            disabled={!hasNext}
            onClick={() => onNavigate(filteredRows[index + 1]!.branch_id)}
            className="sd-btn-ghost rounded-lg px-3 py-1.5 text-xs disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

export function RepresentativesEditor({ branches, employees }: Props) {
  const initialRows = useMemo(() => branches.map(branchToRow), [branches]);

  const [rows, setRows] = useState<RowState[]>(initialRows);
  const [baseline, setBaseline] = useState<RowState[]>(initialRows);

  useEffect(() => {
    setRows(initialRows);
    setBaseline(initialRows);
  }, [initialRows]);

  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const areas = useMemo(
    () => [...new Set(rows.map((r) => r.area))].sort(),
    [rows]
  );

  const baselineById = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of baseline) {
      map.set(row.branch_id, repSnapshot(row));
    }
    return map;
  }, [baseline]);

  const stats = useMemo(() => {
    let rep1Count = 0;
    let rep2Count = 0;
    let missingRep2 = 0;
    let needsAttention = 0;

    for (const row of rows) {
      const hasRep1 = Boolean(row.representative_1.trim());
      const hasRep2 = Boolean(row.representative_2.trim());
      if (hasRep1) rep1Count++;
      if (hasRep2) rep2Count++;
      if (hasRep1 && !hasRep2) missingRep2++;
      if (rowNeedsAttention(row)) needsAttention++;
    }

    return {
      rep1Count,
      rep2Count,
      missingRep2,
      needsAttention,
      total: rows.length,
    };
  }, [rows]);

  const dirtyRows = useMemo(
    () => rows.filter((r) => rowIsDirty(r, baselineById)),
    [rows, baselineById]
  );

  const dirtyIds = useMemo(
    () => new Set(dirtyRows.map((r) => r.branch_id)),
    [dirtyRows]
  );

  const hasUnsavedChanges = dirtyRows.length > 0;

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (areaFilter && r.area !== areaFilter) return false;

      if (statusFilter === "incomplete" && r.representative_1.trim()) {
        return false;
      }
      if (
        statusFilter === "missing_rep2" &&
        (!r.representative_1.trim() || r.representative_2.trim())
      ) {
        return false;
      }
      if (statusFilter === "needs_attention" && !rowNeedsAttention(r)) {
        return false;
      }
      if (statusFilter === "unsaved" && !dirtyIds.has(r.branch_id)) {
        return false;
      }

      if (search) {
        const q = search.toLowerCase();
        return (
          r.branch_name.toLowerCase().includes(q) ||
          r.branch_code.toLowerCase().includes(q) ||
          r.representative_1.toLowerCase().includes(q) ||
          r.representative_1_employee_no.toLowerCase().includes(q) ||
          r.representative_2.toLowerCase().includes(q) ||
          r.representative_2_employee_no.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [rows, search, areaFilter, statusFilter, dirtyIds]);

  const selectedRow = useMemo(
    () => rows.find((r) => r.branch_id === selectedBranchId) ?? null,
    [rows, selectedBranchId]
  );

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasUnsavedChanges]);

  function applyEmployeeToSlot(
    branchId: string,
    slot: RepSlot,
    employee: EmployeePickerRow | null
  ) {
    const fields = SLOT_FIELDS[slot];
    setRows((prev) =>
      prev.map((row) => {
        if (row.branch_id !== branchId) return row;
        if (!employee) {
          return {
            ...row,
            [fields.name]: "",
            [fields.empNo]: "",
            [fields.position]: "",
            [fields.employeeId]: null,
            [fields.photoPath]: null,
            [fields.status]: null,
          };
        }
        return {
          ...row,
          [fields.name]: employee.full_name,
          [fields.empNo]: employee.employee_no,
          [fields.position]: employee.position ?? "",
          [fields.employeeId]: employee.id,
          [fields.photoPath]: employee.photo_path,
          [fields.status]: employee.employment_status,
        };
      })
    );
  }

  function updateRepField(
    branchId: string,
    slot: RepSlot,
    field: "name" | "employee_no" | "position",
    value: string
  ) {
    const fields = SLOT_FIELDS[slot];
    const key =
      field === "name"
        ? fields.name
        : field === "employee_no"
          ? fields.empNo
          : fields.position;

    setRows((prev) =>
      prev.map((row) => {
        if (row.branch_id !== branchId) return row;
        const next = { ...row, [key]: value };
        if (field !== "employee_no") return next;
        return {
          ...next,
          [fields.employeeId]: null,
          [fields.photoPath]: null,
          [fields.status]: null,
        };
      })
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

  function handleDiscard() {
    setRows([...baseline]);
    setMessage("Discarded unsaved changes.");
    setError(false);
  }

  if (branches.length === 0) {
    return (
      <p className="text-sd-glow">
        Import participating branches first in HRIS → Branches, then return here.
      </p>
    );
  }

  const statusChips: { id: StatusFilter; label: string; count?: number }[] = [
    { id: "all", label: "All" },
    {
      id: "incomplete",
      label: "Missing Rep 1",
      count: stats.total - stats.rep1Count,
    },
    {
      id: "missing_rep2",
      label: "Missing Rep 2",
      count: stats.missingRep2,
    },
    {
      id: "needs_attention",
      label: "Needs attention",
      count: stats.needsAttention,
    },
    {
      id: "unsaved",
      label: "Unsaved",
      count: dirtyRows.length,
    },
  ];

  return (
    <div className={`space-y-5 ${hasUnsavedChanges ? "pb-24" : ""}`}>
      <div>
        <h2 className="text-lg font-semibold text-white">Review & fix representatives</h2>
        <p className="mt-1 text-sm text-sd-muted">
          Use CSV import above for bulk setup. This table is for scanning progress and
          fixing individual branches — click a row to edit reps.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sd-inset rounded-lg p-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-sd-muted">
            Rep 1 assigned
          </p>
          <p className="mt-1 text-xl font-semibold text-emerald-300">
            {stats.rep1Count}
            <span className="text-sm font-normal text-sd-muted"> / {stats.total}</span>
          </p>
        </div>
        <div className="sd-inset rounded-lg p-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-sd-muted">
            Rep 2 assigned
          </p>
          <p className="mt-1 text-xl font-semibold text-emerald-300">
            {stats.rep2Count}
            <span className="text-sm font-normal text-sd-muted"> / {stats.total}</span>
          </p>
        </div>
        <div className="sd-inset rounded-lg p-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-sd-muted">
            Has Rep 1, no Rep 2
          </p>
          <p className="mt-1 text-xl font-semibold text-amber-200">{stats.missingRep2}</p>
        </div>
        <div className="sd-inset rounded-lg p-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-sd-muted">
            Needs attention
          </p>
          <p className="mt-1 text-xl font-semibold text-amber-200">{stats.needsAttention}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <input
          type="search"
          placeholder="Search branch, code, rep name, employee no…"
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

      <div className="flex flex-wrap gap-2">
        {statusChips.map((chip) => {
          const active = statusFilter === chip.id;
          const disabled = chip.id !== "all" && chip.count === 0;
          return (
            <button
              key={chip.id}
              type="button"
              disabled={disabled}
              onClick={() => setStatusFilter(chip.id)}
              className={`rounded-full px-3 py-1 text-xs transition ${
                active
                  ? "bg-emerald-500/25 text-emerald-100 ring-1 ring-emerald-400/40"
                  : "bg-sd-deep/40 text-sd-muted ring-1 ring-emerald-500/10 hover:ring-emerald-400/25 disabled:opacity-40"
              }`}
            >
              {chip.label}
              {chip.count !== undefined && chip.count > 0 && (
                <span className="ml-1 font-mono text-emerald-300">{chip.count}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="sd-table-wrap sd-inset max-h-[min(70vh,720px)] overflow-auto">
        <table className="sd-table min-w-[880px] text-sm">
          <thead className="sticky top-0 z-10 bg-sd-deep/95 backdrop-blur-sm">
            <tr>
              <th className="px-3 py-2 text-left">Branch</th>
              <th className="px-3 py-2 text-left">Area</th>
              <th className="px-3 py-2 text-left">Rep 1</th>
              <th className="px-3 py-2 text-left">Rep 2</th>
              <th className="px-3 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const hasRep1 = Boolean(row.representative_1.trim());
              const dirty = dirtyIds.has(row.branch_id);
              const attention = rowNeedsAttention(row);
              const selected = selectedBranchId === row.branch_id;

              let statusLabel = "Complete";
              let statusClass = "text-emerald-300";
              if (!hasRep1) {
                statusLabel = "Missing Rep 1";
                statusClass = "text-rose-300";
              } else if (attention) {
                statusLabel = "Review";
                statusClass = "text-amber-300";
              } else if (!row.representative_2.trim()) {
                statusLabel = "No Rep 2";
                statusClass = "text-sd-muted";
              }

              return (
                <tr
                  key={row.branch_id}
                  className={`cursor-pointer transition hover:bg-emerald-500/5 ${
                    selected ? "bg-emerald-500/10" : ""
                  } ${dirty ? "ring-1 ring-inset ring-amber-400/20" : ""}`}
                  onClick={() => setSelectedBranchId(row.branch_id)}
                >
                  <td className="px-3 py-2">
                    <p className="font-medium text-white">{row.branch_name}</p>
                    <p className="font-mono text-[10px] text-sd-muted">{row.branch_code}</p>
                  </td>
                  <td className="px-3 py-2 text-sd-muted">{row.area}</td>
                  <td className="max-w-[200px] px-3 py-2">
                    <RepSummaryCell row={row} slot={1} />
                  </td>
                  <td className="max-w-[200px] px-3 py-2">
                    <RepSummaryCell row={row} slot={2} />
                  </td>
                  <td className="px-3 py-2">
                    <span className={`text-xs font-medium ${statusClass}`}>
                      {statusLabel}
                    </span>
                    {dirty && (
                      <span className="mt-0.5 block text-[10px] text-amber-200/80">
                        Unsaved
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-sd-muted/60">
        Showing {filtered.length} of {rows.length} branches · click a row to edit
      </p>

      {message && (
        <p
          className={`text-sm ${error ? "sd-alert-warning" : "sd-alert-info"}`}
          role="status"
        >
          {message}
        </p>
      )}

      {selectedRow && (
        <RepresentativesEditDrawer
          row={selectedRow}
          employees={employees}
          filteredRows={filtered}
          onClose={() => setSelectedBranchId(null)}
          onApplyEmployee={applyEmployeeToSlot}
          onFieldChange={updateRepField}
          onNavigate={setSelectedBranchId}
        />
      )}

      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-emerald-500/20 bg-sd-deep/95 px-4 py-3 backdrop-blur-md transition ${
          hasUnsavedChanges ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-amber-200">
            {dirtyRows.length} unsaved change{dirtyRows.length === 1 ? "" : "s"}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={handleDiscard}
              className="sd-btn-ghost rounded-lg px-4 py-2 text-sm disabled:opacity-50"
            >
              Discard
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleSaveAll}
              className="sd-btn-primary rounded-lg px-5 py-2 text-sm disabled:opacity-50"
              title={ADMIN_ROSTER_HINTS.saveRepresentatives}
            >
              {loading
                ? "Saving…"
                : `Save ${dirtyRows.length} change${dirtyRows.length === 1 ? "" : "s"}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
