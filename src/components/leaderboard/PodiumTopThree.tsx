import { branchInitials } from "@/lib/branding";
import { StatusBadge } from "@/components/StatusBadge";
import type { StandingRow } from "@/lib/types";

interface Props {
  topThree: StandingRow[];
  tvMode?: boolean;
}

function PodiumSlot({
  row,
  rank,
  elevated,
  tvMode,
}: {
  row: StandingRow | undefined;
  rank: 1 | 2 | 3;
  elevated?: boolean;
  tvMode?: boolean;
}) {
  if (!row) {
    return (
      <div className="flex flex-1 flex-col items-center opacity-30">
        <div className="h-24 w-24 rounded-xl border border-dashed border-emerald-500/30 bg-sd-panel/50" />
      </div>
    );
  }

  const glow =
    rank === 1
      ? "ring-emerald-400 animate-glow-pulse"
      : rank === 2
        ? "ring-emerald-500/60"
        : "ring-fuchsia-500/40";

  return (
    <div
      className={`flex flex-1 flex-col items-center ${elevated ? "-mt-6 sm:-mt-8" : "mt-4"}`}
    >
      {rank === 1 && (
        <span className="mb-1 text-2xl text-[var(--sd-gold)]" aria-hidden>
          ♛
        </span>
      )}
      {rank !== 1 && (
        <span
          className={`mb-1 font-bold text-[var(--sd-gold)] ${tvMode ? "text-lg" : "text-sm"}`}
        >
          {rank === 2 ? "▼" : "▲"} {rank}
        </span>
      )}
      <div
        className={`sd-neon-panel flex items-center justify-center font-bold text-emerald-100 ring-2 ${glow} ${
          tvMode ? "h-28 w-28 text-2xl" : elevated ? "h-24 w-24 text-xl" : "h-20 w-20 text-lg"
        }`}
      >
        {branchInitials(row.branch_name)}
      </div>
      <p
        className={`mt-2 max-w-[140px] truncate text-center font-semibold text-white ${
          tvMode ? "text-base" : "text-sm"
        }`}
      >
        {row.branch_name}
      </p>
      <p
        className={`font-bold tabular-nums text-sd-glow ${
          tvMode ? "text-2xl" : "text-lg"
        }`}
      >
        {row.total_points}
      </p>
      <div className="mt-1 scale-90">
        <StatusBadge
          status={row.status}
          eliminatedInRound={row.eliminated_in_round}
          advancingToRound={row.advancing_to_round}
          tieBreakerInRound={row.tie_breaker_in_round}
          manuallyAdvancedAfterRound={row.manually_advanced_after_round}
        />
      </div>
    </div>
  );
}

export function PodiumTopThree({ topThree, tvMode }: Props) {
  const byRank = (n: number) => topThree.find((r) => r.rank === n);
  const first = byRank(1);
  const second = byRank(2);
  const third = byRank(3);

  if (!first && !second && !third) return null;

  return (
    <div
      className={`flex items-end justify-center gap-2 px-2 sm:gap-6 ${
        tvMode ? "min-h-[280px]" : "min-h-[220px]"
      }`}
    >
      <PodiumSlot row={second} rank={2} tvMode={tvMode} />
      <PodiumSlot row={first} rank={1} elevated tvMode={tvMode} />
      <PodiumSlot row={third} rank={3} tvMode={tvMode} />
    </div>
  );
}
