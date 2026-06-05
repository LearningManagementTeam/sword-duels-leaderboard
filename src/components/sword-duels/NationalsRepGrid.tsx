import { REGION_LABELS, type Region } from "@/lib/scoring-config";
import type { NationalsAreaRep } from "@/lib/products/sword-duels/nationals-wildcard-demo";

const REGION_RING: Record<Region, string> = {
  luzon: "ring-cyan-400/25",
  ncr: "ring-emerald-400/25",
  vismin: "ring-lime-400/25",
};

interface Props {
  reps: NationalsAreaRep[];
  tvMode?: boolean;
}

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function NationalsRepGrid({ reps, tvMode = false }: Props) {
  const byRegion = {
    luzon: reps.filter((r) => r.region === "luzon"),
    ncr: reps.filter((r) => r.region === "ncr"),
    vismin: reps.filter((r) => r.region === "vismin"),
  } as const;

  return (
    <div className="space-y-5">
      {(["luzon", "ncr", "vismin"] as const).map((region) => (
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
              <div
                key={rep.area}
                className={`relative overflow-hidden rounded-lg bg-gradient-to-br from-emerald-950/80 via-emerald-900/45 to-emerald-800/35 px-2.5 py-2 ring-1 ring-inset ${REGION_RING[region]}`}
              >
                <span className="absolute right-1.5 top-1 rounded bg-emerald-500/20 px-1 py-px text-[7px] font-bold uppercase tracking-wider text-emerald-100/80">
                  Locked
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`flex shrink-0 items-center justify-center rounded bg-emerald-950/50 font-bold text-emerald-200/90 ${
                      tvMode ? "h-8 w-8 text-xs" : "h-7 w-7 text-[10px]"
                    }`}
                  >
                    {initials(rep.repName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate font-semibold text-white ${
                        tvMode ? "text-sm" : "text-xs"
                      }`}
                    >
                      {rep.repName}
                    </p>
                    <p className="truncate text-[9px] text-emerald-200/50">
                      {rep.area} · {rep.finalScore} pts
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
