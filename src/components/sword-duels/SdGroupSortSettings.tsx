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
    <div className="sd-neon-panel space-y-4 p-4">
      <div>
        <p className="font-medium text-white">Group assignment order</p>
        <p className="mt-1 text-sm text-sd-muted">
          Branches in each area are sorted, split in half (Group A / Group B),
          then synced to the tournament map.
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

      <form action={syncSdBracketsForm} className="flex flex-wrap items-center justify-between gap-3 border-t border-emerald-500/15 pt-4">
        <p className="text-xs text-sd-muted/80">
          After changing sort order, re-sync to rebuild Group A / B assignments.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-400 px-4 py-2 text-sm font-semibold text-sd-deep disabled:opacity-50"
        >
          Sync from branches
        </button>
      </form>

      {message && <p className="text-sm text-emerald-300">{message}</p>}
      {error && <p className="text-sm text-red-300">{error}</p>}
    </div>
  );
}
