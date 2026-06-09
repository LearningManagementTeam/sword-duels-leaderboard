"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminActionHint } from "@/components/admin/AdminActionHint";
import { importEmployeesFromDirectoryRows } from "@/lib/actions/admin";
import type { EmployeeDirectoryCsvRow } from "@/lib/employees-csv";

const ROSTER_VISION_HINT =
  "Upload one or more PNG/JPG roster screenshots (Varsity 1 & 2 columns). Gemini reads each image and merges employees into one preview — review before importing.";

const MAX_FILES = 10;

export function ImportEmployeesRosterVision() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState<EmployeeDirectoryCsvRow[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [failedFiles, setFailedFiles] = useState<
    Array<{ fileName: string; error: string }>
  >([]);
  const [processedFiles, setProcessedFiles] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  const extractFromFiles = useCallback(async (files: File[]) => {
    if (!files.length) return;

    if (files.length > MAX_FILES) {
      setError(true);
      setMessage(`Choose at most ${MAX_FILES} screenshots at a time.`);
      return;
    }

    setBusy(true);
    setMessage("");
    setError(false);
    setRows([]);
    setWarnings([]);
    setFailedFiles([]);
    setProcessedFiles(0);
    setStatus(
      files.length === 1
        ? "Uploading screenshot…"
        : `Uploading ${files.length} screenshots…`
    );

    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append("files", file);
      }

      const response = await fetch("/api/hris/extract-roster", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        rows?: EmployeeDirectoryCsvRow[];
        warnings?: string[];
        processedFiles?: number;
        failedFiles?: Array<{ fileName: string; error: string }>;
      };

      if (!response.ok || !data.ok || !data.rows?.length) {
        setError(true);
        setMessage(data.error ?? "Could not extract employees from screenshots.");
        if (data.warnings?.length) setWarnings(data.warnings);
        if (data.failedFiles?.length) setFailedFiles(data.failedFiles);
        return;
      }

      setRows(data.rows);
      setWarnings(data.warnings ?? []);
      setFailedFiles(data.failedFiles ?? []);
      setProcessedFiles(data.processedFiles ?? files.length);

      const filePart =
        (data.processedFiles ?? files.length) > 1
          ? ` from ${data.processedFiles ?? files.length} screenshots`
          : "";

      setMessage(
        `Found ${data.rows.length} employee${data.rows.length === 1 ? "" : "s"}${filePart} — review below, then import.`
      );
    } catch (e) {
      setError(true);
      setMessage(e instanceof Error ? e.message : "Extraction failed.");
    } finally {
      setBusy(false);
      setStatus("");
    }
  }, []);

  function handleClear() {
    setRows([]);
    setWarnings([]);
    setFailedFiles([]);
    setProcessedFiles(0);
    setMessage("");
    setError(false);
    setStatus("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleImport() {
    if (!rows.length) return;

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
        <h3 className="text-sm font-semibold text-white">
          Import from roster screenshots
        </h3>
        <p className="mt-1 text-xs text-sd-muted">
          Sword Duels branch rep sheets: one row per branch with Varsity 1 and
          Varsity 2. Upload multiple area screenshots at once — empty rep slots
          are skipped automatically.
        </p>
      </div>

      <AdminActionHint hint={ROSTER_VISION_HINT} />

      <div className="flex flex-wrap gap-2">
        <label className="sd-btn-secondary cursor-pointer rounded-lg px-4 py-2 text-sm">
          {busy ? "Extracting…" : "Upload screenshot(s)"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/*"
            multiple
            className="sr-only"
            disabled={busy || importLoading}
            onChange={(e) => {
              const list = Array.from(e.target.files ?? []);
              if (list.length) void extractFromFiles(list);
            }}
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

      <p className="text-[11px] text-sd-muted">
        Select up to {MAX_FILES} images in one go (e.g. Area 3, Area 4, Area 5).
        Requires <span className="font-mono text-emerald-200/80">GEMINI_API_KEY</span>{" "}
        on the server.
      </p>

      {status && (
        <p className="text-xs text-cyan-200/90" role="status">
          {status}
        </p>
      )}

      {rows.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-emerald-200/90">
            Preview — first {Math.min(rows.length, 10)} of {rows.length} rows
            {processedFiles > 1 ? ` (merged from ${processedFiles} screenshots)` : ""}
          </p>
          <div className="sd-table-wrap sd-inset max-h-72 overflow-auto">
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
                {rows.slice(0, 10).map((row) => (
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

          <button
            type="button"
            disabled={importLoading || busy}
            onClick={() => void handleImport()}
            className="sd-btn-primary rounded-lg px-4 py-2 text-sm disabled:opacity-50"
          >
            {importLoading ? "Importing…" : `Import ${rows.length} employees`}
          </button>
        </div>
      )}

      {failedFiles.length > 0 && (
        <ul className="space-y-1 text-xs text-amber-200/90">
          {failedFiles.map((item) => (
            <li key={`${item.fileName}-${item.error}`}>
              <strong>{item.fileName}:</strong> {item.error}
            </li>
          ))}
        </ul>
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
