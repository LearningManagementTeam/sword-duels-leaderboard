import type { BranchStatus } from "@/lib/types";

const styles: Record<BranchStatus, string> = {
  active: "bg-emerald-600/40 text-emerald-100 ring-1 ring-emerald-400/40",
  advanced: "bg-emerald-600/90 text-white",
  tie_breaker:
    "bg-fuchsia-500/25 text-fuchsia-100 ring-1 ring-fuchsia-400/70 sd-tie-breaker-pulse",
  eliminated:
    "bg-emerald-950/80 text-emerald-200/50 ring-1 ring-emerald-800/40",
  regional_finalist:
    "bg-emerald-600/90 text-white ring-1 ring-[var(--sd-gold)]/50",
  champion: "bg-[var(--sd-gold)] text-sd-deep font-semibold",
};

export function statusLabel(
  status: BranchStatus,
  context?: {
    eliminatedInRound?: number | null;
    advancingToRound?: number | null;
    tieBreakerInRound?: number | null;
    manuallyAdvancedAfterRound?: number | null;
  }
): string {
  if (status === "tie_breaker" && context?.tieBreakerInRound) {
    return `Tie breaker — R${context.tieBreakerInRound}`;
  }
  if (status === "eliminated" && context?.eliminatedInRound) {
    return `Eliminated — R${context.eliminatedInRound}`;
  }
  if (status === "active" && context?.advancingToRound) {
    if (context.manuallyAdvancedAfterRound) {
      return `Advancing to R${context.advancingToRound} (committee pick)`;
    }
    return `Advancing to R${context.advancingToRound}`;
  }
  const labels: Record<BranchStatus, string> = {
    active: "Active",
    advanced: "Advancing to July",
    tie_breaker: "Tie breaker",
    eliminated: "Eliminated",
    regional_finalist: "Regional champion",
    champion: "Champion",
  };
  return labels[status];
}

interface Props {
  status: BranchStatus;
  eliminatedInRound?: number | null;
  advancingToRound?: number | null;
  tieBreakerInRound?: number | null;
  manuallyAdvancedAfterRound?: number | null;
}

export function StatusBadge({
  status,
  eliminatedInRound,
  advancingToRound,
  tieBreakerInRound,
  manuallyAdvancedAfterRound,
}: Props) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs ${styles[status]}`}
    >
      {statusLabel(status, {
        eliminatedInRound,
        advancingToRound,
        tieBreakerInRound,
        manuallyAdvancedAfterRound,
      })}
    </span>
  );
}
