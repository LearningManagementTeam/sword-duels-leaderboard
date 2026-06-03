import { StatusBadge } from "@/components/StatusBadge";
import {
  COMPETITION_MILESTONES,
  getMilestoneMeta,
  milestoneIndex,
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
  const activeIdx = milestoneIndex(config.milestoneId);
  const caption =
    config.publicCaption.trim() ||
    `You are here: ${meta.label}`;

  const trackMilestones = COMPETITION_MILESTONES.filter(
    (m) => m.group !== "setup"
  );

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
        </div>
        <span className="sd-glass rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sd-glow">
          You are here
        </span>
      </div>

      <p className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100">
        {caption}
      </p>

      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-[640px] items-center gap-1">
          {trackMilestones.map((m) => {
            const idx = milestoneIndex(m.id);
            const isActive = m.id === config.milestoneId;
            const isPast = idx < activeIdx;
            return (
              <div key={m.id} className="flex flex-1 items-center gap-1">
                <div
                  className={`flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-center transition ${
                    isActive
                      ? "scale-105 ring-2 ring-sd-glow/60 bg-emerald-500/15 shadow-[0_0_20px_rgb(74_222_128/0.25)]"
                      : isPast
                        ? "opacity-80"
                        : "opacity-45"
                  }`}
                  title={m.label}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold sm:text-xs ${
                      isActive
                        ? "bg-gradient-to-br from-sd-lime to-emerald-400 text-sd-deep"
                        : isPast
                          ? "bg-emerald-600/50 text-white"
                          : "sd-glass text-sd-muted"
                    }`}
                  >
                    {m.shortLabel}
                  </span>
                  <span
                    className={`max-w-[4.5rem] text-[9px] leading-tight sm:max-w-none sm:text-[10px] ${
                      isActive ? "text-sd-glow font-medium" : "text-sd-muted/70"
                    }`}
                  >
                    {m.label.split(" — ").pop() ?? m.shortLabel}
                  </span>
                </div>
                {m.id !== "complete" && (
                  <div
                    className={`h-0.5 flex-1 min-w-[8px] rounded-full ${
                      isPast ? "bg-emerald-500/50" : "bg-emerald-900/60"
                    }`}
                    aria-hidden
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

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

      {config.showContestantList && (
        <details className="group sd-inset rounded-xl" open>
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-white [&::-webkit-details-marker]:hidden">
            <span className="flex items-center justify-between gap-2">
              Remaining contestants
              <span className="text-sd-glow">
                {remaining.configured
                  ? remaining.totalCount
                  : "—"}
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
              <p className="text-sm text-sd-muted">
                No published standings for this phase yet, or everyone is
                marked eliminated.
              </p>
            )}
            {remaining.groups.map((g) => (
              <div key={g.regionLabel} className="mt-4 first:mt-0">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-sd-glow">
                  {g.regionLabel}
                  <span className="ml-2 text-sd-muted/70">
                    ({g.rows.length})
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
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
