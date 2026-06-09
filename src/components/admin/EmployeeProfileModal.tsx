"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminConfirmPanel } from "@/components/admin/AdminConfirmPanel";
import { EmployeePhotoEditor } from "@/components/admin/EmployeePhotoEditor";
import { EmploymentStatusBadge } from "@/components/admin/EmploymentStatusBadge";
import {
  createEmployeeAction,
  deleteEmployeeAction,
  saveEmployeeProfileAction,
  setEmployeeEmploymentStatusAction,
} from "@/lib/actions/admin";
import { findEmployeeDirectoryDuplicateMessage } from "@/lib/employee-directory-duplicate";
import { nationalCompetitionsPath } from "@/lib/admin-routes";
import type {
  EmployeeAdminRow,
  EmploymentStatus,
  HrisBranchOption,
} from "@/lib/employee-types";
import { employmentStatusLabel } from "@/lib/employee-types";
import { normalizeAllCapsText } from "@/lib/text-format";

type ProfileDraft = {
  employee_no: string;
  full_name: string;
  position: string;
  notes: string;
  home_branch_id: string;
};

function emptyDraft(): ProfileDraft {
  return {
    employee_no: "",
    full_name: "",
    position: "",
    notes: "",
    home_branch_id: "",
  };
}

function draftFromEmployee(employee: EmployeeAdminRow): ProfileDraft {
  return {
    employee_no: employee.employee_no,
    full_name: employee.full_name,
    position: employee.position ?? "",
    notes: employee.notes ?? "",
    home_branch_id: employee.home_branch_id ?? "",
  };
}

interface Props {
  mode: "create" | "edit";
  employee: EmployeeAdminRow | null;
  existingEmployees: EmployeeAdminRow[];
  branches: HrisBranchOption[];
  onClose: () => void;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}

