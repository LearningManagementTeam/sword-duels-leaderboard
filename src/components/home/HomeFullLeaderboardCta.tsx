import Link from "next/link";
import { branchCountLabel } from "@/lib/branch-targets";
import { getBranchCount } from "@/lib/data/queries";

export async function HomeFullLeaderboardCta() {
  const branchCount = await getBranchCount();
  const subtitle =
    branchCount > 0
      ? `${branchCountLabel(branchCount)} · all regions · more room to climb the ranks`
      : "All regions · more room to explore the full arena";

  return (
    <section className="text-center">
      <Link
        href="/june/leaderboard"
        className="sd-btn-primary inline-flex w-full max-w-md flex-col items-center gap-1 rounded-2xl px-6 py-4 text-base font-semibold sm:mx-auto"
      >
        <span>Go to full leaderboard</span>
        <span className="text-xs font-normal opacity-90">
          Round 3 · three regions side-by-side · {subtitle}
        </span>
      </Link>
    </section>
  );
}
