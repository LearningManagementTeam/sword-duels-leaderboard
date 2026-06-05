"use client";

import { useState, useTransition } from "react";
import { syncSdBracketsForm, updateSdGroupSortMode } from "@/lib/actions/sword-duels-admin";
import {
  SD_GROUP_SORT_LABELS,
  type SdGroupSortMode,
} from "@/lib/products/sword-duels/area-groups";

interface Props {
  currentMode: SdGroupSortMode;
}

export function SdGroupSortSettings({ currentMode }: Props) {
  const [mode, setMode] = useState<SdGroupSortMode>(currentMode);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function saveMode() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        await updateSdGroupSortMode(mode);
        setMessage("Sort preference saved. Re-sync brackets to apply new groups.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  return (
    <div className="sd-neon-panel space-y-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-emerald-500/15 pb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sd-glow">
            Step 1 — Build brackets
          </p>
          <p className="mt-1 font-medium text-white">Sync area brackets</p>
          <p className="mt-1 max-w-xl text-sm text-sd-muted">
            Pulls branches from the master roster (with area assigned), splits
            each area into Group A and Group B, and creates scoring sets. Do this
            after importing branches — not the representatives CSV alone.
          </p>
        </div>
        <form action={syncSdBracketsForm}>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-400 px-5 py-2.5 text-sm font-semibold text-sd-deep shadow-[0_0_16px_rgb(34_211_238/0.25)] disabled:opacity-50"
          >
            Sync from branches
          </button>
        </form>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sd-muted/70">
          Optional — group order
        </p>
        <p className="mt-1 font-medium text-white">Group assignment order</p>
        <p className="mt-1 text-sm text-sd-muted">
          Choose how branches are sorted before the A/B split, then sync again.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block flex-1 text-sm text-sd-muted">
          Sort branches by
          <select
            value={mode}
            disabled={pending}
            onChange={(e) => setMode(e.target.value as SdGroupSortMode)}
            className="mt-1 block w-full max-w-md rounded sd-input px-3 py-2 text-sm text-white"
          >
            {(Object.keys(SD_GROUP_SORT_LABELS) as SdGroupSortMode[]).map(
              (key) => (
                <option key={key} value={key}>
                  {SD_GROUP_SORT_LABELS[key]}
                </option>
              )
            )}
          </select>
        </label>
        <button
          type="button"
          disabled={pending || mode === currentMode}
          onClick={saveMode}
          className="sd-btn-ghost rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Save preference
        </button>
      </div>

      <p className="text-xs text-sd-muted/75">
        After changing sort order, click <strong className="text-white">Sync from branches</strong>{" "}
        above to rebuild groups.
      </p>

      {message && <p className="text-sm text-emerald-300">{message}</p>}
      {error && <p className="text-sm text-red-300">{error}</p>}
    </div>
  );
}
