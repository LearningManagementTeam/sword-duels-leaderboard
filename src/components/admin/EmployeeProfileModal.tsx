"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { BranchCombobox } from "@/components/admin/BranchCombobox";
import { AdminConfirmPanel } from "@/components/admin/AdminConfirmPanel";
import { EmployeeNoDisplay } from "@/components/admin/EmployeeNoDisplay";
import { EmployeePhotoEditor } from "@/components/admin/EmployeePhotoEditor";
import { EmployeeProfileExcelPaste } from "@/components/admin/EmployeeProfileExcelPaste";
import { EmployeeRepAssignmentPanel } from "@/components/admin/EmployeeRepAssignmentPanel";
import { EmploymentStatusBadge } from "@/components/admin/EmploymentStatusBadge";
import {
  createEmployeeAction,
  deleteEmployeeAction,
  saveEmployeeProfileAction,
  setEmployeeEmploymentStatusAction,
} from "@/lib/actions/admin";
import { findEmployeeDirectoryDuplicateMessage } from "@/lib/employee-directory-duplicate";
import {
  EMPLOYEE_NO_PENDING_LABEL,
  isProvisionalEmployeeNo,
  resolveEmployeeNoForSave,
} from "@/lib/employee-numbers";
import type {
  EmployeeAdminRow,
  EmployeeRepAssignment,
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
  nickname: string;
  date_hired: string;
  contact_number: string;
  email: string;
};

function emptyDraft(): ProfileDraft {
  return {
    employee_no: "",
    full_name: "",
    position: "",
    notes: "",
    home_branch_id: "",
    nickname: "",
    date_hired: "",
    contact_number: "",
    email: "",
  };
}

