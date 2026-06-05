import { Suspense } from "react";
import { LeaderboardSection } from "@/components/LeaderboardSection";
import { PreviewBanner } from "@/components/PreviewBanner";
import {
  buildCapacityStandings,
  buildNationalsCapacityStandings,
  JULY_SLOTS_PER_REGION,
} from "@/lib/roster-capacity";
import { seasonPhaseLabel } from "@/lib/season-labels";
import {
  getSurvivorCount,
  REGIONS,
  REGION_LABELS,
  SCORING_CONFIG,
  type Region,
  type SeasonSlug,
} from "@/lib/scoring-config";
import type { Branch } from "@/lib/types";

interface Props {
  branches: Branch[];
}

function sectionCutoff(seasonSlug: SeasonSlug, region?: Region): number {
  if (seasonSlug === "august_finals") return 3;
  if (!region) return 24;
  return getSurvivorCount(seasonSlug, 1, region) ?? 32;
}

export function RosterCapacityPreview({ branches }: Props) {
  const total = branches.length;
  const phases: SeasonSlug[] = ["june_area", "july_region", "august_finals"];

  return (
    <div className="space-y-10">
      <PreviewBanner />
      <p className="text-sm text-sd-muted">
        Full field layout with dashed <strong className="text-sd-glow">placeholder</strong>{" "}
        rows for empty slots. Uses your loaded branch roster ({total} branches) — not
        live scores.
      </p>

      {phases.map((slug) => {
        const config = SCORING_CONFIG[slug];

        if (slug === "august_finals") {
          const rows = buildNationalsCapacityStandings(branches);
          return (
            <section key={slug} className="space-y-4">
              <h2 className="text-xl font-semibold text-sd-glow">
                {seasonPhaseLabel(slug)} — full field ({rows.length} slots)
              </h2>
              <Suspense fallback={<p className="text-sm text-sd-muted">Loading…</p>}>
                <LeaderboardSection
                  bannerSubtitle="Placeholder champions until July is locked"
                  rows={rows}
                  advancementCutoff={sectionCutoff(slug)}
                  cutLineLabel="Championship board capacity"
                  seasonSlug={slug}
                  latestPublishedRound={0}
                  showBanner
                  showDetailToggle={false}
                />
              </Suspense>
            </section>
          );
        }

        return (
          <section key={slug} className="space-y-6">
            <h2 className="text-xl font-semibold text-sd-glow">
              {seasonPhaseLabel(slug)} — by region
            </h2>
            <p className="text-xs text-sd-muted/70">
              {slug === "july_region"
                ? `Up to ${JULY_SLOTS_PER_REGION} branches per region (24 total).`
                : "All branches in each region; cut line shows Round 1 survivor target."}
            </p>
            <div className="grid gap-8 lg:grid-cols-1">
              {REGIONS.map((region) => {
                const rows = buildCapacityStandings(slug, region, branches, total);
                const cutoff = sectionCutoff(slug, region);
                const placeholderCount = rows.filter((r) => r.is_placeholder).length;
                return (
                  <div key={`${slug}-${region}`} className="sd-neon-panel p-4 sm:p-5">
                    <h3 className="mb-1 font-semibold text-white">
                      {REGION_LABELS[region]}
                      <span className="ml-2 text-xs font-normal text-sd-muted/70">
                        {rows.length} slots
                        {placeholderCount > 0
                          ? ` · ${placeholderCount} placeholder${placeholderCount === 1 ? "" : "s"}`
                          : ""}
                      </span>
                    </h3>
                    <Suspense fallback={<p className="text-sm text-sd-muted">Loading…</p>}>
                      <LeaderboardSection
                        bannerSubtitle={`${config.name} · capacity preview`}
                        rows={rows}
                        advancementCutoff={cutoff}
                        cutLineLabel={`Cut line — top ${cutoff} (Round 1 target)`}
                        seasonSlug={slug}
                        region={region}
                        latestPublishedRound={0}
                        showBanner={false}
                        showDetailToggle={false}
                      />
                    </Suspense>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <p className="text-xs text-sd-muted/60">
        Open individual demo boards from{" "}
        <a href="/admin/national-competitions/preview" className="sd-link">
          Admin → Preview
        </a>{" "}
        or the public preview hub at /preview.
      </p>
    </div>
  );
}
