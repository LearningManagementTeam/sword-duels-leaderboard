"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminActionHint, AdminActionRow } from "@/components/admin/AdminActionHint";
import { importEmployeesFromCsv } from "@/lib/actions/admin";
import {
  EMPLOYEE_DIRECTORY_CSV_TEMPLATE_SAMPLE,
  parseEmployeeDirectoryCsv,
} from "@/lib/employees-csv";

const HRIS_IMPORT_HINTS = {
  downloadTemplate:
    "Downloads a one-row sample matching the HR branch employee sheet layout.",
  preview: "Check parse errors and row count before writing to the directory.",
  import:
    "Creates or updates employees by id number. Optional branch_code sets home branch.",
  paste:
    "Paste from Excel. Required: name and id_number. Optional HR columns and branch_code.",
};

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ImportEmployeesDirectory() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState("");
  const [rowCount, setRowCount] = useState(0);
  const [previewErrors, setPreviewErrors] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  function runPreview(text: string) {
    const { rows, errors } = parseEmployeeDirectoryCsv(text);
    setPreviewErrors(errors);
    setRowCount(rows.length);
    return { rows, errors };
  }

  async function loadPreview(text: string) {
    setPreviewLoading(true);
    setMessage("");
    setError(false);
    try {
      const { errors } = runPreview(text);
      if (errors.length) {
        setError(true);
        setMessage(errors.join(" "));
      }
    } catch (e) {
      setRowCount(0);
      setError(true);
      setMessage(e instanceof Error ? e.message : "Preview failed.");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleFileChange(file: File | undefined) {
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    setCsvText(text);
    await loadPreview(text);
  }

  async function handlePreviewClick() {
    if (!csvText.trim()) {
      setError(true);
      setMessage("Paste CSV text or choose a file first.");
      return;
    }
    await loadPreview(csvText);
  }

  async function handleImport() {
    if (!csvText.trim()) {
      setError(true);
      setMessage("Nothing to import.");
      return;
    }

    const { rows, errors } = parseEmployeeDirectoryCsv(csvText);
    setPreviewErrors(errors);
    setRowCount(rows.length);
    if (errors.length) {
      setError(true);
      setMessage(errors.join(" "));
      return;
    }
    if (!rows.length) {
      setError(true);
      setMessage("No rows found in CSV.");
      return;
    }

    setImportLoading(true);
    setMessage("");
    setError(false);
    try {
      const result = await importEmployeesFromCsv(csvText);
      if (!result.ok) {
        setError(true);
        setMessage(result.errors?.join(" ") ?? "Import failed.");
        return;
      }
      const parts = [result.message ?? "Import complete."];
      if (result.warnings?.length) parts.push(result.warnings.join(" "));
      setMessage(parts.join(" "));
      setCsvText("");
      setFileName("");
      setRowCount(0);
      setPreviewErrors([]);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch (e) {
      setError(true);
      setMessage(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setImportLoading(false);
    }
  }

  return (
    <section className="sd-neon-panel space-y-5 p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Import employees</h2>
        <p className="mt-1 text-sm text-sd-muted">
          Bulk-load HR employee profiles from your branch employee sheet — one row
          per person. Updates existing records when the id number matches.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <AdminActionRow hint={HRIS_IMPORT_HINTS.downloadTemplate}>
          <button
            type="button"
            onClick={() =>
              downloadTextFile(
                "hris-employees-template.csv",
                EMPLOYEE_DIRECTORY_CSV_TEMPLATE_SAMPLE
              )
            }
            className="sd-btn-secondary rounded-lg px-4 py-2 text-sm"
          >
            Download CSV template
          </button>
        </AdminActionRow>
      </div>

      <div className="sd-inset rounded-lg p-3 text-xs text-sd-muted">
        <p className="font-medium text-white">CSV columns</p>
        <p className="mt-1 font-mono text-[11px] text-emerald-200/80">
          name, nickname, position, id_number, date_hired, contact_number, email,
          branch_code, branch, area
        </p>
        <p className="mt-2">
          Required: <strong className="text-white">name</strong> and{" "}
          <strong className="text-white">id_number</strong>. Branch and area
          columns are ignored on import — use <strong className="text-white">branch_code</strong>{" "}
          to set home branch.
        </p>
      </div>

      <div className="space-y-3">
        <label className="block text-sm text-sd-muted">
          Upload CSV
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="mt-1 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-500/20 file:px-3 file:py-2 file:text-cyan-100"
            onChange={(e) => handleFileChange(e.target.files?.[0])}
          />
        </label>
        {fileName && (
          <p className="text-xs text-sd-muted">Selected: {fileName}</p>
        )}

        <label className="block text-sm text-sd-muted">
          Or paste CSV
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={6}
            placeholder={EMPLOYEE_DIRECTORY_CSV_TEMPLATE_SAMPLE}
            className="mt-1 w-full rounded-lg sd-input px-3 py-2 font-mono text-xs"
          />
        </label>
      </div>

      <AdminActionHint hint={HRIS_IMPORT_HINTS.paste} />

      <div className="flex flex-wrap gap-2">
        <AdminActionRow hint={HRIS_IMPORT_HINTS.preview}>
          <button
            type="button"
            disabled={previewLoading || !csvText.trim()}
            onClick={handlePreviewClick}
            className="sd-btn-secondary rounded-lg px-4 py-2 text-sm disabled:opacity-50"
          >
            {previewLoading ? "Checking…" : "Preview import"}
          </button>
        </AdminActionRow>
        <AdminActionRow hint={HRIS_IMPORT_HINTS.import}>
          <button
            type="button"
            disabled={importLoading || !csvText.trim()}
            onClick={handleImport}
            className="sd-btn-primary rounded-lg px-4 py-2 text-sm disabled:opacity-50"
          >
            {importLoading ? "Importing…" : `Import ${rowCount || ""} rows`}
          </button>
        </AdminActionRow>
      </div>

      {rowCount > 0 && previewErrors.length === 0 && (
        <p className="text-sm text-sd-muted">
          <span className="font-medium text-emerald-300">{rowCount}</span>{" "}
          employee{rowCount === 1 ? "" : "s"} ready to import
        </p>
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