function draftFromEmployee(employee: EmployeeAdminRow): ProfileDraft {
  return {
    employee_no: isProvisionalEmployeeNo(employee.employee_no)
      ? ""
      : employee.employee_no,
    full_name: employee.full_name,
    position: employee.position ?? "",
    notes: employee.notes ?? "",
    home_branch_id: employee.home_branch_id ?? "",
    nickname: employee.nickname ?? "",
    date_hired: employee.date_hired ?? "",
    contact_number: employee.contact_number ?? "",
    email: employee.email ?? "",
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
  onRepAssignmentsChange?: (
    employeeId: string,
    repAssignments: EmployeeRepAssignment[]
  ) => void;
  /** Desktop: prev/next through the filtered directory list. */
  navigation?: {
    ids: string[];
    currentId: string;
    onNavigate: (employeeId: string) => void;
  };
}

function ProfileSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="border-b border-emerald-500/10 pb-2">
        <h3 className="text-sm font-semibold tracking-tight text-white">
          {title}
        </h3>
        {description ? (
          <p className="mt-1 text-xs leading-relaxed text-sd-muted">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function FieldLabel({
  children,
  hint,
}: {
  children: ReactNode;
  hint?: string;
}) {
  return (
    <span className="mb-1.5 block text-xs font-medium text-sd-muted">
      {children}
      {hint ? (
        <span className="mt-0.5 block text-[11px] font-normal leading-snug text-sd-muted/65">
          {hint}
        </span>
      ) : null}
    </span>
  );
}

const fieldClassName =
  "block w-full rounded-lg sd-input px-3 py-2.5 text-sm leading-normal";

export function EmployeeProfileModal({
  mode,
  employee,
  existingEmployees,
  branches,
  onClose,
  onSaved,
  onError,
  onRepAssignmentsChange,
  navigation,
}: Props) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<ProfileDraft>(
    employee ? draftFromEmployee(employee) : emptyDraft()
  );
  const [draftPhoto, setDraftPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [listStale, setListStale] = useState(false);
  const [importApplied, setImportApplied] = useState(false);
  const [liveRepAssignments, setLiveRepAssignments] = useState<
    EmployeeRepAssignment[] | null
  >(null);

  const isCreate = mode === "create";

  const repAssignmentsKey =
    employee?.rep_assignments
      .map((a) => `${a.branch_id}:${a.slot}`)
      .join("|") ?? "";

  useEffect(() => {
    setLiveRepAssignments(null);
  }, [employee?.id, repAssignmentsKey]);

  const profileEmployee =
    employee && liveRepAssignments
      ? { ...employee, rep_assignments: liveRepAssignments }
      : employee;
  const displayName = draft.full_name || employee?.full_name || "New employee";

  useEffect(() => {
    setDraft(employee ? draftFromEmployee(employee) : emptyDraft());
    setDraftPhoto(null);
    setShowDeleteConfirm(false);
    setImportApplied(false);
  }, [employee, mode]);

  function handleImportApply(patch: Partial<ProfileDraft>, _message: string) {
    setDraft((prev) => ({ ...prev, ...patch }));
    setImportApplied(true);
  }

  function handleImportClear() {
    setDraft(employee ? draftFromEmployee(employee) : emptyDraft());
    setImportApplied(false);
  }

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
  }, [employee?.id, mode]);

  const navIndex = navigation
    ? navigation.ids.indexOf(navigation.currentId)
    : -1;
  const hasPrev = navIndex > 0;
  const hasNext =
    navIndex >= 0 && navIndex < (navigation?.ids.length ?? 0) - 1;

  useEffect(() => {
    if (!navigation) return;
    const { onNavigate, ids } = navigation;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" && hasPrev) {
        onNavigate(ids[navIndex - 1]!);
      }
      if (e.key === "ArrowRight" && hasNext) {
        onNavigate(ids[navIndex + 1]!);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigation, hasPrev, hasNext, navIndex]);

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

  async function handleSave(andNext = false) {
    if (!draft.full_name.trim()) {
      onError("Full name is required.");
      return;
    }

    const homeBranch = branches.find((b) => b.id === draft.home_branch_id.trim());
    const resolvedEmployeeNo = resolveEmployeeNoForSave(draft.employee_no, {
      fullName: draft.full_name,
      branchCode: homeBranch?.branch_code,
      existingEmployeeNo: employee?.employee_no,
    });
    const assigningPendingId =
      !draft.employee_no.trim() &&
      (!employee?.employee_no || isProvisionalEmployeeNo(employee.employee_no));

    const payload = {
      employee_no: resolvedEmployeeNo,
      full_name: normalizeAllCapsText(draft.full_name),
      position: normalizeAllCapsText(draft.position),
      notes: normalizeAllCapsText(draft.notes),
      home_branch_id: draft.home_branch_id.trim() || null,
      nickname: draft.nickname.trim() || null,
      date_hired: draft.date_hired.trim() || null,
      contact_number: draft.contact_number.trim() || null,
      email: draft.email.trim() || null,
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

        finishSuccess(
          assigningPendingId
            ? `Employee created with ${EMPLOYEE_NO_PENDING_LABEL}. Add the official number when HR provides it.`
            : "Employee created."
        );
        return;
      }

      if (employee) {
        const result = await saveEmployeeProfileAction(employee.id, payload);
        if (!result.ok) throw new Error(result.error);
        const upgradedFromPending =
          isProvisionalEmployeeNo(employee.employee_no) &&
          !isProvisionalEmployeeNo(resolvedEmployeeNo);
        onSaved(
          upgradedFromPending
            ? "Employee updated — official employee number saved."
            : "Employee updated."
        );
        setListStale(true);
        router.refresh();

        if (andNext && navigation && hasNext) {
          navigation.onNavigate(navigation.ids[navIndex + 1]!);
        }
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
      className="fixed inset-0 z-50 flex justify-end bg-sd-deep/75 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="employee-profile-title"
        className="flex h-full w-full max-w-5xl flex-col border-l border-emerald-500/20 bg-sd-deep shadow-2xl outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="shrink-0 border-b border-emerald-500/15 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-300/80">
                {isCreate ? "New profile" : "Employee profile"}
              </p>
              <h2
                id="employee-profile-title"
                className="mt-1 truncate text-2xl font-semibold tracking-tight text-white"
              >
                {isCreate ? "Add employee" : displayName}
              </h2>
              {!isCreate && profileEmployee && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <EmployeeNoDisplay
                    employeeNo={profileEmployee.employee_no}
                    mono
                    className="text-xs text-emerald-100"
                  />
                  <EmploymentStatusBadge status={profileEmployee.employment_status} />
                  {profileEmployee.rep_assignments.length > 0 && (
                    <span className="text-xs text-violet-200/90">
                      {profileEmployee.rep_assignments.length} rep slot
                      {profileEmployee.rep_assignments.length === 1 ? "" : "s"}
                    </span>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={handleClose}
              className="sd-btn-ghost shrink-0 rounded-lg px-3 py-2 text-sm"
              aria-label="Close"
            >
              Close
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <div className="grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)] xl:grid-cols-[19rem_minmax(0,1fr)]">
            <aside className="space-y-6 lg:sticky lg:top-0 lg:self-start">
              <div className="sd-inset rounded-xl p-4">
                <EmployeePhotoEditor
                  layout="stacked"
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
              </div>

              {!isCreate && employee && (
                <div className="sd-inset rounded-xl p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-sd-muted">
                    Employment status
                  </p>
                  <div className="mt-3 flex flex-col gap-2">
                    {(["active", "on_leave", "resigned"] as EmploymentStatus[]).map(
                      (status) => (
                        <button
                          key={status}
                          type="button"
                          disabled={loading || employee.employment_status === status}
                          onClick={() => void handleStatusChange(status)}
                          className={`rounded-lg px-3 py-2 text-left text-sm disabled:opacity-50 ${
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
              )}

              <EmployeeProfileExcelPaste
                branches={branches}
                disabled={loading}
                applied={importApplied}
                onApply={handleImportApply}
                onClear={handleImportClear}
                onError={onError}
              />
            </aside>

            <div className="min-w-0 space-y-8">
              <ProfileSection
                title="Identity"
                description="Core fields shown on competition leaderboards when this person is a rep."
              >
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <label className="block sm:col-span-1">
                    <FieldLabel hint="Leave blank if HR has not assigned an official number yet — the profile will show Pending ID until you update it.">
                      Employee no.
                    </FieldLabel>
                    <input
                      value={draft.employee_no}
                      onChange={(e) =>
                        setDraft((s) => ({ ...s, employee_no: e.target.value }))
                      }
                      placeholder={EMPLOYEE_NO_PENDING_LABEL}
                      className={fieldClassName}
                    />
                    {!draft.employee_no.trim() && (
                      <p className="mt-1.5 text-[11px] text-amber-200/80">
                        Will save as{" "}
                        <strong className="text-amber-100">
                          {EMPLOYEE_NO_PENDING_LABEL}
                        </strong>{" "}
                        until an official number is entered.
                      </p>
                    )}
                  </label>
                  <label className="block sm:col-span-1 xl:col-span-2">
                    <FieldLabel>Full name</FieldLabel>
                    <input
                      value={draft.full_name}
                      onChange={(e) =>
                        setDraft((s) => ({ ...s, full_name: e.target.value }))
                      }
                      onBlur={(e) => applyCapsOnBlur("full_name", e.target.value)}
                      className={fieldClassName}
                    />
                  </label>
                  <label className="block sm:col-span-2 xl:col-span-3">
                    <FieldLabel>Position</FieldLabel>
                    <input
                      value={draft.position}
                      onChange={(e) =>
                        setDraft((s) => ({ ...s, position: e.target.value }))
                      }
                      onBlur={(e) => applyCapsOnBlur("position", e.target.value)}
                      className={fieldClassName}
                    />
                  </label>
                </div>
              </ProfileSection>

              <ProfileSection
                title="Work location"
                description="HR home branch — separate from competition rep assignment."
              >
                <div className="grid gap-4">
                  <label className="block">
                    <FieldLabel hint="Type to search by code, name, or area.">
                      Home branch
                    </FieldLabel>
                    <BranchCombobox
                      branches={branches}
                      value={draft.home_branch_id}
                      onChange={(branchId) =>
                        setDraft((s) => ({ ...s, home_branch_id: branchId }))
                      }
                      disabled={loading}
                      className="mt-1.5"
                    />
                  </label>
                </div>
              </ProfileSection>

              <ProfileSection
                title="HR contact"
                description="Private fields — not shown on public leaderboards."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <FieldLabel>Nickname</FieldLabel>
                    <input
                      value={draft.nickname}
                      onChange={(e) =>
                        setDraft((s) => ({ ...s, nickname: e.target.value }))
                      }
                      className={fieldClassName}
                    />
                  </label>
                  <label className="block">
                    <FieldLabel>Date hired</FieldLabel>
                    <input
                      type="date"
                      value={draft.date_hired}
                      onChange={(e) =>
                        setDraft((s) => ({ ...s, date_hired: e.target.value }))
                      }
                      className={fieldClassName}
                    />
                  </label>
                  <label className="block">
                    <FieldLabel>Contact number</FieldLabel>
                    <input
                      type="tel"
                      value={draft.contact_number}
                      onChange={(e) =>
                        setDraft((s) => ({
                          ...s,
                          contact_number: e.target.value,
                        }))
                      }
                      className={fieldClassName}
                    />
                  </label>
                  <label className="block">
                    <FieldLabel>Email</FieldLabel>
                    <input
                      type="email"
                      value={draft.email}
                      onChange={(e) =>
                        setDraft((s) => ({ ...s, email: e.target.value }))
                      }
                      className={fieldClassName}
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <FieldLabel>Notes</FieldLabel>
                    <textarea
                      rows={3}
                      value={draft.notes}
                      onChange={(e) =>
                        setDraft((s) => ({ ...s, notes: e.target.value }))
                      }
                      onBlur={(e) => applyCapsOnBlur("notes", e.target.value)}
                      className={`${fieldClassName} resize-y min-h-[5rem]`}
                    />
                  </label>
                </div>
              </ProfileSection>

              {!isCreate && profileEmployee && (
                <ProfileSection
                  title="Competition representative"
                  description="Assign Rep 1 or Rep 2 for Sword Duels. Each branch allows at most two reps."
                >
                  <EmployeeRepAssignmentPanel
                    employee={profileEmployee}
                    branches={branches}
                    onSuccess={(msg, repAssignments) => {
                      setLiveRepAssignments(repAssignments);
                      onRepAssignmentsChange?.(
                        profileEmployee.id,
                        repAssignments
                      );
                      onSaved(msg);
                      setListStale(true);
                    }}
                    onError={onError}
                  />
                </ProfileSection>
              )}
            </div>
          </div>
        </div>

        <footer className="shrink-0 border-t border-emerald-500/15 bg-sd-deep/95 px-6 py-4 backdrop-blur-sm">
        {showDeleteConfirm && profileEmployee ? (
          <AdminConfirmPanel
            title={`Delete ${profileEmployee.full_name}?`}
              tone="danger"
              confirmLabel="Delete employee"
              busy={loading}
              onConfirm={() => void handleDelete()}
              onCancel={() => setShowDeleteConfirm(false)}
            >
            {profileEmployee.rep_assignments.length > 0 ? (
              <p>
                This also clears {profileEmployee.rep_assignments.length} competition
                rep slot(s) on the Representatives page.
              </p>
              ) : (
                <p>This permanently removes the employee profile.</p>
              )}
            </AdminConfirmPanel>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void handleSave()}
                  className="sd-btn-primary rounded-lg px-5 py-2.5 text-sm disabled:opacity-50"
                >
                  {loading
                    ? "Saving…"
                    : isCreate
                      ? "Create employee"
                      : "Save changes"}
                </button>
                {!isCreate && hasNext && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void handleSave(true)}
                    className="rounded-lg px-4 py-2.5 text-sm text-emerald-100 ring-1 ring-emerald-400/35 hover:bg-emerald-500/10 disabled:opacity-50"
                  >
                    Save &amp; next
                  </button>
                )}
                {!isCreate && employee && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setShowDeleteConfirm(true)}
                    className="rounded-lg px-4 py-2.5 text-sm text-rose-200 ring-1 ring-rose-400/30 hover:bg-rose-500/10 disabled:opacity-50"
                  >
                    Delete
                  </button>
                )}
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleClose}
                  className="sd-btn-ghost rounded-lg px-4 py-2.5 text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>

              {navigation && navIndex >= 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!hasPrev}
                    onClick={() =>
                      navigation.onNavigate(navigation.ids[navIndex - 1]!)
                    }
                    className="sd-btn-ghost rounded-lg px-3 py-2 text-xs disabled:opacity-40"
                  >
                    ← Previous
                  </button>
                  <p className="text-[11px] text-sd-muted">
                    {navIndex + 1} of {navigation.ids.length}
                  </p>
                  <button
                    type="button"
                    disabled={!hasNext}
                    onClick={() =>
                      navigation.onNavigate(navigation.ids[navIndex + 1]!)
                    }
                    className="sd-btn-ghost rounded-lg px-3 py-2 text-xs disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}
