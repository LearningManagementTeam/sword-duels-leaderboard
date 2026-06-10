import Link from "next/link";
import { hrisPath, nationalCompetitionsPath } from "@/lib/admin-routes";
import type { HrisSetupOverview } from "@/lib/data/hris-queries";

interface Props {
  overview: HrisSetupOverview;
}

function progressTone(current: number, target: number): string {
  if (current === 0) return "text-amber-200";
  if (current >= target) return "text-emerald-300";
  return "text-violet-200";
}

function repTone(filled: number, total: number): string {
  if (total === 0) return "text-sd-muted";
  if (filled === 0) return "text-amber-200";
  if (filled >= total) return "text-emerald-300";
  return "text-violet-200";
}

export function HrisSetupProgress({ overview }: Props) {
  const branchReady = overview.activeBranches >= overview.branchTarget;
  const rep1Pct =
    overview.activeBranches > 0
      ? Math.round(
          (overview.branchesWithRep1 / overview.activeBranches) * 100
        )
      : 0;

  return (
    <section className="space-y-3" aria-label="Event setup progress">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="font-semibold text-violet-200">Setup progress</h2>
        <p className="text-xs text-sd-muted/70">
          Branches and employees before scoring in Revalida
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href={hrisPath("branches")}
          className="sd-neon-panel block p-4 ring-1 ring-violet-400/15 transition hover:ring-violet-400/30"
        >
          <p className="text-[10px] font-medium uppercase tracking-wide text-sd-muted">
            Active branches
          </p>
          <p
            className={`mt-1 text-2xl font-semibold tabular-nums ${progressTone(
              overview.activeBranches,
              overview.branchTarget
            )}`}
          >
            {overview.activeBranches}
            <span className="text-base font-normal text-sd-muted">
              {" "}
              / {overview.branchTarget}
            </span>
          </p>
          <p className="mt-1 text-[11px] text-sd-muted">
            {branchReady
              ? "Master list ready"
              : `${overview.branchTarget - overview.activeBranches} to target`}
            {overview.totalBranches !== overview.activeBranches &&
              ` · ${overview.totalBranches - overview.activeBranches} inactive`}
          </p>
        </Link>

        <Link
          href={hrisPath("employees")}
          className="sd-neon-panel block p-4 ring-1 ring-violet-400/15 transition hover:ring-violet-400/30"
        >
          <p className="text-[10px] font-medium uppercase tracking-wide text-sd-muted">
            Employees
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-300">
            {overview.employeeCount}
          </p>
          <p className="mt-1 text-[11px] text-sd-muted">
            {overview.employeesWithHomeBranch} with home branch set
          </p>
        </Link>

        <Link
          href={nationalCompetitionsPath("representatives")}
          className="sd-neon-panel block p-4 ring-1 ring-violet-400/15 transition hover:ring-violet-400/30"
        >
          <p className="text-[10px] font-medium uppercase tracking-wide text-sd-muted">
            Rep 1 assigned
          </p>
          <p
            className={`mt-1 text-2xl font-semibold tabular-nums ${repTone(
              overview.branchesWithRep1,
              overview.activeBranches
            )}`}
          >
            {overview.branchesWithRep1}
            <span className="text-base font-normal text-sd-muted">
              {" "}
              / {overview.activeBranches}
            </span>
          </p>
          <p className="mt-1 text-[11px] text-sd-muted">
            {rep1Pct}% of active branches · Rep 2: {overview.branchesWithRep2}
          </p>
        </Link>

        <Link
          href={`${hrisPath("employees")}?filter=not_rep`}
          className={`sd-neon-panel block p-4 ring-1 transition hover:ring-violet-400/30 ${
            overview.branchesMissingRep1 > 0
              ? "ring-amber-400/25"
              : "ring-emerald-400/20"
          }`}
        >
          <p className="text-[10px] font-medium uppercase tracking-wide text-sd-muted">
            Needs Rep 1
          </p>
          <p
            className={`mt-1 text-2xl font-semibold tabular-nums ${
              overview.branchesMissingRep1 > 0
                ? "text-amber-200"
                : "text-emerald-300"
            }`}
          >
            {overview.branchesMissingRep1}
          </p>
          <p className="mt-1 text-[11px] text-sd-muted">
            Assign from employee profiles or Representatives table
          </p>
        </Link>
      </div>
    </section>
  );
}
