"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  clipboardHasImage,
  imageFileFromClipboardApi,
  imageFileFromDataTransfer,
} from "@/lib/clipboard-image";
import {
  extractEmployeeProfileFromImage,
  type ExtractedEmployeeProfile,
} from "@/lib/extract-employee-profile-image";
import type { HrisBranchOption } from "@/lib/employee-types";
import { normalizeAllCapsText } from "@/lib/text-format";

export type ProfileDraftFromImport = {
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
  onApply: (patch: Partial<ProfileDraftFromImport>, message: string) => void;
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

function extractedToDraftPatch(
  extracted: ExtractedEmployeeProfile,
  branches: HrisBranchOption[]
): Partial<ProfileDraftFromImport> {
  const patch: Partial<ProfileDraftFromImport> = {};

  if (extracted.employee_no) patch.employee_no = extracted.employee_no;
  if (extracted.full_name) {
    patch.full_name = normalizeAllCapsText(extracted.full_name);
  }
  if (extracted.position) {
    patch.position = normalizeAllCapsText(extracted.position);
  }
  if (extracted.nickname) patch.nickname = extracted.nickname;
  if (extracted.date_hired) patch.date_hired = extracted.date_hired;
  if (extracted.contact_number) patch.contact_number = extracted.contact_number;
  if (extracted.email) patch.email = extracted.email;

  const branchId = resolveBranchId(extracted.branch_code, branches);
  if (branchId) patch.home_branch_id = branchId;

  return patch;
}

export function EmployeeProfileClipboardImport({
  branches,
  disabled = false,
  onApply,
  onError,
}: Props) {
  const pasteZoneRef = useRef<HTMLDivElement>(null);
  const processingRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [focused, setFocused] = useState(false);

  const runExtraction = useCallback(
    async (file: File) => {
      if (processingRef.current || disabled) return;
      processingRef.current = true;
      setBusy(true);
      setStatus("");

      try {
        const result = await extractEmployeeProfileFromImage(file, setStatus);
        const patch = extractedToDraftPatch(result.extracted, branches);

        if (Object.keys(patch).length === 0) {
          onError("No profile fields could be mapped from the screenshot.");
          return;
        }

        const message = `Filled ${result.filledLabels.join(", ")} from screenshot. Review before saving.`;
        onApply(patch, message);
        setStatus(message);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Import failed.";
        onError(msg);
        setStatus("");
      } finally {
        setBusy(false);
        processingRef.current = false;
      }
    },
    [branches, disabled, onApply, onError]
  );

  const handlePasteFromEvent = useCallback(
    async (data: DataTransfer | null) => {
      const file = await imageFileFromDataTransfer(data, "profile-import");
      if (!file) {
        onError("Clipboard does not contain an image. Copy a screenshot first.");
        return;
      }
      await runExtraction(file);
    },
    [onError, runExtraction]
  );

  const handleImportClick = useCallback(async () => {
    setStatus("Reading clipboard…");
    const file = await imageFileFromClipboardApi("profile-import");
    if (!file) {
      onError(
        "No image on clipboard. Copy a screenshot (⌘C / Ctrl+C), then try again — or paste directly into the box below."
      );
      setStatus("");
      return;
    }
    await runExtraction(file);
  }, [onError, runExtraction]);

  useEffect(() => {
    function onWindowPaste(e: ClipboardEvent) {
      if (disabled || busy) return;
      if (!clipboardHasImage(e.clipboardData)) return;
      if (!pasteZoneRef.current?.contains(document.activeElement)) return;
      e.preventDefault();
      void handlePasteFromEvent(e.clipboardData);
    }

    window.addEventListener("paste", onWindowPaste);
    return () => window.removeEventListener("paste", onWindowPaste);
  }, [busy, disabled, handlePasteFromEvent]);

  return (
    <section className="space-y-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-200/90">
            Import from screenshot
          </p>
          <p className="mt-0.5 text-[11px] text-sd-muted">
            Copy an HR sheet row or employee profile image, then paste here or
            click Import.
          </p>
        </div>
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => void handleImportClick()}
          className="sd-btn-secondary shrink-0 rounded-lg px-3 py-1.5 text-xs disabled:opacity-50"
        >
          {busy ? "Extracting…" : "Import from clipboard"}
        </button>
      </div>

      <div
        ref={pasteZoneRef}
        tabIndex={0}
        role="button"
        aria-label="Paste employee screenshot"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onPaste={(e) => {
          e.preventDefault();
          void handlePasteFromEvent(e.clipboardData);
        }}
        className={`rounded-lg border border-dashed px-3 py-4 text-center text-xs transition ${
          focused
            ? "border-cyan-400/50 bg-cyan-500/10 text-cyan-100"
            : "border-emerald-500/20 text-sd-muted hover:border-cyan-400/30"
        } ${disabled || busy ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
      >
        {busy
          ? status || "Working…"
          : "Click here and paste (⌘V / Ctrl+V), or use Import from clipboard"}
      </div>

      {status && !busy && (
        <p className="text-[11px] text-emerald-200/90" role="status">
          {status}
        </p>
      )}
    </section>
  );
}