export function EmployeeProfileModal({
  mode,
  employee,
  existingEmployees,
  branches,
  onClose,
  onSaved,
  onError,
}: Props) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<ProfileDraft>(
    employee ? draftFromEmployee(employee) : emptyDraft()
  );
  const [draftPhoto, setDraftPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [branchFilter, setBranchFilter] = useState("");
  const [listStale, setListStale] = useState(false);

  const isCreate = mode === "create";
  const displayName = draft.full_name || employee?.full_name || "New employee";

  useEffect(() => {
    setDraft(employee ? draftFromEmployee(employee) : emptyDraft());
    setDraftPhoto(null);
    setShowDeleteConfirm(false);
    setBranchFilter("");
    setListStale(false);
  }, [employee, mode]);

  const handleClose = useCallback(() => {
    if (loading) return;
    if (listStale) {
      router.refresh();
    }
    onClose();
  }, [listStale, loading, onClose, router]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  const filteredBranches = useMemo(() => {
    const q = branchFilter.trim().toLowerCase();
    if (!q) return branches;
    return branches.filter(
      (b) =>
        b.branch_code.toLowerCase().includes(q) ||
        b.branch_name.toLowerCase().includes(q) ||
        (b.area?.toLowerCase().includes(q) ?? false)
    );
  }, [branches, branchFilter]);

  function applyCapsOnBlur(field: keyof ProfileDraft, value: string) {
    const normalized = normalizeAllCapsText(value);
    if (normalized !== value) {
      setDraft((s) => ({ ...s, [field]: normalized }));
    }
  }

  const finishSuccess = useCallback(
    (message: string) => {
      onSaved(message);
      onClose();
      router.refresh();
    },
    [onClose, onSaved, router]
  );

  async function uploadDraftPhoto(employeeId: string, file: File): Promise<string | null> {
    const formData = new FormData();
    formData.set("employeeId", employeeId);
    formData.set("file", file);
    const response = await fetch("/api/hris/employee-photo", {
      method: "POST",
      body: formData,
    });
    const data = (await response.json()) as {
      ok?: boolean;
      error?: string;
      photoUrl?: string;
    };
    if (!response.ok || !data.ok) {
      return data.error ?? "Photo upload failed.";
    }
    return null;
  }

  async function handleSave() {
    if (!draft.employee_no.trim() || !draft.full_name.trim()) {
      onError("Employee number and full name are required.");
      return;
    }

    const payload = {
      employee_no: draft.employee_no,
      full_name: normalizeAllCapsText(draft.full_name),
      position: normalizeAllCapsText(draft.position),
      notes: normalizeAllCapsText(draft.notes),
      home_branch_id: draft.home_branch_id.trim() || null,
    };

    const duplicateMessage = findEmployeeDirectoryDuplicateMessage(
      existingEmployees,
      payload,
      employee?.id
    );
    if (duplicateMessage) {
      onError(duplicateMessage);
      return;
    }

    setLoading(true);
    try {
      if (isCreate) {
        const result = await createEmployeeAction(payload);
        if (!result.ok) throw new Error(result.error);

        if (draftPhoto) {
          const photoError = await uploadDraftPhoto(result.employee.id, draftPhoto);
          if (photoError) {
            finishSuccess(
              `Employee created, but photo upload failed: ${photoError}`
            );
            return;
          }
          finishSuccess("Employee created with photo.");
          return;
        }

        finishSuccess("Employee created.");
        return;
      }

      if (employee) {
        const result = await saveEmployeeProfileAction(employee.id, payload);
        if (!result.ok) throw new Error(result.error);
        finishSuccess("Employee updated.");
      }
    } catch (e) {
      onError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(status: EmploymentStatus) {
    if (!employee) return;
    setLoading(true);
    try {
      const result = await setEmployeeEmploymentStatusAction(employee.id, status);
      if (!result.ok) throw new Error(result.error);
      onSaved(`Marked as ${employmentStatusLabel(status).toLowerCase()}.`);
      onClose();
      router.refresh();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Status update failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!employee) return;
    setLoading(true);
    try {
      const result = await deleteEmployeeAction(employee.id);
      if (!result.ok) throw new Error(result.error);
      onSaved(`${employee.full_name} removed from the directory.`);
      onClose();
      router.refresh();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-sd-deep/80 p-4 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={handleClose}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="employee-profile-title"
        className="sd-neon-panel my-4 w-full max-w-lg space-y-5 p-5 outline-none sm:my-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="employee-profile-title" className="text-lg font-semibold text-white">
              {isCreate ? "New employee" : displayName}
            </h2>
            {!isCreate && employee && (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-emerald-100">
                  {employee.employee_no}
                </span>
                <EmploymentStatusBadge status={employee.employment_status} />
              </div>
            )}
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={handleClose}
            className="sd-btn-ghost rounded-lg px-2 py-1 text-sm"
            aria-label="Close"
          >
            Close
          </button>
        </div>

        <EmployeePhotoEditor
          {...(isCreate
            ? {
                draftFile: draftPhoto,
                onDraftFileChange: setDraftPhoto,
              }
            : {
                employeeId: employee!.id,
                photoPath: employee!.photo_path,
                onPhotoUpdated: () => setListStale(true),
              })}
          name={displayName}
          disabled={loading}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-1">
            <span className="text-sd-muted">Employee no.</span>
            <input
              value={draft.employee_no}
              onChange={(e) =>
                setDraft((s) => ({ ...s, employee_no: e.target.value }))
              }
              className="mt-1 block w-full rounded sd-input px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm sm:col-span-1">
            <span className="text-sd-muted">Full name</span>
            <input
              value={draft.full_name}
              onChange={(e) =>
                setDraft((s) => ({ ...s, full_name: e.target.value }))
              }
              onBlur={(e) => applyCapsOnBlur("full_name", e.target.value)}
              className="mt-1 block w-full rounded sd-input px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm sm:col-span-1">
            <span className="text-sd-muted">Position</span>
            <input
              value={draft.position}
              onChange={(e) =>
                setDraft((s) => ({ ...s, position: e.target.value }))
              }
              onBlur={(e) => applyCapsOnBlur("position", e.target.value)}
              className="mt-1 block w-full rounded sd-input px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm sm:col-span-1">
            <span className="text-sd-muted">Home branch</span>
            <input
              type="search"
              placeholder="Filter branches…"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="mt-1 block w-full rounded sd-input px-3 py-2 text-sm"
            />
            <select
              value={draft.home_branch_id}
              onChange={(e) =>
                setDraft((s) => ({ ...s, home_branch_id: e.target.value }))
              }
              className="mt-1 block w-full rounded sd-input px-3 py-2 text-sm"
            >
              <option value="">None / Unassigned</option>
              {filteredBranches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.branch_code} · {b.branch_name}
                  {b.area ? ` (${b.area})` : ""}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[10px] text-sd-muted/70">
              Work location only — not the same as competition rep assignment.
            </p>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-sd-muted">Notes</span>
            <input
              value={draft.notes}
              onChange={(e) =>
                setDraft((s) => ({ ...s, notes: e.target.value }))
              }
              onBlur={(e) => applyCapsOnBlur("notes", e.target.value)}
              className="mt-1 block w-full rounded sd-input px-3 py-2 text-sm"
            />
          </label>
        </div>

        {!isCreate && employee && (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-sd-muted">
                Employment status
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["active", "on_leave", "resigned"] as EmploymentStatus[]).map(
                  (status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={loading || employee.employment_status === status}
                      onClick={() => void handleStatusChange(status)}
                      className={`rounded-lg px-3 py-1.5 text-xs disabled:opacity-50 ${
                        employee.employment_status === status
                          ? "sd-btn-primary"
                          : "sd-btn-ghost"
                      }`}
                    >
                      {employmentStatusLabel(status)}
                    </button>
                  )
                )}
              </div>
            </div>

            {employee.rep_assignments.length > 0 && (
              <p className="text-xs text-amber-200/90">
                Competition rep for{" "}
                {employee.rep_assignments
                  .map((a) => `${a.branch_code} (Rep ${a.slot})`)
                  .join(", ")}
                . Assign reps on{" "}
                <Link
                  href={nationalCompetitionsPath("representatives")}
                  className="sd-link"
                >
                  Revalida → Representatives
                </Link>
                .
              </p>
            )}
          </div>
        )}

        <p className="text-xs text-sd-muted">
          Competition representatives are assigned in{" "}
          <Link
            href={nationalCompetitionsPath("representatives")}
            className="sd-link"
          >
            Revalida → Representatives
          </Link>
          , not here.
        </p>

        {showDeleteConfirm && employee ? (
          <AdminConfirmPanel
            title={`Delete ${employee.full_name}?`}
            tone="danger"
            confirmLabel="Delete employee"
            busy={loading}
            onConfirm={() => void handleDelete()}
            onCancel={() => setShowDeleteConfirm(false)}
          >
            {employee.rep_assignments.length > 0 ? (
              <p>
                This also clears {employee.rep_assignments.length} competition
                rep slot(s) on the Representatives page.
              </p>
            ) : (
              <p>This permanently removes the employee profile.</p>
            )}
          </AdminConfirmPanel>
        ) : (
          <div className="flex flex-wrap gap-2 border-t border-emerald-500/15 pt-4">
            <button
              type="button"
              disabled={loading}
              onClick={() => void handleSave()}
              className="sd-btn-primary rounded-lg px-4 py-2 text-sm disabled:opacity-50"
            >
              {loading
                ? "Saving…"
                : isCreate
                  ? "Create employee"
                  : "Save changes"}
            </button>
            {!isCreate && employee && (
              <button
                type="button"
                disabled={loading}
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-lg px-4 py-2 text-sm text-rose-200 ring-1 ring-rose-400/30 hover:bg-rose-500/10 disabled:opacity-50"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              disabled={loading}
              onClick={handleClose}
              className="sd-btn-ghost rounded-lg px-4 py-2 text-sm disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
