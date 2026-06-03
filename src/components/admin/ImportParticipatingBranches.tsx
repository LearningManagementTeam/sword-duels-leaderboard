"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { importParticipatingBranchesForJuneArea } from "@/lib/actions/admin";

export function ImportParticipatingBranches() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");

  async function handleImport() {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError(true);
      setMessage("Please choose a CSV file first.");
      return;
    }

    setLoading(true);
    setMessage("");
    setError(false);

    try {
      const text = await file.text();
      const result = await importParticipatingBranchesForJuneArea(text);
      if (result.ok) {
        setError(false);
        setMessage(
          result.roundId
            ? `${result.message} Go to Rounds → June — Round 1 to enter scores.`
            : result.message
        );
      } else {
        setError(true);
        setMessage(result.errors.join(" "));
      }
    } catch (e) {
      setError(true);
      setMessage(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sd-neon-panel space-y-6 p-6">
      <div>
        <h2 className="text-lg font-semibold text-sd-glow">
          Import participants (one CSV)
        </h2>
        <p className="mt-1 text-sm text-sd-muted">
          One file for <strong>branches, areas, regions, and representative
          names</strong>. Requires at least 130 rows for June Area-wide.
          Representative columns are optional — leave blank and add names later
          in Admin → Representatives. Excel:{" "}
          <strong>File → Save As → CSV UTF-8</strong>. Quote branch names that
          contain commas.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <a
          href="/templates/participants-import-template.csv"
          download="participants-import-template.csv"
          className="sd-btn-ghost rounded-lg px-4 py-2 text-sm text-sd-muted hover:bg-emerald-500/10"
        >
          Download combined template
        </a>
        <Link
          href="/admin/representatives"
          className="sd-btn-ghost rounded-lg px-4 py-2 text-sm text-sd-muted hover:bg-emerald-500/10"
        >
          Edit representatives
        </Link>
        <Link
          href="/admin/rounds"
          className="sd-btn-ghost rounded-lg px-4 py-2 text-sm text-sd-muted hover:bg-emerald-500/10"
        >
          Go to Rounds
        </Link>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-sd-muted/60">
          Columns
        </p>
        <code className="sd-inset block rounded-lg px-3 py-2 text-sm text-sd-muted">
          branch_code, branch_name, area, region, representative_1,
          representative_2
        </code>
        <p className="text-xs text-sd-muted/60">
          <strong>Required:</strong> first four columns.{" "}
          <strong>Optional:</strong> representative_1, representative_2 (can be
          empty). Region: <code>luzon</code>, <code>ncr</code>, or{" "}
          <code>vismin</code>.
        </p>
      </div>

      <div className="space-y-3">
        <label className="block text-sm text-sd-muted">
          Upload participants CSV
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="mt-2 block w-full max-w-md text-sm text-sd-muted file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-sd-lime file:to-emerald-400 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-sd-deep"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setFileName(f?.name ?? "");
              setMessage("");
              setError(false);
            }}
          />
        </label>
        {fileName && (
          <p className="text-xs text-sd-muted/60">Selected: {fileName}</p>
        )}
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={handleImport}
        className="sd-btn-primary rounded-lg px-5 py-2.5 text-sm disabled:opacity-50"
      >
        {loading ? "Importing…" : "Import for June Round 1"}
      </button>

      {message && (
        <p
          className={`text-sm ${error ? "text-red-300" : "text-emerald-300"}`}
          role="status"
        >
          {message}
        </p>
      )}
    </div>
  );
}
