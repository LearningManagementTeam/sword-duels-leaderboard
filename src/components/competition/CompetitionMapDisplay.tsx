import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { CompetitionMapTrack } from "@/components/competition/CompetitionMapTrack";
import {
  getMilestoneDataHint,
  getMilestoneMeta,
  milestoneShowsContestantList,
  type CompetitionMapConfig,
} from "@/lib/competition-map";
import type { RemainingContestantsResult } from "@/lib/data/competition-map-queries";
import { REGIONS, REGION_LABELS } from "@/lib/scoring-config";

interface Props {
  config: CompetitionMapConfig;
  remaining: RemainingContestantsResult;
}

export function CompetitionMapDisplay({ config, remaining }: Props) {
  const meta = getMilestoneMeta(config.milestoneId);
  const caption =
    config.publicCaption.trim() || `You are here: ${meta.label}`;
  const showList =
    config.showContestantList && milestoneShowsContestantList(config.milestoneId);
  const emptyHint = getMilestoneDataHint(meta);

  return (
    <div className="sd-neon-panel space-y-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white sm:text-2xl">
            Competition map
          </h2>
          <p className="mt-1 text-sm text-sd-muted">
            Live progress across June → July → August
          </p>
          <p className="mt-2 text-xs text-sd-muted/80 max-w-xl">
            Caption is manual. Round bars on regional pages update automatically
            when you publish.
          </p>
        </div>
        <span className="sd-glass rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sd-glow">
          You are here
        </span>
      </div>

      <p className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100">
        {caption}
      </p>

      <CompetitionMapTrack activeMilestoneId={config.milestoneId} />

      {meta.usesRegions && (
        <div className="sd-inset flex flex-wrap gap-2 rounded-xl p-3">
          <span className="w-full text-xs uppercase tracking-wider text-sd-muted/70">
            Region focus
          </span>
          {(["all", ...REGIONS] as const).map((r) => {
            const label = r === "all" ? "All regions" : REGION_LABELS[r];
            const highlighted =
              config.regionHighlight === "all"
                ? r === "all"
                : config.regionHighlight === r;
            return (
              <span
                key={r}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  highlighted
                    ? "bg-gradient-to-r from-sd-lime to-emerald-400 text-sd-deep"
                    : "sd-glass text-sd-muted"
                }`}
              >
                {label}
              </span>
            );
          })}
        </div>
      )}

      {showList && (
        <details className="group sd-inset rounded-xl" open>
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-white [&::-webkit-details-marker]:hidden">
            <span className="flex items-center justify-between gap-2">
              Remaining contestants
              <span className="text-sd-glow">
                {remaining.configured ? remaining.totalCount : "—"}
              </span>
            </span>
          </summary>
          <div className="border-t border-emerald-500/15 px-4 pb-4 pt-2">
            {!remaining.configured && (
              <p className="text-sm text-sd-muted">
                Connect Supabase and publish standings to see live remaining
                branches.
              </p>
            )}
            {remaining.configured && remaining.totalCount === 0 && (
              <div className="space-y-2 text-sm text-sd-muted">
                <p>{emptyHint.message}</p>
                {emptyHint.linkHref && emptyHint.linkLabel && (
                  <Link href={emptyHint.linkHref} className="sd-link text-sm">
                    {emptyHint.linkLabel} →
                  </Link>
                )}
              </div>
            )}
            {remaining.groups.map((g) => (
              <div key={g.regionLabel} className="mt-4 first:mt-0">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-sd-glow">
                  {g.regionLabel}
                  <span className="ml-2 text-sd-muted/70">
                    ({g.totalInRegion})
                  </span>
                </h3>
                <ul className="max-h-48 space-y-1 overflow-y-auto pr-1 text-sm">
                  {g.rows.map((row) => (
                    <li
                      key={row.branch_id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-sd-deep/50 px-2 py-1.5"
                    >
                      <span>
                        <span className="font-medium text-white">
                          {row.branch_name}
                        </span>
                        <span className="ml-2 text-xs text-sd-muted/70">
                          {row.area}
                        </span>
                      </span>
                      <StatusBadge
                        status={row.status}
                        eliminatedInRound={row.eliminated_in_round}
                        advancingToRound={row.advancing_to_round}
                        tieBreakerInRound={row.tie_breaker_in_round}
                        manuallyAdvancedAfterRound={
                          row.manually_advanced_after_round
                        }
                      />
                    </li>
                  ))}
                </ul>
                {g.truncated && (
                  <p className="mt-2 text-xs text-sd-muted">
                    Showing {g.rows.length} of {g.totalInRegion} —{" "}
                    <Link href={g.viewPath} className="sd-link">
                      view full {g.regionLabel} board →
                    </Link>
                  </p>
                )}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
