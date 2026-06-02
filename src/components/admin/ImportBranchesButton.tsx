"use client";

import { useState } from "react";
import { importBranchesFromCsv } from "@/lib/actions/admin";

export function ImportBranchesButton() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    setMessage("");
    const result = await importBranchesFromCsv();
    if (result.ok) {
      setMessage(`Imported ${result.count} branches.`);
    } else {
      setMessage(result.errors.join("; "));
    }
    setLoading(false);
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={loading}
        onClick={handleClick}
        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-amber-400 disabled:opacity-50"
      >
        {loading ? "Importing…" : "Import branches from CSV"}
      </button>
      {message && <p className="text-sm text-amber-200">{message}</p>}
    </div>
  );
}
