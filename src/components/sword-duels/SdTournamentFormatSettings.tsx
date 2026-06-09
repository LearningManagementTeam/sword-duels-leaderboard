"use client";

import { useState, useTransition } from "react";
import { updateSdTournamentFormat } from "@/lib/actions/sword-duels-admin";
import {
  SD_TOURNAMENT_FORMAT_LABELS,
  SD_TOURNAMENT_FORMAT_SUMMARY,
  type SdTournamentFormat,
} from "@/lib/products/sword-duels/tournament-format";

interface Props {
  currentFormat: SdTournamentFormat;
  hasPublishedScores: boolean;
}

export function SdTournamentFormatSettings({
  currentFormat,
  hasPublishedScores,
}: Props) {
  const [format, setFormat] = useState<SdTournamentFormat>(currentFormat);
  const [savedFormat, setSavedFormat] = useState(currentFormat);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await updateSdTournamentFormat(format);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSavedFormat(format);
      setMessage(
        `Live tournament format set to ${SD_TOURNAMENT_FORMAT_LABELS[format]}. Public leaderboards will follow this path.`
      );
    });
  }

  return (
    <div className="sd-neon-panel space-y-4 p-4 sm:p-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sd-glow">
          Tournament format
        </p>
        <p className="mt-1 font-medium text-white">Active bracket rules</p>
        <p className="mt-1 max-w-2xl text-sm text-sd-muted">
          Phase 1 (area Group A/B → area final) is the same in both versions.
          This setting controls nationals: wild card + 16-slot knockout (V1) or
          regional 3-round averages + 3-way finals (V2).
        </p>
        <p className="mt-2 text-xs text-emerald-200/80">
          Active:{" "}
          <strong className="text-white">
            {SD_TOURNAMENT_FORMAT_LABELS[savedFormat]}
          </strong>
        </p>
      </div>

      <div className="space-y-3">
        {(
          Object.keys(SD_TOURNAMENT_FORMAT_LABELS) as SdTournamentFormat[]
        ).map((key) => (
          <label
            key={key}
            className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition ${
              format === key
                ? "border-cyan-400/40 bg-cyan-500/10"
                : "border-emerald-500/15 bg-sd-deep/20 hover:border-emerald-500/25"
            }`}
          >
            <input
              type="radio"
              name="sd-tournament-format"
              value={key}
              checked={format === key}
              disabled={pending || (hasPublishedScores && key !== savedFormat)}
              onChange={() => setFormat(key)}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-semibold text-white">
                {SD_TOURNAMENT_FORMAT_LABELS[key]}
              </span>
              <span className="mt-1 block text-xs text-sd-muted">
                {SD_TOURNAMENT_FORMAT_SUMMARY[key]}
              </span>
            </span>
          </label>
        ))}
      </div>

      {hasPublishedScores && format !== savedFormat && (
        <p className="text-xs text-amber-200/90">
          Unpublish all area and regional scores before switching format.
        </p>
      )}

      <button
        type="button"
        disabled={pending || format === savedFormat}
        onClick={handleSave}
        className="sd-btn-primary rounded-lg px-4 py-2 text-sm disabled:opacity-50"
      >
        {pending ? "Saving…" : "Set live format"}
      </button>

      {message && <p className="text-sm text-emerald-300">{message}</p>}
      {error && <p className="text-sm text-red-300">{error}</p>}
    </div>
  );
}
