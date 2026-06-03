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
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-fuchsia-300/80">
            Quest log
          </p>
          <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">
            Season journey
          </h2>
          <p className="mt-1 text-sm text-sd-muted">
            June → July → August — follow the path as the competition unfolds
          </p>
        </div>
        <span className="animate-glow-pulse sd-glass rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-sd-glow ring-1 ring-emerald-400/30">
          You are here
        </span>
      </div>

      <div className="relative overflow-hidden rounded-xl sd-glass-strong px-4 py-3.5 sm:px-5">
        <div
          className="sd-light-streak sd-light-streak--green left-0 top-3"
          aria-hidden
        />
        <p className="relative text-sm font-medium leading-relaxed text-emerald-50 sm:text-base">
          {caption}
        </p>
        <p className="relative mt-1 text-xs text-sd-muted/80">{meta.label}</p>
      </div>

      <CompetitionMapTrack activeMilestoneId={config.milestoneId} />

      {meta.usesRegions && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-full text-[10px] font-bold uppercase tracking-[0.2em] text-sd-muted/60">
            Region spotlight
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
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  highlighted
                    ? "bg-gradient-to-r from-sd-lime to-emerald-400 text-sd-deep shadow-[0_0_12px_rgb(163_230_53/0.25)]"
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
        <details className="group sd-glass-strong rounded-xl" open>
          <summary className="cursor-pointer list-none px-4 py-3.5 text-sm font-semibold text-white [&::-webkit-details-marker]:hidden">
            <span className="flex items-center justify-between gap-2">
              <span>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-sd-muted/70">
                  Roster
                </span>
                <span className="mt-0.5 block">Remaining contestants</span>
              </span>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-sm text-sd-glow">
                {remaining.configured ? remaining.totalCount : "—"}
              </span>
            </span>
          </summary>
          <div className="border-t border-emerald-500/15 px-4 pb-4 pt-2">
            {!remaining.configured && (
              <p className="text-sm text-sd-muted">
                Standings will appear here once the season data is live.
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
                      className="sd-row-hover flex flex-wrap items-center justify-between gap-2 rounded-lg bg-sd-deep/40 px-2 py-1.5"
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
