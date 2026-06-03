"use client";

import { useState } from "react";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import {
  previewDraftStandings,
  type DraftPreviewResult,
} from "@/lib/actions/admin";
import { SCORING_CONFIG, REGION_LABELS } from "@/lib/scoring-config";
import type { Region, SeasonSlug } from "@/lib/scoring-config";

interface DraftResultInput {
  branch_id: string;
  points: number;
  wins: number;
  losses: number;
}

interface Props {
  roundId: string;
  seasonSlug: SeasonSlug;
  getDraftResults: () => DraftResultInput[];
}

export function DraftStandingsPreview({
  roundId,
  seasonSlug,
  getDraftResults,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<DraftPreviewResult | null>(null);

  const config = SCORING_CONFIG[seasonSlug];
  const cutoff =
    seasonSlug === "july_region"
      ? SCORING_CONFIG.july_region.advancementPerRegion
      : "advancementCount" in config
        ? (config.advancementCount ?? 1)
        : 1;

  async function handlePreview() {
    setLoading(true);
    setError("");
    try {
      const result = await previewDraftStandings(roundId, getDraftResults());
      setPreview(result);
      setOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Preview failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={loading}
        onClick={handlePreview}
        className="rounded-lg border border-amber-500/40 px-4 py-2 text-sm text-amber-200 hover:bg-amber-500/10 disabled:opacity-50"
      >
        {loading ? "Loading preview…" : "Preview standings (draft)"}
      </button>
      {error && <p className="text-sm text-red-300">{error}</p>}

      {open && preview && (
        <div className="space-y-4 rounded-xl border border-amber-500/30 bg-slate-900/50 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-amber-200">
              Draft preview — not published yet
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Hide
            </button>
          </div>

          {preview.byRegion ? (
            (["luzon", "ncr", "vismin"] as Region[]).map((region) => (
              <div key={region} className="space-y-2">
                <h3 className="text-sm font-medium text-slate-300">
                  {REGION_LABELS[region]}
                </h3>
                <LeaderboardTable
                  rows={preview.byRegion?.[region] ?? []}
                  advancementCutoff={cutoff}
                  showRepresentatives
                  compact
                />
              </div>
            ))
          ) : (
            <LeaderboardTable
              rows={preview.rows}
              advancementCutoff={cutoff}
              showArea={seasonSlug === "june_area"}
              showRepresentatives
              compact
            />
          )}
        </div>
      )}
    </div>
  );
}
