"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { EmployeePhotoEditor } from "@/components/admin/EmployeePhotoEditor";
import { EmploymentStatusBadge } from "@/components/admin/EmploymentStatusBadge";
import { RepAvatar } from "@/components/ui/RepAvatar";
import {
  createEmployeeAction,
  deleteEmployeeAction,
  saveEmployeeProfileAction,
  setEmployeeEmploymentStatusAction,
  uploadEmployeePhotoAction,
} from "@/lib/actions/admin";
import { nationalCompetitionsPath } from "@/lib/admin-routes";
import type { EmployeeAdminRow, EmploymentStatus } from "@/lib/employee-types";
import { employmentStatusLabel } from "@/lib/employee-types";
import { resolveEmployeePhotoUrl } from "@/lib/employee-photo-storage";
import { normalizeAllCapsText } from "@/lib/text-format";

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

function closeForms(setters: {
  setEditingId: (id: string | null) => void;
  setShowAddForm: (open: boolean) => void;
  setEditDraft: Dispatch<SetStateAction<EditState>>;
  setNewEmployee: Dispatch<SetStateAction<EditState>>;
  setNewEmployeePhoto: (file: File | null) => void;
}) {
  setters.setEditingId(null);
  setters.setShowAddForm(false);
  setters.setEditDraft(emptyNewEmployee());
  setters.setNewEmployee(emptyNewEmployee());
  setters.setNewEmployeePhoto(null);
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
  const [newEmployeePhoto, setNewEmployeePhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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

  function resetForms() {
    closeForms({
      setEditingId,
      setShowAddForm,
      setEditDraft,
      setNewEmployee,
      setNewEmployeePhoto,
    });
    setDeleteConfirmId(null);
  }

  function startAdd() {
    resetForms();
    setShowAddForm(true);
    setMessage("");
    setError(false);
  }

  function startEdit(row: EmployeeAdminRow) {
    setEditingId(row.id);
    setEditDraft({
      employee_no: row.employee_no,
      full_name: row.full_name,
      position: row.position ?? "",
      notes: row.notes ?? "",
    });
    setShowAddForm(false);
    setDeleteConfirmId(null);
    setMessage("");
    setError(false);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft(emptyNewEmployee());
    setMessage("");
    setError(false);
  }

  function cancelAdd() {
    setShowAddForm(false);
    setNewEmployee(emptyNewEmployee());
    setNewEmployeePhoto(null);
    setMessage("");
    setError(false);
  }

  async function handleSaveEdit() {
    if (!editingId) return;
    if (!editDraft.employee_no.trim() || !editDraft.full_name.trim()) {
      setError(true);
      setMessage("Employee number and full name are required.");
      return;
    }
    setLoading(true);
    setMessage("");
    setError(false);
    try {
      const result = await saveEmployeeProfileAction(editingId, {
        ...editDraft,
        full_name: normalizeAllCapsText(editDraft.full_name),
        position: normalizeAllCapsText(editDraft.position),
        notes: normalizeAllCapsText(editDraft.notes),
      });
      if (!result.ok) throw new Error(result.error);
      setMessage("Employee updated.");
      setEditingId(null);
      setEditDraft(emptyNewEmployee());
      router.refresh();
    } catch (e) {
      setError(true);
      setMessage(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setLoading(false);
    }
  }

  function applyCapsOnBlur<K extends keyof EditState>(
    value: string,
    setter: Dispatch<SetStateAction<EditState>>,
    field: K
  ) {
    const normalized = normalizeAllCapsText(value);
    if (normalized !== value) {
      setter((s) => ({ ...s, [field]: normalized }));
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
      const payload = {
        employee_no: newEmployee.employee_no,
        full_name: normalizeAllCapsText(newEmployee.full_name),
        position: normalizeAllCapsText(newEmployee.position),
        notes: normalizeAllCapsText(newEmployee.notes),
      };
      const result = await createEmployeeAction(payload);
      if (!result.ok) throw new Error(result.error);

      if (newEmployeePhoto) {
        const formData = new FormData();
        formData.set("file", newEmployeePhoto);
        const photoResult = await uploadEmployeePhotoAction(
          result.employee.id,
          formData
        );
        if (!photoResult.ok) {
          setError(true);
          setMessage(
            `Employee created, but photo upload failed: ${photoResult.error}`
          );
          resetForms();
          router.refresh();
          return;
        }
      }

      setMessage(
        newEmployeePhoto ? "Employee created with photo." : "Employee created."
      );
      resetForms();
      router.refresh();
    } catch (e) {
      setError(true);
      setMessage(e instanceof Error ? e.message : "Create failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(employeeId: string, fullName: string) {
    setLoading(true);
    setMessage("");
    setError(false);
    try {
      const result = await deleteEmployeeAction(employeeId);
      if (!result.ok) throw new Error(result.error);
      setMessage(`${fullName} removed from the directory.`);
      resetForms();
      router.refresh();
    } catch (e) {
      setError(true);
      setMessage(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setLoading(false);
      setDeleteConfirmId(null);
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
      if (!result.ok) throw new Error(result.error ?? "Status update failed");
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
          onClick={() => (showAddForm ? cancelAdd() : startAdd())}
          className="sd-btn-primary rounded-lg px-4 py-2 text-sm"
        >
          {showAddForm ? "Cancel add" : "Add employee"}
        </button>
      </div>

      {showAddForm && (
        <div className="sd-inset space-y-4 rounded-lg p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-violet-200/80">
            New employee
          </p>
          <EmployeePhotoEditor
            name={newEmployee.full_name || "New employee"}
            draftFile={newEmployeePhoto}
            onDraftFileChange={setNewEmployeePhoto}
            disabled={loading}
            onMessage={(msg, err) => {
              if (msg) {
                setMessage(msg);
                setError(!!err);
              }
            }}
          />
          <div className="grid gap-3 sm:grid-cols-2">
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
                onBlur={(e) =>
                  applyCapsOnBlur(e.target.value, setNewEmployee, "full_name")
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
                onBlur={(e) =>
                  applyCapsOnBlur(e.target.value, setNewEmployee, "position")
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
                onBlur={(e) =>
                  applyCapsOnBlur(e.target.value, setNewEmployee, "notes")
                }
                className="mt-1 block w-full rounded sd-input px-3 py-2 text-sm"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => void handleCreate()}
              className="sd-btn-primary rounded-lg px-4 py-2 text-sm disabled:opacity-50"
            >
              {loading ? "Saving…" : "Create employee"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={cancelAdd}
              className="sd-btn-ghost rounded-lg px-4 py-2 text-sm disabled:opacity-50"
            >
              Cancel
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
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead>
              <tr className="border-b border-emerald-500/15 text-xs uppercase tracking-wide text-sd-muted">
                <th className="px-2 py-2">Photo</th>
                <th className="px-2 py-2">Employee no.</th>
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Position</th>
                <th className="px-2 py-2">Status</th>
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
                    <td colSpan={6} className="px-2 py-3">
                      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-violet-200/80">
                        Edit employee
                      </p>
                      <EmployeePhotoEditor
                        employeeId={row.id}
                        name={editDraft.full_name || row.full_name}
                        photoPath={row.photo_path}
                        disabled={loading}
                        onMessage={(msg, err) => {
                          if (msg) {
                            setMessage(msg);
                            setError(!!err);
                          }
                        }}
                      />
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
                            onBlur={(e) =>
                              applyCapsOnBlur(
                                e.target.value,
                                setEditDraft,
                                "full_name"
                              )
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
                            onBlur={(e) =>
                              applyCapsOnBlur(
                                e.target.value,
                                setEditDraft,
                                "position"
                              )
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
                            onBlur={(e) =>
                              applyCapsOnBlur(e.target.value, setEditDraft, "notes")
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
                            {loading ? "Saving…" : "Save changes"}
                          </button>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={cancelEdit}
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
                    </td>
                    <td className="px-2 py-2 text-right">
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex flex-wrap justify-end gap-1">
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => startEdit(row)}
                            className="sd-btn-ghost rounded px-2 py-1 text-xs"
                          >
                            Edit
                          </button>
                          {deleteConfirmId === row.id ? (
                            <div className="max-w-[14rem] space-y-1 text-right">
                              {row.rep_assignments.length > 0 && (
                                <p className="text-[10px] leading-snug text-amber-200/90">
                                  Also clears {row.rep_assignments.length} branch rep
                                  slot(s).
                                </p>
                              )}
                              <div className="flex flex-wrap justify-end gap-1">
                                <button
                                  type="button"
                                  disabled={loading}
                                  onClick={() =>
                                    void handleDelete(row.id, row.full_name)
                                  }
                                  className="rounded bg-rose-500/20 px-2 py-1 text-xs text-rose-100 ring-1 ring-rose-400/40"
                                >
                                  Confirm delete
                                </button>
                                <button
                                  type="button"
                                  disabled={loading}
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="sd-btn-ghost rounded px-2 py-1 text-xs"
                                >
                                  Keep
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() => {
                                setDeleteConfirmId(row.id);
                                setEditingId(null);
                                setShowAddForm(false);
                              }}
                              className="rounded px-2 py-1 text-xs text-rose-200 hover:bg-rose-500/10"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                        <div className="flex flex-wrap justify-end gap-1">
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
                              className="sd-btn-ghost rounded px-2 py-1 text-xs"
                            >
                              Resigned
                            </button>
                          )}
                        </div>
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
          role="status"
          aria-live="polite"
          className={`rounded-lg border px-3 py-2 text-sm ${
            error
              ? "border-rose-400/35 bg-rose-500/10 text-rose-100"
              : "border-emerald-400/35 bg-emerald-500/10 text-emerald-100"
          }`}
        >
          {message}
        </p>
      )}
    </section>
  );
}
