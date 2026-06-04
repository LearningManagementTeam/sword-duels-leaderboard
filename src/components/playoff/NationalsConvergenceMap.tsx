import {
  buildNationalsConvergenceMap,
  REGION_PLAYOFF_ACCENTS,
  type NationalsChampionSlot,
} from "@/lib/playoff-map";
import { REGION_LABELS, REGIONS, type Region } from "@/lib/scoring-config";
import type { StandingRow } from "@/lib/types";

interface Props {
  rows: StandingRow[];
  latestPublishedRound: number;
  tvMode?: boolean;
}

function championDisplayName(slot: NationalsChampionSlot): string {
  if (slot.status === "placeholder") return slot.branch_name;
  return slot.representative_1?.trim() || slot.branch_name;
}

function championInitials(slot: NationalsChampionSlot): string {
  const name = championDisplayName(slot);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function ChampionNode({
  slot,
  tvMode = false,
}: {
  slot: NationalsChampionSlot;
  tvMode?: boolean;
}) {
  const accent = REGION_PLAYOFF_ACCENTS[slot.region];
  const isPlaceholder = slot.status === "placeholder";
  const display = championDisplayName(slot);
  const slotInitials = isPlaceholder
    ? REGION_LABELS[slot.region].slice(0, 2).toUpperCase()
    : championInitials(slot);

  const shell = slot.isOverallChampion
    ? `bg-sd-surface text-sd-deep ring-2 ${accent.glow}`
    : isPlaceholder
      ? "border border-dashed border-emerald-500/25 bg-sd-deep/30 text-sd-muted/50"
      : "bg-sd-surface text-sd-deep ring-1 ring-emerald-500/30";

  return (
    <div className="flex flex-col items-center gap-2">
      <span
        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${accent.badge}`}
      >
        {REGION_LABELS[slot.region]}
      </span>
      <div
        className={`flex w-full max-w-[11rem] items-center gap-2 rounded-lg px-3 py-2.5 ${shell} ${
          tvMode ? "max-w-[14rem] py-3" : ""
        }`}
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-900/25 text-sm font-bold text-emerald-200 ${
            slot.isOverallChampion ? "bg-sd-gold text-sd-deep" : ""
          }`}
        >
          {slot.isOverallChampion ? "★" : slotInitials}
        </span>
        <div className="min-w-0 flex-1">
          <p className={`truncate font-semibold ${tvMode ? "text-base" : "text-sm"}`}>
            {display}
          </p>
          {!isPlaceholder && (
            <p className="truncate text-[10px] text-emerald-900/70">
              {slot.total_points} pts total
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ConvergenceSvg({ regions }: { regions: Region[] }) {
  return (
    <svg
      viewBox="0 0 320 120"
      className="mx-auto hidden h-16 w-full max-w-lg sm:block"
      aria-hidden
    >
      {regions.map((region, i) => {
        const x = 40 + i * 120;
        const colors = {
          luzon: "#34d399",
          ncr: "#e879f9",
          vismin: "#a3e635",
        };
        return (
          <path
            key={region}
            d={`M ${x} 20 C ${x} 60, 160 70, 160 100`}
            fill="none"
            stroke={colors[region]}
            strokeWidth="2"
            opacity="0.55"
          />
        );
      })}
    </svg>
  );
}

export function NationalsConvergenceMap({
  rows,
  latestPublishedRound,
  tvMode = false,
}: Props) {
  const model = buildNationalsConvergenceMap({ rows, latestPublishedRound });

  return (
    <section className="sd-neon-panel space-y-5 p-4 sm:p-6">
      <div>
        <div className="inline-flex items-stretch overflow-hidden rounded-lg shadow-lg">
          <span className="bg-sd-gold px-4 py-1.5 text-sm font-black uppercase tracking-widest text-sd-deep">
            The Nationals
          </span>
          <span className="bg-emerald-500/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-100 ring-1 ring-emerald-400/40 ring-inset">
            3 CHAMPIONS
          </span>
        </div>
        <h2
          className={`mt-2 font-bold text-white ${tvMode ? "text-2xl" : "text-lg"}`}
        >
          Road to the championship
        </h2>
        <p className={`text-sd-muted/80 ${tvMode ? "text-sm" : "text-xs"}`}>
          Regional July winners converge for The Nationals — cumulative scoring
          across finals rounds.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {model.regionalChampions.map((slot) => (
          <ChampionNode key={slot.region} slot={slot} tvMode={tvMode} />
        ))}
      </div>

      <ConvergenceSvg regions={[...REGIONS]} />

      <div className="flex flex-col items-center gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-sd-muted/70">
          Overall champion
        </p>
        {model.finalsChampion && model.finalsChampion.status !== "placeholder" ? (
          <ChampionNode slot={model.finalsChampion} tvMode={tvMode} />
        ) : (
          <div className="sd-inset w-full max-w-xs rounded-xl px-4 py-6 text-center text-sm text-sd-muted/70">
            {latestPublishedRound > 0
              ? "Championship still in progress"
              : "Crown fills in as Nationals rounds publish"}
          </div>
        )}
      </div>
    </section>
  );
}
