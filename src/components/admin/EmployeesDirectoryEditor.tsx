"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AdminConfirmPanel } from "@/components/admin/AdminConfirmPanel";
import { EmployeeProfileModal } from "@/components/admin/EmployeeProfileModal";
import { EmploymentStatusBadge } from "@/components/admin/EmploymentStatusBadge";
import { RepAvatar } from "@/components/ui/RepAvatar";
import { deleteEmployeesAction } from "@/lib/actions/admin";
import { nationalCompetitionsPath } from "@/lib/admin-routes";
import type { EmployeeAdminRow, EmploymentStatus, HrisBranchOption } from "@/lib/employee-types";
import { resolveEmployeePhotoUrl } from "@/lib/employee-photo-storage";

type ModalState =
  | { mode: "create" }
  | { mode: "edit"; employeeId: string }
  | null;

interface Props {
  employees: EmployeeAdminRow[];
  branches: HrisBranchOption[];
}

export function EmployeesDirectoryEditor({ employees, branches }: Props) {
  const router = useRouter();
  const selectAllRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    EmploymentStatus | "all" | "not_rep"
  >("all");
  const [modal, setModal] = useState<ModalState>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((row) => {
      if (statusFilter === "not_rep") {
        if (row.rep_assignments.length > 0) return false;
      } else if (statusFilter !== "all" && row.employment_status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        row.full_name.toLowerCase().includes(q) ||
        row.employee_no.toLowerCase().includes(q) ||
        (row.position?.toLowerCase().includes(q) ?? false) ||
        (row.home_branch_code?.toLowerCase().includes(q) ?? false) ||
        (row.home_branch_name?.toLowerCase().includes(q) ?? false) ||
        row.rep_assignments.some(
          (a) =>
            a.branch_code.toLowerCase().includes(q) ||
            a.branch_name.toLowerCase().includes(q)
        )
      );
    });
  }, [employees, search, statusFilter]);

  const stats = useMemo(() => {
    let active = 0;
    let onLeave = 0;
    let resigned = 0;
    let withHomeBranch = 0;
    let asRep = 0;
    let withPhoto = 0;
    let provisionalId = 0;

    for (const row of employees) {
      if (row.employment_status === "active") active++;
      else if (row.employment_status === "on_leave") onLeave++;
      else if (row.employment_status === "resigned") resigned++;

      if (row.home_branch_id || row.home_branch_code) withHomeBranch++;
      if (row.rep_assignments.length > 0) asRep++;
      if (row.photo_path) withPhoto++;
      if (
        row.employee_no.startsWith("PENDING-") ||
        row.employee_no.startsWith("LEGACY-")
      ) {
        provisionalId++;
      }
    }

    return {
      total: employees.length,
      active,
      onLeave,
      resigned,
      withHomeBranch,
      asRep,
      withPhoto,
      provisionalId,
    };
  }, [employees]);

  const filteredIds = useMemo(
    () => new Set(filtered.map((row) => row.id)),
    [filtered]
  );

  const selectedInView = useMemo(
    () => filtered.filter((row) => selectedIds.has(row.id)),
    [filtered, selectedIds]
  );

  const allFilteredSelected =
    filtered.length > 0 && selectedInView.length === filtered.length;
  const someFilteredSelected =
    selectedInView.length > 0 && selectedInView.length < filtered.length;

  useEffect(() => {
    const el = selectAllRef.current;
    if (el) el.indeterminate = someFilteredSelected;
  }, [someFilteredSelected]);

  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => filteredIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [filteredIds]);

  const selectedEmployee =
    modal?.mode === "edit"
      ? employees.find((e) => e.id === modal.employeeId) ?? null
      : null;

  function openCreate() {
    setModal({ mode: "create" });
    setMessage("");
    setError(false);
  }

  function openEdit(employeeId: string) {
    setModal({ mode: "edit", employeeId });
    setMessage("");
    setError(false);
  }

  function closeModal() {
    setModal(null);
  }

  function toggleRow(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const row of filtered) {
        if (checked) next.add(row.id);
        else next.delete(row.id);
      }
      return next;
    });
  }

  async function handleBulkDelete() {
    const ids = selectedInView.map((row) => row.id);
    if (ids.length === 0) return;

    setBulkDeleting(true);
    setMessage("");
    setError(false);
    try {
      const result = await deleteEmployeesAction(ids);
      if (!result.ok) throw new Error(result.error);

      const repSlots = selectedInView.reduce(
        (sum, row) => sum + row.rep_assignments.length,
        0
      );

      let msg = `${result.deletedCount} employee${
        result.deletedCount === 1 ? "" : "s"
      } removed.`;
      if (repSlots > 0) {
        msg += ` Cleared ${repSlots} competition rep slot(s).`;
      }
      if (result.errors.length > 0) {
        msg += ` ${result.errors.length} could not be deleted.`;
        setError(true);
      }

      setMessage(msg);
      setSelectedIds(new Set());
      setShowBulkDeleteConfirm(false);
      if (modal?.mode === "edit" && ids.includes(modal.employeeId)) {
        setModal(null);
      }
      router.refresh();
    } catch (e) {
      setError(true);
      setMessage(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setBulkDeleting(false);
    }
  }

  const bulkRepSlots = selectedInView.reduce(
    (sum, row) => sum + row.rep_assignments.length,
    0
  );

  return (
    <section className="sd-neon-panel space-y-5 p-5">
      <div>
        <h2 className="text-lg font-semibold text-white">Employee directory</h2>
        <p className="mt-1 text-sm text-sd-muted">
          HR profiles — employee number, name, position, nickname, contact, email,
          home branch, photo, and employment status. Open a profile to assign{" "}
          <strong className="font-normal text-white">Sword Duels</strong> rep
          slots (Rep 1 or Rep 2 per branch), or use the branch-by-branch table
          on{" "}
          <Link
            href={nationalCompetitionsPath("representatives")}
            className="sd-link"
          >
            Representatives
          </Link>
          .
        </p>
      </div>

      {employees.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sd-inset rounded-lg p-3">
              <p className="text-[10px] font-medium uppercase tracking-wide text-sd-muted">
                Total employees
              </p>
              <p className="mt-1 text-xl font-semibold text-emerald-300">
                {stats.total}
              </p>
              {(search.trim() || statusFilter !== "all") && (
                <p className="mt-1 text-[10px] text-sd-muted">
                  Showing {filtered.length} in list
                </p>
              )}
            </div>
            <div className="sd-inset rounded-lg p-3">
              <p className="text-[10px] font-medium uppercase tracking-wide text-sd-muted">
                Active
              </p>
              <p className="mt-1 text-xl font-semibold text-emerald-300">
                {stats.active}
              </p>
              {(stats.onLeave > 0 || stats.resigned > 0) && (
                <p className="mt-1 text-[10px] text-sd-muted">
                  {stats.onLeave > 0 && `${stats.onLeave} on leave`}
                  {stats.onLeave > 0 && stats.resigned > 0 && " · "}
                  {stats.resigned > 0 && `${stats.resigned} resigned`}
                </p>
              )}
            </div>
            <div className="sd-inset rounded-lg p-3">
              <p className="text-[10px] font-medium uppercase tracking-wide text-sd-muted">
                Home branch set
              </p>
              <p className="mt-1 text-xl font-semibold text-emerald-300">
                {stats.withHomeBranch}
              </p>
              <p className="mt-1 text-[10px] text-sd-muted">
                {stats.total - stats.withHomeBranch} without branch
              </p>
            </div>
            <div className="sd-inset rounded-lg p-3">
              <p className="text-[10px] font-medium uppercase tracking-wide text-sd-muted">
                Competition reps
              </p>
              <p className="mt-1 text-xl font-semibold text-emerald-300">
                {stats.asRep}
              </p>
              <p className="mt-1 text-[10px] text-sd-muted">
                {stats.withPhoto} with photo
                {stats.provisionalId > 0 &&
                  ` · ${stats.provisionalId} provisional id`}
              </p>
            </div>
          </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <input
          type="search"
          placeholder="Search name, employee no., home branch…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[200px] flex-1 rounded-lg sd-input px-3 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(
              e.target.value as EmploymentStatus | "all" | "not_rep"
            )
          }
          className="rounded-lg sd-input px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="not_rep">Not a rep yet</option>
          <option value="active">Active</option>
          <option value="on_leave">On leave</option>
          <option value="resigned">Resigned</option>
        </select>
        <button
          type="button"
          onClick={openCreate}
          className="sd-btn-primary rounded-lg px-4 py-2 text-sm"
        >
          Add employee
        </button>
        {selectedInView.length > 0 && (
          <button
            type="button"
            onClick={() => setShowBulkDeleteConfirm(true)}
            className="rounded-lg px-4 py-2 text-sm text-rose-100 ring-1 ring-rose-400/35 hover:bg-rose-500/10"
          >
            Delete selected ({selectedInView.length})
          </button>
        )}
      </div>

      {showBulkDeleteConfirm && selectedInView.length > 0 && (
        <AdminConfirmPanel
          title={`Delete ${selectedInView.length} employee${
            selectedInView.length === 1 ? "" : "s"
          }?`}
          tone="danger"
          confirmLabel={`Delete ${selectedInView.length}`}
          busy={bulkDeleting}
          onConfirm={() => void handleBulkDelete()}
          onCancel={() => setShowBulkDeleteConfirm(false)}
        >
          {bulkRepSlots > 0 ? (
            <p>
              This permanently removes the selected profiles and clears{" "}
              {bulkRepSlots} competition rep slot(s) on the Representatives page.
            </p>
          ) : (
            <p>This permanently removes the selected employee profiles.</p>
          )}
        </AdminConfirmPanel>
      )}

      {employees.length === 0 ? (
        <p className="text-sm text-sd-muted">
          No employee profiles yet. Click <strong>Add employee</strong> or assign
          reps on the Representatives page.
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-sd-muted">No employees match your filters.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead>
              <tr className="border-b border-emerald-500/15 text-xs uppercase tracking-wide text-sd-muted">
                <th className="w-10 px-2 py-2">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    aria-label="Select all visible employees"
                    className="rounded border-emerald-500/30 bg-sd-deep text-emerald-400"
                  />
                </th>
                <th className="px-2 py-2">Photo</th>
                <th className="px-2 py-2">Employee no.</th>
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Position</th>
                <th className="px-2 py-2">Home branch</th>
                <th className="px-2 py-2">Rep</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2 text-right"> </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const checked = selectedIds.has(row.id);
                return (
                  <tr
                    key={row.id}
                    className={`cursor-pointer border-b border-emerald-500/10 align-top transition hover:bg-sd-deep/20 ${
                      checked ? "bg-sd-deep/25" : ""
                    }`}
                    onClick={() => openEdit(row.id)}
                  >
                    <td
                      className="px-2 py-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => toggleRow(row.id, e.target.checked)}
                        aria-label={`Select ${row.full_name}`}
                        className="rounded border-emerald-500/30 bg-sd-deep text-emerald-400"
                      />
                    </td>
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
                    <td className="px-2 py-2 text-xs text-sd-muted">
                      {row.home_branch_code ? (
                        <>
                          <span className="text-emerald-100">
                            {row.home_branch_code}
                          </span>
                          {row.home_branch_name
                            ? ` · ${row.home_branch_name}`
                            : ""}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-2 py-2 text-xs">
                      {row.rep_assignments.length > 0 ? (
                        <div className="space-y-0.5">
                          {row.rep_assignments.map((a) => (
                            <p
                              key={`${a.branch_id}-${a.slot}`}
                              className="text-violet-200/90"
                            >
                              <span className="font-mono text-[10px] text-emerald-100">
                                {a.branch_code}
                              </span>{" "}
                              Rep {a.slot}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sd-muted/50">—</span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <EmploymentStatusBadge status={row.employment_status} />
                    </td>
                    <td className="px-2 py-2 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(row.id);
                        }}
                        className="sd-btn-ghost rounded px-2 py-1 text-xs"
                      >
                        View profile
                      </button>
                    </td>
                  </tr>
                );
              })}
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

      {modal && (
        <EmployeeProfileModal
          mode={modal.mode}
          employee={modal.mode === "edit" ? selectedEmployee : null}
          existingEmployees={employees}
          branches={branches}
          onClose={closeModal}
          onSaved={(msg) => {
            setMessage(msg);
            setError(false);
          }}
          onError={(msg) => {
            setMessage(msg);
            setError(true);
          }}
        />
      )}
    </section>
  );
}
