"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminActionHint, AdminActionRow } from "@/components/admin/AdminActionHint";
import { EmployeeRepPicker } from "@/components/admin/EmployeeRepPicker";
import { EmploymentStatusBadge } from "@/components/admin/EmploymentStatusBadge";
import { saveBranchRepresentatives } from "@/lib/actions/admin";
import { ADMIN_ROSTER_HINTS } from "@/lib/admin-action-hints";
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

interface Props {
  branches: Branch[];
  employees: EmployeePickerRow[];
  initialWithReps: number;
}

type RepSlot = 1 | 2;

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

export function RepresentativesEditor({ branches, employees, initialWithReps }: Props) {
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
          r.representative_1_position.toLowerCase().includes(q) ||
          r.representative_2.toLowerCase().includes(q) ||
          r.representative_2_employee_no.toLowerCase().includes(q)
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

  if (branches.length === 0) {
    return (
      <p className="text-sd-glow">
        Import participating branches first in HRIS → Branches, then return here.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Edit representatives</h2>
        <p className="mt-1 text-sm text-sd-muted">
          Pick reps from the HRIS employee directory so names, positions, and
          photos flow through to Sword Duels leaderboards.
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

      <ul className="space-y-4">
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
              slot={1}
              row={row}
              employees={employees}
              onApplyEmployee={applyEmployeeToSlot}
              onFieldChange={updateRepField}
            />
            <RepBlock
              title="Representative 2"
              slot={2}
              row={row}
              employees={employees}
              onApplyEmployee={applyEmployeeToSlot}
              onFieldChange={updateRepField}
            />
          </li>
        ))}
      </ul>

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
