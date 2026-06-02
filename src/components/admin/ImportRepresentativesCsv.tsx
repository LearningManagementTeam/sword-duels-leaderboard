"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { importRepresentativesFromCsv } from "@/lib/actions/admin";

export function ImportRepresentativesCsv() {
  const router = useRouter();
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
      const result = await importRepresentativesFromCsv(text);
      if (result.ok) {
        setError(false);
        setMessage(
          result.warnings?.length
            ? `${result.message} ${result.warnings.join(" ")}`
            : result.message
        );
        router.refresh();
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
          Import representatives (CSV)
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Bulk update names anytime — before, during, or after the competition.
          Use the same <strong>branch_code</strong> values as your branch list.
          In Excel: <strong>File → Save As → CSV UTF-8</strong>. Names with commas
          must be quoted.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <a
          href="/templates/representatives-import-template.csv"
          download="representatives-import-template.csv"
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
        >
          Download CSV template
        </a>
        <Link
          href="/admin/branches"
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
        >
          Branch import
        </Link>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Required columns
        </p>
        <code className="block rounded-lg bg-slate-950 px-3 py-2 text-sm text-slate-300">
          branch_code, representative_1, representative_2
        </code>
        <p className="text-xs text-slate-500">
          <code>representative_2</code> is optional. You can also edit any row in
          the table below and save.
        </p>
      </div>

      <div className="space-y-3">
        <label className="block text-sm text-slate-300">
          Upload representatives CSV
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="mt-2 block w-full max-w-md text-sm text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-amber-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-900"
            onChange={(e) => {
              setFileName(e.target.files?.[0]?.name ?? "");
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
        {loading ? "Importing…" : "Import representatives from CSV"}
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
