"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminActionHint, AdminActionRow } from "@/components/admin/AdminActionHint";
import {
  importSdRepresentativesFromCsv,
  previewSdRepresentativesImport,
  type SdRepresentativesPreviewRow,
} from "@/lib/actions/sword-duels-admin";
import { buildRepresentativesCsvTemplate } from "@/lib/representatives-csv";
import type { Branch } from "@/lib/types";

const SD_REP_HINTS = {
  downloadTemplate:
    "Downloads every branch with area column — fill representative names, employee no., and position in Excel, then Save As → CSV UTF-8.",
  preview:
    "Check row counts and unknown branch codes before writing to the database.",
  import:
    "Updates representative names on existing branches. Does not add or remove branches.",
  paste:
    "Paste from Excel (comma or tab). Required: branch_code and representative_1. Optional: employee no., position, and HR columns (nickname, date hired, contact, email) per rep.",
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

interface Props {
  branches: Branch[];
}

export function ImportSwordDuelsRepresentatives({ branches }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<SdRepresentativesPreviewRow[] | null>(
    null
  );
  const [readyCount, setReadyCount] = useState(0);
  const [previewErrors, setPreviewErrors] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  async function loadPreview(text: string) {
    setPreviewLoading(true);
    setMessage("");
    setError(false);
    try {
      const result = await previewSdRepresentativesImport(text);
      setPreviewErrors(result.errors);
      setPreview(result.rows);
      setReadyCount(result.readyCount);
      if (result.errors.length) {
        setError(true);
        setMessage(result.errors.join(" "));
      }
    } catch (e) {
      setPreview(null);
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
    setImportLoading(true);
    setMessage("");
    setError(false);
    try {
      const result = await importSdRepresentativesFromCsv(csvText);
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
      setPreview(null);
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

  function handleDownloadTemplate() {
    const csv = buildRepresentativesCsvTemplate(branches);
    downloadTextFile("sword-duels-representatives-template.csv", csv);
  }

  const unknownCount =
    preview?.filter((r) => r.status === "unknown_code").length ?? 0;

  return (
    <section className="sd-neon-panel space-y-5 p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Import representatives</h2>
        <p className="mt-1 text-sm text-sd-muted">
          Bulk-load two representatives per branch for Sword Duels area battles.
          Uses the same branch roster as National Competitions — only names are
          updated.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <AdminActionRow hint={SD_REP_HINTS.downloadTemplate}>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            disabled={branches.length === 0}
            className="sd-btn-secondary rounded-lg px-4 py-2 text-sm disabled:opacity-50"
          >
            Download CSV template
          </button>
        </AdminActionRow>
      </div>

      <div className="sd-inset rounded-lg p-3 text-xs text-sd-muted">
        <p className="font-medium text-white">CSV columns</p>
        <p className="mt-1 font-mono text-[11px] text-emerald-200/80">
          branch_code, branch_name, area, representative_1, representative_1_employee_no,
          representative_1_position, representative_1_nickname, representative_1_date_hired,
          representative_1_contact_number, representative_1_email, representative_2, …
        </p>
        <p className="mt-2">
          Required: <strong className="text-white">branch_code</strong> and{" "}
          <strong className="text-white">representative_1</strong>. HR columns update
          the employee profile in HRIS only — not public leaderboards. Reps must exist
          in the directory when using employee numbers.
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
            placeholder={`branch_code,representative_1,representative_1_employee_no,representative_1_position,representative_2\nBR001,Juan Dela Cruz,102345,Quiz Master`}
            className="mt-1 w-full rounded-lg sd-input px-3 py-2 font-mono text-xs"
          />
        </label>
      </div>

      <AdminActionHint hint={SD_REP_HINTS.paste} />

      <div className="flex flex-wrap gap-2">
        <AdminActionRow hint={SD_REP_HINTS.preview}>
          <button
            type="button"
            disabled={previewLoading || !csvText.trim()}
            onClick={handlePreviewClick}
            className="sd-btn-secondary rounded-lg px-4 py-2 text-sm disabled:opacity-50"
          >
            {previewLoading ? "Checking…" : "Preview import"}
          </button>
        </AdminActionRow>
        <AdminActionRow hint={SD_REP_HINTS.import}>
          <button
            type="button"
            disabled={
              importLoading ||
              !csvText.trim() ||
              previewErrors.length > 0 ||
              readyCount === 0
            }
            onClick={handleImport}
            className="sd-btn-primary rounded-lg px-4 py-2 text-sm disabled:opacity-50"
          >
            {importLoading ? "Importing…" : `Import ${readyCount || ""} rows`}
          </button>
        </AdminActionRow>
      </div>

      {preview && preview.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-sd-muted">
            <span className="font-medium text-emerald-300">{readyCount}</span>{" "}
            ready to import
            {unknownCount > 0 && (
              <span className="text-amber-200/90">
                {" "}
                · {unknownCount} unknown branch_code
                {unknownCount === 1 ? "" : "s"}
              </span>
            )}
          </p>
          <div className="sd-table-wrap sd-inset max-h-48 overflow-auto">
            <table className="sd-table min-w-[640px] text-xs">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-left">Code</th>
                  <th className="px-2 py-1 text-left">Area</th>
                  <th className="px-2 py-1 text-left">Rep 1</th>
                  <th className="px-2 py-1 text-left">Emp / position</th>
                  <th className="px-2 py-1 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 20).map((row) => (
                  <tr key={row.branch_code}>
                    <td className="px-2 py-1 font-mono">{row.branch_code}</td>
                    <td className="px-2 py-1 text-sd-muted">{row.area ?? "—"}</td>
                    <td className="px-2 py-1">{row.representative_1}</td>
                    <td className="px-2 py-1 text-sd-muted">
                      {row.representative_1_employee_no || "—"}
                      {row.representative_1_position
                        ? ` · ${row.representative_1_position}`
                        : ""}
                    </td>
                    <td className="px-2 py-1">
                      {row.status === "ready" ? (
                        <span className="text-emerald-300">OK</span>
                      ) : (
                        <span className="text-amber-300">Unknown code</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.length > 20 && (
            <p className="text-[10px] text-sd-muted/60">
              Showing first 20 of {preview.length} rows
            </p>
          )}
        </div>
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
