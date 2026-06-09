"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  assignEmployeeRepSlotAction,
  clearEmployeeRepSlotAction,
} from "@/lib/actions/admin";
import { COMPETITION_REP_PROGRAMS } from "@/lib/competition-rep-programs";
import type { EmployeeAdminRow, HrisBranchOption } from "@/lib/employee-types";

interface Props {
  employee: EmployeeAdminRow;
  branches: HrisBranchOption[];
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function EmployeeRepAssignmentPanel({
  employee,
  branches,
  onSuccess,
  onError,
}: Props) {
  const router = useRouter();
  const [branchFilter, setBranchFilter] = useState("");
  const [branchId, setBranchId] = useState(employee.home_branch_id ?? "");
  const [slot, setSlot] = useState<1 | 2>(1);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setBranchId(employee.home_branch_id ?? "");
    setSlot(
      employee.rep_assignments.some((a) => a.slot === 1) ? 2 : 1
    );
  }, [employee.id, employee.home_branch_id, employee.rep_assignments]);

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

  const selectedBranch = branches.find((b) => b.id === branchId) ?? null;
  const assignmentOnSelected = employee.rep_assignments.find(
    (a) => a.branch_id === branchId
  );

  async function handleAssign() {
    if (!branchId) {
      onError("Choose a branch before assigning a rep slot.");
      return;
    }

    setBusy(true);
    try {
      const result = await assignEmployeeRepSlotAction({
        employeeId: employee.id,
        branchId,
        slot,
      });
      if (!result.ok) throw new Error(result.error);

      const branchLabel = selectedBranch
        ? `${selectedBranch.branch_code} · ${selectedBranch.branch_name}`
        : "branch";
      onSuccess(
        `Assigned ${employee.full_name} as Rep ${slot} (${COMPETITION_REP_PROGRAMS[0]!.label}) for ${branchLabel}.`
      );
      router.refresh();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not assign representative.");
    } finally {
      setBusy(false);
    }
  }

  async function handleClear(targetBranchId: string) {
    setBusy(true);
    try {
      const result = await clearEmployeeRepSlotAction({
        employeeId: employee.id,
        branchId: targetBranchId,
      });
      if (!result.ok) throw new Error(result.error);

      const branch = branches.find((b) => b.id === targetBranchId);
      onSuccess(
        `Removed ${employee.full_name} as a rep for ${branch?.branch_code ?? "branch"}.`
      );
      router.refresh();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not clear representative.");
    } finally {
      setBusy(false);
    }
  }

  const canAssign =
    employee.employment_status !== "resigned" && Boolean(branchId);

  return (
    <div className="space-y-4 rounded-lg border border-violet-400/20 bg-violet-500/5 p-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-violet-200/90">
          Competition representative
        </p>
        <p className="mt-1 text-xs text-sd-muted">
          Each branch has at most <strong className="text-white">Rep 1</strong>{" "}
          and <strong className="text-white">Rep 2</strong>. Assigning here
          updates the same slots used on Sword Duels leaderboards and the
          Representatives review table.
        </p>
      </div>

      {employee.rep_assignments.length > 0 && (
        <ul className="space-y-2">
          {employee.rep_assignments.map((assignment) => (
            <li
              key={`${assignment.branch_id}-${assignment.slot}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-500/15 bg-sd-deep/30 px-3 py-2 text-sm"
            >
              <span className="text-emerald-100">
                {COMPETITION_REP_PROGRAMS[0]!.label} · Rep {assignment.slot} ·{" "}
                <span className="font-mono text-xs">
                  {assignment.branch_code}
                </span>
                {assignment.branch_name ? ` · ${assignment.branch_name}` : ""}
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleClear(assignment.branch_id)}
                className="text-xs text-rose-300/90 hover:text-rose-200 disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm sm:col-span-2">
          <span className="text-sd-muted">Competition</span>
          <select
            value={COMPETITION_REP_PROGRAMS[0]!.id}
            disabled
            className="mt-1 block w-full rounded-lg sd-input px-3 py-2 text-sm opacity-80"
          >
            {COMPETITION_REP_PROGRAMS.map((program) => (
              <option key={program.id} value={program.id}>
                {program.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[10px] text-sd-muted/70">
            {COMPETITION_REP_PROGRAMS[0]!.description}. More competitions can
            be added later.
          </p>
        </label>

        <label className="block text-sm sm:col-span-2">
          <span className="text-sd-muted">Branch</span>
          <input
            type="search"
            placeholder="Filter branches…"
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="mt-1 block w-full rounded-lg sd-input px-3 py-2 text-sm"
          />
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            disabled={busy}
            className="mt-1 block w-full rounded-lg sd-input px-3 py-2 text-sm disabled:opacity-50"
          >
            <option value="">Choose branch…</option>
            {filteredBranches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.branch_code} · {b.branch_name}
                {b.area ? ` (${b.area})` : ""}
              </option>
            ))}
          </select>
          {employee.home_branch_id && branchId === employee.home_branch_id && (
            <p className="mt-1 text-[10px] text-emerald-200/70">
              Pre-filled from home branch.
            </p>
          )}
        </label>

        <fieldset className="block text-sm sm:col-span-2">
          <legend className="text-sd-muted">Rep slot</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {([1, 2] as const).map((repSlot) => (
              <label
                key={repSlot}
                className={`cursor-pointer rounded-lg px-3 py-2 text-sm ring-1 ${
                  slot === repSlot
                    ? "bg-violet-500/20 text-white ring-violet-400/40"
                    : "text-sd-muted ring-emerald-500/15 hover:bg-sd-deep/30"
                }`}
              >
                <input
                  type="radio"
                  name={`rep-slot-${employee.id}`}
                  value={repSlot}
                  checked={slot === repSlot}
                  disabled={busy}
                  onChange={() => setSlot(repSlot)}
                  className="sr-only"
                />
                Rep {repSlot}
                {assignmentOnSelected?.slot === repSlot ? " (current)" : ""}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {employee.employment_status === "resigned" && (
        <p className="text-xs text-amber-200/90">
          Resigned employees cannot be assigned as competition reps. Change
          employment status first if they are competing again.
        </p>
      )}

      <button
        type="button"
        disabled={busy || !canAssign}
        onClick={() => void handleAssign()}
        className="sd-btn-primary rounded-lg px-4 py-2 text-sm disabled:opacity-50"
      >
        {busy
          ? "Saving…"
          : assignmentOnSelected
            ? `Update to Rep ${slot}`
            : `Assign as Rep ${slot}`}
      </button>
    </div>
  );
}
