import type { BranchStatus } from "@/lib/types";

const styles: Record<BranchStatus, string> = {
  active: "bg-slate-700 text-slate-100",
  advanced: "bg-emerald-600/90 text-white",
  eliminated: "bg-slate-800 text-slate-400 line-through",
  regional_finalist: "bg-amber-600/90 text-white",
  champion: "bg-yellow-500 text-slate-900 font-semibold",
};

const labels: Record<BranchStatus, string> = {
  active: "Active",
  advanced: "Advancing",
  eliminated: "Eliminated",
  regional_finalist: "Regional finalist",
  champion: "Champion",
};

export function StatusBadge({ status }: { status: BranchStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
