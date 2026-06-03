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
        className="sd-btn-primary rounded-lg px-4 py-2 text-sm disabled:opacity-50"
      >
        {loading ? "Importing…" : "Import branches from CSV"}
      </button>
      {message && <p className="text-sm text-sd-glow">{message}</p>}
    </div>
  );
}
