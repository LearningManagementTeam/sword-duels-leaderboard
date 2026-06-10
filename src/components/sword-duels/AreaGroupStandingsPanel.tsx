import { computeSetResults } from "@/lib/products/sword-duels/scoring";
import type { SdAreaSchedulesConfig } from "@/lib/products/sword-duels/area-schedules";
import type {
  SdAreaBracket,
  SdAreaSet,
  SdSetScore,
} from "@/lib/products/sword-duels/types";
import { SD_AREA_SET_LABELS } from "@/lib/products/sword-duels/types";
import { SdBattleScheduleMeta } from "./SdBattleScheduleMeta";
import { SdCollapsibleSection } from "./SdCollapsibleSection";

interface Props {
  area: string;
  scheduleConfig?: SdAreaSchedulesConfig;
  bracket: SdAreaBracket;
  groupSets: SdAreaSet[];
  publicScores: Map<string, SdSetScore[]>;
  defaultOpen?: boolean;
  /** Standings-first layout — always visible when results exist. */
  prominent?: boolean;
}

function StandingsGrid({
  area,
  scheduleConfig,
  bracket,
  groupSets,
  publicScores,
}: Pick<
  Props,
  "area" | "scheduleConfig" | "bracket" | "groupSets" | "publicScores"
>) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
        {groupSets.map((set) => {
          const pool =
            set.set_type === "group_a" ? bracket.groupA : bracket.groupB;
          const scores = publicScores.get(set.id) ?? [];
          const { ranked } = computeSetResults(pool, scores, set.scoring_mode);
          const published = set.status === "published";

          return (
            <div
              key={set.id}
              className="sd-inset overflow-hidden rounded-xl ring-1 ring-emerald-500/15"
            >
              <div className="border-b border-emerald-500/10 bg-emerald-950/30 px-4 py-2.5">
                <h3 className="text-sm font-semibold text-white">
                  {SD_AREA_SET_LABELS[set.set_type]}
                </h3>
                <SdBattleScheduleMeta
                  area={area}
                  setType={set.set_type}
                  scheduleConfig={scheduleConfig}
                  compact
                  className="mt-1"
                />
              </div>
              {!published ? (
                <p className="px-4 py-3 text-sm text-sd-muted">
                  Awaiting results
                </p>
              ) : (
                <ol className="divide-y divide-emerald-500/10 px-2 py-1">
                  {ranked.map((r) => (
                    <li
                      key={r.branch_id}
                      className={`flex items-center justify-between gap-2 px-2 py-2.5 text-sm ${
                        r.is_winner
                          ? "rounded-lg bg-lime-400/10 text-emerald-200 ring-1 ring-lime-400/25 ring-inset"
                          : "text-sd-muted"
                      }`}
                    >
                      <span className="min-w-0 truncate">
                        <span className="mr-1.5 tabular-nums text-sd-muted/60">
                          #{r.rank}
                        </span>
                        {r.active_representative_name ?? r.branch_name}
                        {r.is_winner && (
                          <span className="ml-1 text-lime-300">★</span>
                        )}
                      </span>
                      <span className="shrink-0 tabular-nums font-medium">
                        {r.points}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          );
        })}
    </div>
  );
}

export function AreaGroupStandingsPanel({
  area,
  scheduleConfig,
  bracket,
  groupSets,
  publicScores,
  defaultOpen = false,
  prominent = false,
}: Props) {
  const anyPublished = groupSets.some((s) => s.status === "published");

  if (prominent && anyPublished) {
    return (
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Group standings</h2>
          <p className="mt-1 text-sm text-sd-muted">
            Ranked scores from each group battle
          </p>
        </div>
        <StandingsGrid
          area={area}
          scheduleConfig={scheduleConfig}
          bracket={bracket}
          groupSets={groupSets}
          publicScores={publicScores}
        />
      </section>
    );
  }

  return (
    <SdCollapsibleSection
      title="Group standings"
      subtitle={
        anyPublished
          ? "Ranked scores from each group battle"
          : "Opens when group results are published"
      }
      defaultOpen={defaultOpen}
    >
      <StandingsGrid
        area={area}
        scheduleConfig={scheduleConfig}
        bracket={bracket}
        groupSets={groupSets}
        publicScores={publicScores}
      />
    </SdCollapsibleSection>
  );
}
