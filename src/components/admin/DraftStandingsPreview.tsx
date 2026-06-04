"use client";

import { useState } from "react";
import { AdminActionRow } from "@/components/admin/AdminActionHint";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import {
  previewDraftStandings,
  type DraftPreviewResult,
} from "@/lib/actions/admin";
import { ADMIN_ROUND_HINTS } from "@/lib/admin-action-hints";
import {
  getSurvivorCount,
  REGION_LABELS,
  usesPerRoundElimination,
} from "@/lib/scoring-config";
import type { Region, SeasonSlug } from "@/lib/scoring-config";

interface DraftResultInput {
  branch_id: string;
  points: number;
  finish_order?: number | null;
}

interface Props {
  roundId: string;
  seasonSlug: SeasonSlug;
  getDraftResults: () => DraftResultInput[];
}

function cutoffForRegion(preview: DraftPreviewResult, region: Region): number {
  const rows = preview.byRegion?.[region] ?? [];
  const latest = rows[0]?.latest_published_round ?? 1;
  return getSurvivorCount(preview.seasonSlug, latest, region) ?? 32;
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

  const perRound = usesPerRoundElimination(seasonSlug);

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
      <AdminActionRow hint={ADMIN_ROUND_HINTS.previewDraft}>
        <button
          type="button"
          disabled={loading}
          onClick={handlePreview}
          className="sd-btn-secondary rounded-lg px-4 py-2 text-sm disabled:opacity-50"
        >
          {loading ? "Loading preview…" : "Preview standings (draft)"}
        </button>
      </AdminActionRow>
      {error && <p className="text-sm text-red-300">{error}</p>}

      {open && preview && (
        <div className="sd-alert-warning space-y-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-sd-glow">
              Draft preview — not published yet
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-sd-muted hover:text-white"
            >
              Hide
            </button>
          </div>

          {preview.byRegion ? (
            (["luzon", "ncr", "vismin"] as Region[]).map((region) => {
              const rows = preview.byRegion?.[region] ?? [];
              const latest = rows[0]?.latest_published_round ?? 0;
              return (
                <div key={region} className="space-y-2">
                  <h3 className="text-sm font-medium text-sd-muted">
                    {REGION_LABELS[region]}
                    {latest > 0 && ` · after Round ${latest}`}
                  </h3>
                  <LeaderboardTable
                    rows={rows}
                    advancementCutoff={cutoffForRegion(preview, region)}
                    showRepresentatives
                    seasonSlug={seasonSlug}
                    latestPublishedRound={latest}
                    compact
                  />
                </div>
              );
            })
          ) : (
            <LeaderboardTable
              rows={preview.rows}
              advancementCutoff={1}
              showArea={seasonSlug === "june_area"}
              showRepresentatives
              seasonSlug={perRound ? undefined : seasonSlug}
              compact
            />
          )}
        </div>
      )}
    </div>
  );
}
