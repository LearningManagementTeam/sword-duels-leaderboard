"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminActionHint } from "@/components/admin/AdminActionHint";
import { importEmployeesFromDirectoryRows } from "@/lib/actions/admin";
import {
  clipboardHasImage,
  imageFileFromClipboardApi,
  imageFileFromDataTransfer,
} from "@/lib/clipboard-image";
import type { EmployeeDirectoryCsvRow } from "@/lib/employees-csv";
import { extractEmployeeRosterFromImage } from "@/lib/extract-employee-roster-image";

const ROSTER_SCREENSHOT_HINT =
  "Copy a roster screenshot (⌘C / Ctrl+C) or upload PNG/JPG. OCR reads name, position, id, and branch columns — review before importing.";

export function ImportEmployeesRosterScreenshot() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processingRef = useRef(false);

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState<EmployeeDirectoryCsvRow[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  const applyExtraction = useCallback(
    (result: {
      rows: EmployeeDirectoryCsvRow[];
      errors: string[];
      warnings: string[];
    }) => {
      if (result.errors.length) {
        setError(true);
        setMessage(result.errors.join(" "));
        setRows([]);
        setWarnings([]);
        return;
      }

      setRows(result.rows);
      setWarnings(result.warnings);
      setError(false);
      setMessage(
        result.rows.length
          ? `Found ${result.rows.length} employee${result.rows.length === 1 ? "" : "s"} — review below, then import.`
          : "No employees found."
      );
    },
    []
  );

  const runExtraction = useCallback(
    async (file: File) => {
      if (processingRef.current) return;
      processingRef.current = true;
      setBusy(true);
      setMessage("");
      setError(false);
      setRows([]);
      setWarnings([]);

      try {
        const result = await extractEmployeeRosterFromImage(file, setStatus);
        applyExtraction(result);
      } catch (e) {
        setError(true);
        setMessage(e instanceof Error ? e.message : "Screenshot import failed.");
        setStatus("");
      } finally {
        setBusy(false);
        processingRef.current = false;
      }
    },
    [applyExtraction]
  );

  const handleClipboardImport = useCallback(async () => {
    setStatus("Reading clipboard…");
    const file = await imageFileFromClipboardApi("roster-import");
    if (!file) {
      setError(true);
      setMessage(
        "No image on clipboard. Copy a roster screenshot first, or upload a file below."
      );
      setStatus("");
      return;
    }
    await runExtraction(file);
  }, [runExtraction]);

  const handleFileChange = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      await runExtraction(file);
    },
    [runExtraction]
  );

  const handlePaste = useCallback(
    (data: DataTransfer | null) => {
      void (async () => {
        const file = await imageFileFromDataTransfer(data, "roster-import");
        if (!file) {
          setError(true);
          setMessage("Clipboard does not contain an image.");
          return;
        }
        await runExtraction(file);
      })();
    },
    [runExtraction]
  );

  function handleClear() {
    setRows([]);
    setWarnings([]);
    setMessage("");
    setError(false);
    setStatus("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleImport() {
    if (!rows.length) {
      setError(true);
      setMessage("Extract employees from a screenshot first.");
      return;
    }

    setImportLoading(true);
    setMessage("");
    setError(false);
    try {
      const result = await importEmployeesFromDirectoryRows(rows);
      if (!result.ok) {
        setError(true);
        setMessage(result.errors?.join(" ") ?? "Import failed.");
        return;
      }
      const parts = [result.message ?? "Import complete."];
      if (result.warnings?.length) parts.push(result.warnings.join(" "));
      setMessage(parts.join(" "));
      handleClear();
      router.refresh();
    } catch (e) {
      setError(true);
      setMessage(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setImportLoading(false);
    }
  }

  return (
    <section className="space-y-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4">
      <div>
        <h3 className="text-sm font-semibold text-white">Import from roster screenshot</h3>
        <p className="mt-1 text-xs text-sd-muted">
          Bulk-load employees from a photo or screenshot of your branch rep roster
          (like Area 1–3 sheets). Excel paste and CSV import above are more accurate
          when you have the file.
        </p>
      </div>

      <AdminActionHint hint={ROSTER_SCREENSHOT_HINT} />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || importLoading}
          onClick={() => void handleClipboardImport()}
          className="sd-btn-secondary rounded-lg px-4 py-2 text-sm disabled:opacity-50"
        >
          {busy ? "Extracting…" : "Import from clipboard"}
        </button>
        <label className="sd-btn-secondary cursor-pointer rounded-lg px-4 py-2 text-sm">
          Upload image
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/*"
            className="sr-only"
            disabled={busy || importLoading}
            onChange={(e) => void handleFileChange(e.target.files?.[0])}
          />
        </label>
        {rows.length > 0 && (
          <button
            type="button"
            disabled={busy || importLoading}
            onClick={handleClear}
            className="sd-btn-ghost rounded-lg px-4 py-2 text-sm"
          >
            Clear
          </button>
        )}
      </div>

      <div
        tabIndex={0}
        role="button"
        aria-label="Paste roster screenshot"
        onPaste={(e) => {
          if (!clipboardHasImage(e.clipboardData)) return;
          e.preventDefault();
          handlePaste(e.clipboardData);
        }}
        className={`rounded-lg border border-dashed px-3 py-6 text-center text-xs transition ${
          busy
            ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-100"
            : "border-emerald-500/20 text-sd-muted hover:border-cyan-400/30"
        } ${busy || importLoading ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
      >
        {busy
          ? status || "Working…"
          : "Click here and paste a roster screenshot (⌘V / Ctrl+V)"}
      </div>

      {rows.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-emerald-200/90">
            Preview — first {Math.min(rows.length, 8)} of {rows.length} rows
          </p>
          <div className="sd-table-wrap sd-inset max-h-64 overflow-auto">
            <table className="sd-table min-w-[520px] text-xs">
              <thead>
                <tr>
                  <th className="px-2 py-1.5 text-left">Name</th>
                  <th className="px-2 py-1.5 text-left">Position</th>
                  <th className="px-2 py-1.5 text-left">ID</th>
                  <th className="px-2 py-1.5 text-left">Branch</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 8).map((row) => (
                  <tr key={`${row.employee_no}-${row.full_name}`}>
                    <td className="px-2 py-1.5">{row.full_name}</td>
                    <td className="px-2 py-1.5 text-sd-muted">
                      {row.position ?? "—"}
                    </td>
                    <td className="px-2 py-1.5 font-mono">{row.employee_no}</td>
                    <td className="px-2 py-1.5 font-mono">
                      {row.branch_code ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <button
          type="button"
          disabled={importLoading || busy}
          onClick={() => void handleImport()}
          className="sd-btn-primary rounded-lg px-4 py-2 text-sm disabled:opacity-50"
        >
          {importLoading ? "Importing…" : `Import ${rows.length} employees`}
        </button>
      )}

      {warnings.length > 0 && (
        <p className="text-xs text-amber-200/90">{warnings.join(" ")}</p>
      )}

      {message && (
        <p
          className={`text-sm ${error ? "sd-alert-warning" : "sd-alert-info"}`}
          role="status"
        >
          {message}
        </p>
      )}
    </section>
  );
}
