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
        setMessage(result.message);
        setError(false);
        if (result.roundId) {
          setMessage(
            `${result.message} Go to Rounds → June — Round 1 to enter scores.`
          );
        }
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
    <div className="space-y-6 rounded-xl border border-slate-700 bg-slate-900/50 p-6">
      <div>
        <h2 className="text-lg font-semibold text-amber-300">
          June Area-wide — participating branches
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Upload your official branch list for Round 1. Requires at least 130
          branches. In Excel: <strong>File → Save As → CSV UTF-8</strong>.
          If a branch name has a <strong>comma</strong> (e.g. TIMES SQUARE,
          TALAMBAN), Excel must wrap that cell in quotes — or remove the comma.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <a
          href="/templates/branches-import-template.csv"
          download="branches-import-template.csv"
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
        >
          Download CSV template
        </a>
        <Link
          href="/admin/rounds"
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
        >
          Go to Rounds
        </Link>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Required columns
        </p>
        <code className="block rounded-lg bg-slate-950 px-3 py-2 text-sm text-slate-300">
          branch_code, branch_name, area, region
        </code>
        <p className="text-xs text-slate-500">
          Region must be: <code>luzon</code>, <code>ncr</code>, or{" "}
          <code>vismin</code> (lowercase).
        </p>
      </div>

      <div className="space-y-3">
        <label className="block text-sm text-slate-300">
          Upload participating branches (CSV)
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="mt-2 block w-full max-w-md text-sm text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-amber-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-900"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setFileName(f?.name ?? "");
              setMessage("");
              setError(false);
            }}
          />
        </label>
        {fileName && (
          <p className="text-xs text-slate-500">Selected: {fileName}</p>
        )}
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={handleImport}
        className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-amber-400 disabled:opacity-50"
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
