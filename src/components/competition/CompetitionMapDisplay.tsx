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
import { SEASON_JOURNEY_LINE } from "@/lib/season-labels";
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
  const emptyHint = getMilestoneDataHint(getMilestoneMeta(remaining.dataMilestoneId));

  return (
    <div className="sd-neon-panel mx-auto max-w-4xl space-y-6 p-5 sm:p-8">
      <header className="space-y-2 text-center sm:text-left">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-fuchsia-300/80">
          Season quest
        </p>
        <h2 className="text-xl font-bold text-white sm:text-2xl">
          The path to the crown
        </h2>
        <p className="text-sm leading-relaxed text-sd-muted">{SEASON_JOURNEY_LINE}</p>
      </header>

      <div className="relative overflow-hidden rounded-2xl sd-glass-strong px-5 py-4 text-center sm:text-left">
        <div
          className="sd-light-streak sd-light-streak--green left-0 top-3"
          aria-hidden
        />
        <p className="relative text-sm font-medium leading-relaxed text-emerald-50 sm:text-base">
          {caption}
        </p>
        <p className="relative mt-1.5 text-xs text-sd-muted/80">{meta.label}</p>
      </div>

      <CompetitionMapTrack activeMilestoneId={config.milestoneId} />

      {remaining.dataMismatch && remaining.mismatchMessage && (
        <div
          className="rounded-xl border border-amber-500/30 bg-amber-950/25 px-4 py-3 text-sm leading-relaxed text-amber-100/95"
          role="status"
        >
          {remaining.mismatchMessage}
        </div>
      )}

      {meta.usesRegions && (
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          <span className="w-full text-center text-[10px] font-bold uppercase tracking-[0.2em] text-sd-muted/60 sm:text-left">
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
        <details className="group sd-glass-strong rounded-2xl" open>
          <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-white [&::-webkit-details-marker]:hidden">
            <span className="flex items-center justify-between gap-3">
              <span className="text-left">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-sd-muted/70">
                  Roster
                </span>
                <span className="mt-0.5 block text-base">Remaining contestants</span>
              </span>
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-semibold tabular-nums text-sd-glow">
                {remaining.configured ? remaining.totalCount : "—"}
              </span>
            </span>
          </summary>
          <div className="border-t border-emerald-500/15 px-5 pb-5 pt-3">
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
              <div key={g.regionLabel} className="mt-5 first:mt-0">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-sd-glow">
                  {g.regionLabel}
                  <span className="ml-2 text-sd-muted/70">({g.totalInRegion})</span>
                </h3>
                <ul className="max-h-52 space-y-1.5 overflow-y-auto pr-1 text-sm">
                  {g.rows.map((row) => (
                    <li
                      key={row.branch_id}
                      className="sd-row-hover flex flex-wrap items-center justify-between gap-2 rounded-lg bg-sd-deep/40 px-3 py-2"
                    >
                      <span>
                        <span className="font-medium text-white">{row.branch_name}</span>
                        <span className="ml-2 text-xs text-sd-muted/70">{row.area}</span>
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
