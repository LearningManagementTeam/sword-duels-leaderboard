import { REGION_LABELS } from "@/lib/scoring-config";
import type { NationalsAreaRep } from "@/lib/products/sword-duels/nationals-wildcard-data";
import { entrantFromAreaRep } from "@/lib/products/sword-duels/nationals-entrant";
import { NationalsParticipantCard } from "./NationalsParticipantCard";

interface Props {
  reps: NationalsAreaRep[];
  tvMode?: boolean;
}

export function NationalsRepGrid({ reps, tvMode = false }: Props) {
  const byRegion = {
    luzon: reps.filter((r) => r.region === "luzon"),
    ncr: reps.filter((r) => r.region === "ncr"),
    vismin: reps.filter((r) => r.region === "vismin"),
  } as const;

  return (
    <div className="space-y-5">
      {(["luzon", "ncr", "vismin"] as const).map((region) =>
        byRegion[region].length === 0 ? null : (
          <section key={region}>
            <h3
              className={`mb-2 font-bold uppercase tracking-[0.14em] text-emerald-200/80 ${
                tvMode ? "text-xs" : "text-[10px]"
              }`}
            >
              {REGION_LABELS[region]} · {byRegion[region].length} reps
            </h3>
            <div
              className={`grid gap-2 ${
                tvMode ? "sm:grid-cols-3 lg:grid-cols-6" : "sm:grid-cols-2 lg:grid-cols-3"
              }`}
            >
              {byRegion[region].map((rep) => (
                <NationalsParticipantCard
                  key={rep.area}
                  entrant={entrantFromAreaRep(rep)}
                  tvMode={tvMode}
                />
              ))}
            </div>
          </section>
        )
      )}
    </div>
  );
}
