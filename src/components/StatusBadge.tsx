import type { BranchStatus } from "@/lib/types";

const styles: Record<BranchStatus, string> = {
  active: "bg-slate-700 text-slate-100",
  advanced: "bg-emerald-600/90 text-white",
  eliminated: "bg-slate-800 text-slate-400 line-through",
  regional_finalist: "bg-emerald-600/90 text-white ring-1 ring-sd-gold/50",
  champion: "bg-[var(--sd-gold)] text-sd-deep font-semibold",
};

export function statusLabel(
  status: BranchStatus,
  context?: {
    eliminatedInRound?: number | null;
    advancingToRound?: number | null;
    manuallyAdvancedAfterRound?: number | null;
  }
): string {
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
  manuallyAdvancedAfterRound?: number | null;
}

export function StatusBadge({
  status,
  eliminatedInRound,
  advancingToRound,
  manuallyAdvancedAfterRound,
}: Props) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs ${styles[status]}`}
    >
      {statusLabel(status, {
        eliminatedInRound,
        advancingToRound,
        manuallyAdvancedAfterRound,
      })}
    </span>
  );
}
