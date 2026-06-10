import { computeSetResults } from "@/lib/products/sword-duels/scoring";
import type { SdAreaSchedulesConfig } from "@/lib/products/sword-duels/area-schedules";
import type {
  SdAreaBracket,
  SdAreaSet,
  SdSetScore,
} from "@/lib/products/sword-duels/types";
import { SD_AREA_SET_LABELS } from "@/lib/products/sword-duels/types";
import { SdBattleScheduleMeta } from "./SdBattleScheduleMeta";

interface Props {
  area: string;
  scheduleConfig?: SdAreaSchedulesConfig;
  bracket: SdAreaBracket;
  groupSets: SdAreaSet[];
  publicScores: Map<string, SdSetScore[]>;
  championName?: string | null;
  phaseLabel?: string;
}

function groupLeader(
  bracket: SdAreaBracket,
  set: SdAreaSet,
  publicScores: Map<string, SdSetScore[]>
) {
  if (set.status !== "published") return null;
  const pool = set.set_type === "group_a" ? bracket.groupA : bracket.groupB;
  const scores = publicScores.get(set.id) ?? [];
  const { ranked } = computeSetResults(pool, scores, set.scoring_mode);
  return ranked[0] ?? null;
}

export function AreaGroupStickySummary({
  area,
  scheduleConfig,
  bracket,
  groupSets,
  publicScores,
  championName,
  phaseLabel,
}: Props) {
  const leaders = groupSets.flatMap((set) => {
    const leader = groupLeader(bracket, set, publicScores);
    return leader ? [{ set, leader }] : [];
  });

  if (leaders.length === 0 && !championName) return null;

  return (
    <div className="sticky top-0 z-30 -mx-4 border-b border-emerald-500/15 bg-sd-deep/95 px-4 py-3 backdrop-blur-xl md:top-[3.25rem] md:mx-0 md:rounded-xl md:border md:border-emerald-500/20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-lime-300/90">
          {phaseLabel ?? "Live standings"}
        </p>
        {championName && (
          <p className="text-xs font-semibold text-emerald-100">
            Champion · {championName}
          </p>
        )}
      </div>
      {leaders.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {leaders.map(({ set, leader }) => (
            <div
              key={set.id}
              className="flex min-w-0 flex-1 flex-col gap-1 rounded-lg bg-emerald-950/50 px-3 py-2 ring-1 ring-emerald-500/15 sm:min-w-[10rem] sm:flex-none"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-sd-muted/80">
                  {SD_AREA_SET_LABELS[set.set_type]}
                </span>
                <span className="min-w-0 truncate text-sm font-medium text-white">
                  {leader.active_representative_name ?? leader.branch_name}
                  <span className="ml-1.5 tabular-nums text-lime-300">
                    {leader.points}
                  </span>
                </span>
              </div>
              <SdBattleScheduleMeta
                area={area}
                setType={set.set_type}
                scheduleConfig={scheduleConfig}
                compact
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
