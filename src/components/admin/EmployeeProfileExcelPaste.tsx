"use client";

import { useCallback, useRef, useState } from "react";
import type { HrisBranchOption } from "@/lib/employee-types";
import {
  parseEmployeeProfilePaste,
  type EmployeeDirectoryCsvRow,
} from "@/lib/employees-csv";
import { normalizeAllCapsText } from "@/lib/text-format";

export type ProfileDraftFromPaste = {
  employee_no: string;
  full_name: string;
  position: string;
  nickname: string;
  date_hired: string;
  contact_number: string;
  email: string;
  home_branch_id: string;
};

interface Props {
  branches: HrisBranchOption[];
  disabled?: boolean;
  applied?: boolean;
  onApply: (patch: Partial<ProfileDraftFromPaste>, message: string) => void;
  onClear: () => void;
  onError: (message: string) => void;
}

function resolveBranchId(
  branchCode: string | undefined,
  branches: HrisBranchOption[]
): string {
  if (!branchCode?.trim()) return "";
  const code = branchCode.trim();
  const match = branches.find(
    (b) =>
      b.branch_code === code ||
      b.branch_code.toLowerCase() === code.toLowerCase()
  );
  return match?.id ?? "";
}

function rowToDraftPatch(
  row: EmployeeDirectoryCsvRow,
  branches: HrisBranchOption[]
): Partial<ProfileDraftFromPaste> {
  const patch: Partial<ProfileDraftFromPaste> = {
    employee_no: row.employee_no,
    full_name: normalizeAllCapsText(row.full_name),
  };

  if (row.position) patch.position = normalizeAllCapsText(row.position);
  if (row.nickname) patch.nickname = row.nickname;
  if (row.date_hired) patch.date_hired = row.date_hired;
  if (row.contact_number) patch.contact_number = row.contact_number;
  if (row.email) patch.email = row.email;

  const branchId = resolveBranchId(row.branch_code, branches);
  if (branchId) patch.home_branch_id = branchId;

  return patch;
}

function filledFieldLabels(patch: Partial<ProfileDraftFromPaste>): string[] {
  const labels: string[] = [];
  if (patch.employee_no) labels.push("employee no.");
  if (patch.full_name) labels.push("name");
  if (patch.position) labels.push("position");
  if (patch.nickname) labels.push("nickname");
  if (patch.date_hired) labels.push("date hired");
  if (patch.contact_number) labels.push("contact");
  if (patch.email) labels.push("email");
  if (patch.home_branch_id) labels.push("branch");
  return labels;
}

export function EmployeeProfileExcelPaste({
  branches,
  disabled = false,
  applied = false,
  onApply,
  onClear,
  onError,
}: Props) {
  const pasteZoneRef = useRef<HTMLTextAreaElement>(null);
  const [status, setStatus] = useState("");

  const applyPaste = useCallback(
    (text: string) => {
      const { row, errors, warnings } = parseEmployeeProfilePaste(text);
      if (errors.length) {
        onError(errors.join(" "));
        setStatus("");
        return;
      }
      if (!row) {
        onError("No employee data found in paste.");
        setStatus("");
        return;
      }

      const patch = rowToDraftPatch(row, branches);
      const labels = filledFieldLabels(patch);
      if (!labels.length) {
        onError("Paste did not contain any profile fields.");
        setStatus("");
        return;
      }

      const message = `Filled ${labels.join(", ")} from Excel. Review before saving.`;
      onApply(patch, message);
      setStatus(
        warnings.length ? `${message} ${warnings.join(" ")}` : message
      );
    },
    [branches, onApply, onError]
  );

  function handleClear() {
    setStatus("");
    onClear();
    pasteZoneRef.current?.focus();
  }

  return (
    <section className="space-y-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-200/90">
            Paste from Excel
          </p>
          <p className="mt-0.5 text-[11px] text-sd-muted">
            Copy from your HR employee sheet: one table row (with or without
            headers), or the label + value pairs from the profile template.
            Review fields, then save.
          </p>
        </div>
        {applied && (
          <button
            type="button"
            disabled={disabled}
            onClick={handleClear}
            className="sd-btn-secondary shrink-0 rounded-lg px-3 py-1.5 text-xs disabled:opacity-50"
          >
            Clear pasted data
          </button>
        )}
      </div>

      <textarea
        ref={pasteZoneRef}
        rows={3}
        disabled={disabled}
        placeholder="Click here and paste (⌘V / Ctrl+V)…"
        onPaste={(e) => {
          const text = e.clipboardData.getData("text/plain");
          if (!text.trim()) return;
          e.preventDefault();
          applyPaste(text);
          if (pasteZoneRef.current) pasteZoneRef.current.value = "";
        }}
        className="w-full rounded-lg border border-dashed border-emerald-500/20 bg-black/20 px-3 py-2 font-mono text-xs text-emerald-100/90 placeholder:text-sd-muted focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400/30 disabled:opacity-50"
      />

      {status && (
        <p className="text-[11px] text-emerald-200/90" role="status">
          {status}
        </p>
      )}
    </section>
  );
}
