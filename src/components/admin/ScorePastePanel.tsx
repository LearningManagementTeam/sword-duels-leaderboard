"use client";

import { useState } from "react";
import { AdminActionHint } from "@/components/admin/AdminActionHint";
import { ADMIN_ROUND_HINTS } from "@/lib/admin-action-hints";
import { parseScorePaste } from "@/lib/parse-score-paste";

interface Props {
  maxPoints: number;
  knownCodes: Set<string>;
  onApply: (
    updates: Array<{ branch_code: string; points: number }>
  ) => { applied: number; skipped: string[] };
}

export function ScorePastePanel({ maxPoints, knownCodes, onApply }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  function handleApply() {
    const { rows, errors } = parseScorePaste(text, maxPoints);
    if (errors.length > 0) {
      setError(true);
      setMessage(errors.slice(0, 5).join(" "));
      return;
    }
    const skipped: string[] = [];
    const updates: Array<{ branch_code: string; points: number }> = [];
    for (const row of rows) {
      if (!knownCodes.has(row.branch_code)) {
        skipped.push(row.branch_code);
        continue;
      }
      updates.push(row);
    }
    const { applied } = onApply(updates);
    setError(skipped.length > 0 && applied === 0);
    setMessage(
      applied > 0
        ? `Applied ${applied} score${applied === 1 ? "" : "s"}${
            skipped.length
              ? `. Skipped unknown codes: ${skipped.slice(0, 8).join(", ")}${
                  skipped.length > 8 ? "…" : ""
                }`
              : "."
          }`
        : "No matching branch codes in this round roster."
    );
    if (applied > 0) setText("");
  }

  return (
    <div className="sd-inset rounded-xl p-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left text-sm font-medium text-sd-glow"
      >
        Paste scores from spreadsheet
        <span className="text-sd-muted">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <AdminActionHint hint={ADMIN_ROUND_HINTS.pasteScores} />
          <p className="text-xs text-sd-muted/70">
            One line per branch: <code>branch_code,score</code> or tab-separated.
            Scores must be 0–{maxPoints}.
          </p>
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setMessage("");
            }}
            rows={6}
            placeholder={"BR001,10\nBR002,8"}
            className="sd-input w-full rounded-lg px-3 py-2 font-mono text-xs"
          />
          <button
            type="button"
            onClick={handleApply}
            disabled={!text.trim()}
            className="sd-btn-ghost rounded-lg px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Apply pasted scores
          </button>
          {message && (
            <p
              className={`text-xs ${error ? "text-amber-200" : "text-emerald-200"}`}
              role="status"
            >
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
