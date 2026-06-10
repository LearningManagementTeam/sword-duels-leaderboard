"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminActionHint, AdminActionRow } from "@/components/admin/AdminActionHint";
import { importEmployeesFromCsv } from "@/lib/actions/admin";
import { ADMIN_ROSTER_HINTS } from "@/lib/admin-action-hints";
import {
  EMPLOYEE_DIRECTORY_CSV_TEMPLATE_SAMPLE,
  parseEmployeeDirectoryCsv,
  type EmployeeDirectoryCsvRow,
} from "@/lib/employees-csv";

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const PREVIEW_CAP = 10;

export function ImportEmployeesCsv() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<EmployeeDirectoryCsvRow[] | null>(null);
  const [previewWarnings, setPreviewWarnings] = useState<string[]>([]);
  const [previewErrors, setPreviewErrors] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [showPaste, setShowPaste] = useState(false);

  function loadPreview(text: string) {
    const { rows, errors, warnings } = parseEmployeeDirectoryCsv(text);
    setPreviewErrors(errors);
    setPreviewWarnings(warnings);
    setPreview(errors.length ? null : rows);
    setError(errors.length > 0);
    setMessage(errors.length ? errors.join(" ") : "");
  }

  async function handleFileChange(file: File | undefined) {
    setFileName(file?.name ?? "");
    setMessage("");
    setError(false);
    setPreview(null);
    setPreviewWarnings([]);
    setPreviewErrors([]);

    if (!file) {
      setCsvText("");
      return;
    }

    const text = await file.text();
    setCsvText(text);
    loadPreview(text);
  }

  function handlePreviewPaste() {
    if (!csvText.trim()) {
      setError(true);
      setMessage("Paste CSV text or choose a file first.");
      return;
    }
    loadPreview(csvText);
  }

  async function handleImport() {
    if (!csvText.trim()) {
      setError(true);
      setMessage("Nothing to import.");
      return;
    }
    if (previewErrors.length) {
      setError(true);
      setMessage("Fix CSV errors before importing.");
      return;
    }

    setImportLoading(true);
    setMessage("");
    setError(false);
    try {
      const result = await importEmployeesFromCsv(csvText);
      if (!result.ok) {
        setError(true);
        setMessage(result.errors.join(" "));
        return;
      }
      const warn =
        result.warnings?.length ? ` ${result.warnings.slice(0, 3).join(" ")}` : "";
      setMessage(
        "message" in result && result.message
          ? `${result.message}${warn}`
          : `Imported ${"count" in result ? result.count : 0} employees.${warn}`
      );
      setCsvText("");
      setFileName("");
      setPreview(null);
      setPreviewWarnings([]);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch (e) {
      setError(true);
      setMessage(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setImportLoading(false);
    }
  }

  const readyCount = preview?.length ?? 0;

  return (
    <div className="space-y-4 border-t border-emerald-500/10 pt-5">
      <div>
        <h3 className="text-base font-semibold text-white">CSV import</h3>
        <p className="mt-1 text-sm text-sd-muted">
          One row per employee — same columns as Excel paste. Updates existing
          profiles when the employee number matches.
        </p>
      </div>

      <AdminActionRow hint={ADMIN_ROSTER_HINTS.employeeCsvTemplate}>
        <button
          type="button"
          onClick={() =>
            downloadTextFile(
              "employee-directory-template.csv",
              EMPLOYEE_DIRECTORY_CSV_TEMPLATE_SAMPLE
            )
          }
          className="sd-btn-ghost rounded-lg px-4 py-2 text-sm"
        >
          Download CSV template
        </button>
      </AdminActionRow>

      <AdminActionHint hint={ADMIN_ROSTER_HINTS.importEmployeesCsv} />

      <div className="flex flex-wrap gap-2">
        <label className="sd-btn-primary cursor-pointer rounded-lg px-4 py-2 text-sm">
          Upload CSV
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => void handleFileChange(e.target.files?.[0])}
          />
        </label>
        <button
          type="button"
          onClick={() => setShowPaste((v) => !v)}
          className="sd-btn-ghost rounded-lg px-4 py-2 text-sm"
        >
          {showPaste ? "Hide paste" : "Paste CSV"}
        </button>
      </div>

      {fileName && (
        <p className="text-xs text-sd-muted">
          File: <span className="text-emerald-200/90">{fileName}</span>
        </p>
      )}

      {showPaste && (
        <div className="space-y-2">
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={6}
            placeholder={EMPLOYEE_DIRECTORY_CSV_TEMPLATE_SAMPLE}
            className="w-full rounded-lg sd-input px-3 py-2 font-mono text-xs"
          />
          <button
            type="button"
            onClick={handlePreviewPaste}
            className="sd-btn-ghost rounded-lg px-4 py-2 text-sm"
          >
            Preview paste
          </button>
        </div>
      )}

      {previewWarnings.length > 0 && (
        <ul className="space-y-1 text-xs text-amber-200/90">
          {previewWarnings.slice(0, 5).map((w) => (
            <li key={w}>{w}</li>
          ))}
          {previewWarnings.length > 5 && (
            <li>…and {previewWarnings.length - 5} more warnings</li>
          )}
        </ul>
      )}

      {preview && preview.length > 0 && (
        <div className="sd-inset overflow-hidden rounded-lg">
          <p className="border-b border-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
            {readyCount} employee{readyCount === 1 ? "" : "s"} ready to import
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sd-deep/60 text-sd-muted">
                <tr>
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Position</th>
                  <th className="px-3 py-2">Branch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-500/10">
                {preview.slice(0, PREVIEW_CAP).map((row) => (
                  <tr key={`${row.employee_no}-${row.full_name}`}>
                    <td className="px-3 py-2 tabular-nums">{row.employee_no}</td>
                    <td className="px-3 py-2">{row.full_name}</td>
                    <td className="px-3 py-2 text-sd-muted">{row.position ?? "—"}</td>
                    <td className="px-3 py-2 text-sd-muted">
                      {row.branch_code ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.length > PREVIEW_CAP && (
            <p className="px-4 py-2 text-[11px] text-sd-muted">
              Showing first {PREVIEW_CAP} of {preview.length} rows.
            </p>
          )}
        </div>
      )}

      <AdminActionRow hint={ADMIN_ROSTER_HINTS.importEmployeesCsv}>
        <button
          type="button"
          disabled={
            importLoading || !preview?.length || previewErrors.length > 0
          }
          onClick={() => void handleImport()}
          className="sd-btn-primary rounded-lg px-4 py-2 text-sm disabled:opacity-50"
        >
          {importLoading ? "Importing…" : `Import ${readyCount || ""} employees`.trim()}
        </button>
      </AdminActionRow>

      {message && (
        <p className={`text-sm ${error ? "text-rose-200" : "text-sd-glow"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
