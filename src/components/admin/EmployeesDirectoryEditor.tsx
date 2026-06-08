"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { EmployeePhotoEditor } from "@/components/admin/EmployeePhotoEditor";
import { EmploymentStatusBadge } from "@/components/admin/EmploymentStatusBadge";
import { RepAvatar } from "@/components/ui/RepAvatar";
import {
  createEmployeeAction,
  saveEmployeeProfileAction,
  setEmployeeEmploymentStatusAction,
} from "@/lib/actions/admin";
import { nationalCompetitionsPath } from "@/lib/admin-routes";
import type { EmployeeAdminRow, EmploymentStatus } from "@/lib/employee-types";
import { employmentStatusLabel } from "@/lib/employee-types";
import { resolveEmployeePhotoUrl } from "@/lib/employee-photo-storage";

interface Props {
  employees: EmployeeAdminRow[];
}

type EditState = {
  employee_no: string;
  full_name: string;
  position: string;
  notes: string;
};

function emptyNewEmployee(): EditState {
  return { employee_no: "", full_name: "", position: "", notes: "" };
}

export function EmployeesDirectoryEditor({ employees }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EmploymentStatus | "all">(
    "all"
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditState>(emptyNewEmployee());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmployee, setNewEmployee] = useState<EditState>(emptyNewEmployee());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((row) => {
      if (statusFilter !== "all" && row.employment_status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        row.full_name.toLowerCase().includes(q) ||
        row.employee_no.toLowerCase().includes(q) ||
        (row.position?.toLowerCase().includes(q) ?? false) ||
        row.rep_assignments.some(
          (a) =>
            a.branch_code.toLowerCase().includes(q) ||
            a.branch_name.toLowerCase().includes(q)
        )
      );
    });
  }, [employees, search, statusFilter]);

  function startEdit(row: EmployeeAdminRow) {
    setEditingId(row.id);
    setEditDraft({
      employee_no: row.employee_no,
      full_name: row.full_name,
      position: row.position ?? "",
      notes: row.notes ?? "",
    });
    setShowAddForm(false);
  }

  async function handleSaveEdit() {
    if (!editingId) return;
    setLoading(true);
    setMessage("");
    setError(false);
    try {
      const result = await saveEmployeeProfileAction(editingId, editDraft);
      if (!result.ok) throw new Error("Save failed");
      setMessage("Employee profile updated.");
      setEditingId(null);
      router.refresh();
    } catch (e) {
      setError(true);
      setMessage(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newEmployee.employee_no.trim() || !newEmployee.full_name.trim()) {
      setError(true);
      setMessage("Employee number and full name are required.");
      return;
    }
    setLoading(true);
    setMessage("");
    setError(false);
    try {
      const result = await createEmployeeAction(newEmployee);
      if (!result.ok) throw new Error("Create failed");
      setMessage("Employee created.");
      setNewEmployee(emptyNewEmployee());
      setShowAddForm(false);
      router.refresh();
    } catch (e) {
      setError(true);
      setMessage(e instanceof Error ? e.message : "Create failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(
    employeeId: string,
    status: EmploymentStatus
  ) {
    setLoading(true);
    setMessage("");
    setError(false);
    try {
      const result = await setEmployeeEmploymentStatusAction(employeeId, status);
      if (!result.ok) throw new Error("Status update failed");
      setMessage(`Marked as ${employmentStatusLabel(status).toLowerCase()}.`);
      router.refresh();
    } catch (e) {
      setError(true);
      setMessage(e instanceof Error ? e.message : "Update failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="sd-neon-panel space-y-5 p-5">
      <div>
        <h2 className="text-lg font-semibold text-white">Employee directory</h2>
        <p className="mt-1 text-sm text-sd-muted">
          Competition rep profiles keyed by employee number — including photos
          shown on Sword Duels brackets and nationals. Assign reps on the{" "}
          <Link
            href={nationalCompetitionsPath("representatives")}
            className="sd-link"
          >
            Representatives
          </Link>{" "}
          page — saving there updates these profiles automatically.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <input
          type="search"
          placeholder="Search name, employee no., branch…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[200px] flex-1 rounded-lg sd-input px-3 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as EmploymentStatus | "all")
          }
          className="rounded-lg sd-input px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="on_leave">On leave</option>
          <option value="resigned">Resigned</option>
        </select>
        <button
          type="button"
          onClick={() => {
            setShowAddForm((v) => !v);
            setEditingId(null);
          }}
          className="sd-btn-ghost rounded-lg px-4 py-2 text-sm"
        >
          {showAddForm ? "Cancel add" : "Add employee"}
        </button>
      </div>

      {showAddForm && (
        <div className="sd-inset grid gap-3 rounded-lg p-4 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-1">
            <span className="text-sd-muted">Employee no.</span>
            <input
              value={newEmployee.employee_no}
              onChange={(e) =>
                setNewEmployee((s) => ({ ...s, employee_no: e.target.value }))
              }
              className="mt-1 block w-full rounded sd-input px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm sm:col-span-1">
            <span className="text-sd-muted">Full name</span>
            <input
              value={newEmployee.full_name}
              onChange={(e) =>
                setNewEmployee((s) => ({ ...s, full_name: e.target.value }))
              }
              className="mt-1 block w-full rounded sd-input px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm sm:col-span-1">
            <span className="text-sd-muted">Position</span>
            <input
              value={newEmployee.position}
              onChange={(e) =>
                setNewEmployee((s) => ({ ...s, position: e.target.value }))
              }
              className="mt-1 block w-full rounded sd-input px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-sd-muted">Notes</span>
            <input
              value={newEmployee.notes}
              onChange={(e) =>
                setNewEmployee((s) => ({ ...s, notes: e.target.value }))
              }
              className="mt-1 block w-full rounded sd-input px-3 py-2 text-sm"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => void handleCreate()}
              className="sd-btn-primary rounded-lg px-4 py-2 text-sm disabled:opacity-50"
            >
              {loading ? "Saving…" : "Create employee"}
            </button>
          </div>
        </div>
      )}

      {employees.length === 0 ? (
        <p className="text-sm text-sd-muted">
          No employee profiles yet. Add reps on the Representatives page or
          create a profile here first.
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-sd-muted">No employees match your filters.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead>
              <tr className="border-b border-emerald-500/15 text-xs uppercase tracking-wide text-sd-muted">
                <th className="px-2 py-2">Photo</th>
                <th className="px-2 py-2">Employee no.</th>
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Position</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Rep for branch</th>
                <th className="px-2 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) =>
                editingId === row.id ? (
                  <tr
                    key={row.id}
                    className="border-b border-emerald-500/10 bg-sd-deep/30"
                  >
                    <td colSpan={7} className="px-2 py-3">
                      <div className="mb-4">
                        <EmployeePhotoEditor
                          employeeId={row.id}
                          name={editDraft.full_name || row.full_name}
                          photoPath={row.photo_path}
                          disabled={loading}
                          onMessage={(msg, err) => {
                            setMessage(msg);
                            setError(!!err);
                          }}
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block text-xs">
                          <span className="text-sd-muted">Employee no.</span>
                          <input
                            value={editDraft.employee_no}
                            onChange={(e) =>
                              setEditDraft((s) => ({
                                ...s,
                                employee_no: e.target.value,
                              }))
                            }
                            className="mt-1 w-full rounded sd-input px-2 py-1.5 text-sm"
                          />
                        </label>
                        <label className="block text-xs">
                          <span className="text-sd-muted">Full name</span>
                          <input
                            value={editDraft.full_name}
                            onChange={(e) =>
                              setEditDraft((s) => ({
                                ...s,
                                full_name: e.target.value,
                              }))
                            }
                            className="mt-1 w-full rounded sd-input px-2 py-1.5 text-sm"
                          />
                        </label>
                        <label className="block text-xs">
                          <span className="text-sd-muted">Position</span>
                          <input
                            value={editDraft.position}
                            onChange={(e) =>
                              setEditDraft((s) => ({
                                ...s,
                                position: e.target.value,
                              }))
                            }
                            className="mt-1 w-full rounded sd-input px-2 py-1.5 text-sm"
                          />
                        </label>
                        <label className="block text-xs sm:col-span-2">
                          <span className="text-sd-muted">Notes</span>
                          <input
                            value={editDraft.notes}
                            onChange={(e) =>
                              setEditDraft((s) => ({
                                ...s,
                                notes: e.target.value,
                              }))
                            }
                            className="mt-1 w-full rounded sd-input px-2 py-1.5 text-sm"
                          />
                        </label>
                        <div className="flex flex-wrap gap-2 sm:col-span-2">
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => void handleSaveEdit()}
                            className="sd-btn-primary rounded-lg px-3 py-1.5 text-sm"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="sd-btn-ghost rounded-lg px-3 py-1.5 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr
                    key={row.id}
                    className="border-b border-emerald-500/10 align-top"
                  >
                    <td className="px-2 py-2">
                      <RepAvatar
                        name={row.full_name}
                        photoUrl={resolveEmployeePhotoUrl(row.photo_path)}
                        size="sm"
                      />
                    </td>
                    <td className="px-2 py-2 font-mono text-xs text-emerald-100">
                      {row.employee_no}
                    </td>
                    <td className="px-2 py-2 font-medium text-white">
                      {row.full_name}
                    </td>
                    <td className="px-2 py-2 text-sd-muted">
                      {row.position || "—"}
                    </td>
                    <td className="px-2 py-2">
                      <EmploymentStatusBadge status={row.employment_status} />
                      {row.employment_status === "active" && (
                        <span className="text-xs text-sd-muted">Active</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-xs text-sd-muted">
                      {row.rep_assignments.length === 0 ? (
                        "—"
                      ) : (
                        <ul className="space-y-0.5">
                          {row.rep_assignments.map((a) => (
                            <li key={`${a.branch_id}-${a.slot}`}>
                              {a.branch_code} · Rep {a.slot}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-2 py-2 text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => startEdit(row)}
                          className="sd-btn-ghost rounded px-2 py-1 text-xs"
                        >
                          Edit
                        </button>
                        {row.employment_status !== "active" && (
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() =>
                              void handleStatusChange(row.id, "active")
                            }
                            className="sd-btn-ghost rounded px-2 py-1 text-xs"
                          >
                            Mark active
                          </button>
                        )}
                        {row.employment_status !== "on_leave" && (
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() =>
                              void handleStatusChange(row.id, "on_leave")
                            }
                            className="sd-btn-ghost rounded px-2 py-1 text-xs"
                          >
                            On leave
                          </button>
                        )}
                        {row.employment_status !== "resigned" && (
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() =>
                              void handleStatusChange(row.id, "resigned")
                            }
                            className="rounded px-2 py-1 text-xs text-rose-200 hover:bg-rose-500/10"
                          >
                            Resigned
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}

      {message && (
        <p
          className={`text-sm ${error ? "text-red-300" : "text-emerald-300"}`}
        >
          {message}
        </p>
      )}
    </section>
  );
}
