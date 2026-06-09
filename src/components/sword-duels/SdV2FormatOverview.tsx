import Link from "next/link";
import { REGIONS, REGION_LABELS } from "@/lib/scoring-config";
import { SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";

export function SdV2FormatOverview() {
  return (
    <section className="sd-inset rounded-2xl p-4 sm:p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/80">
        Version 2 tournament map
      </p>
      <h3 className="mt-1 text-lg font-bold text-white">
        Area reps → regional average → finals
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-sd-muted">
        Phase 1 is unchanged: branches in each area split into Group A and Group
        B, then fight for one area representative. Phase 2 groups those reps by{" "}
        {REGIONS.map((r) => REGION_LABELS[r]).join(", ")} for three scored
        rounds — highest average wins the region. Phase 3 is a national finals
        bracket with three regional champions (no wild card).
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {REGIONS.map((region) => (
          <Link
            key={region}
            href={`${SWORD_DUELS_PUBLIC}/regionals/${region}`}
            className="rounded-lg sd-glass px-3 py-1.5 text-xs font-semibold ring-1 ring-emerald-500/20 hover:ring-cyan-400/35"
          >
            {REGION_LABELS[region]} standings
          </Link>
        ))}
      </div>
    </section>
  );
}
