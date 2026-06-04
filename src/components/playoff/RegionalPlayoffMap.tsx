import {
  buildJulyRegionalPlayoffMap,
  REGION_PLAYOFF_ACCENTS,
} from "@/lib/playoff-map";
import { REGION_LABELS, type Region } from "@/lib/scoring-config";
import type { StandingRow } from "@/lib/types";
import { PlayoffColumnConnectors } from "./PlayoffColumnConnectors";
import { PlayoffSlotCard } from "./PlayoffSlotCard";

interface Props {
  region: Region;
  rows: StandingRow[];
  latestPublishedRound: number;
  tvMode?: boolean;
}

function PlayoffMapGrid({
  model,
  tvMode = false,
}: {
  model: ReturnType<typeof buildJulyRegionalPlayoffMap>;
  tvMode?: boolean;
}) {
  return (
    <div
      className={`flex items-stretch gap-0 overflow-x-auto pb-2 ${
        tvMode ? "gap-1" : ""
      }`}
    >
      {model.columns.map((column, colIndex) => (
        <div key={column.id} className="flex min-w-0 shrink-0 items-stretch">
          <div
            className={`flex w-[9.5rem] flex-col sm:w-[10.5rem] ${
              tvMode ? "w-[11rem] sm:w-[12rem]" : ""
            }`}
          >
            <div className="mb-2 text-center">
              <p
                className={`font-semibold uppercase tracking-wider text-sd-glow ${
                  tvMode ? "text-xs" : "text-[10px]"
                }`}
              >
                {column.label}
              </p>
              <p className="text-[10px] text-sd-muted/65">{column.subtitle}</p>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              {column.isRevealed ? (
                column.slots.length > 0 ? (
                  column.slots.map((slot) => (
                    <PlayoffSlotCard
                      key={slot.branch_id ?? `${column.id}-${slot.rank}`}
                      slot={slot}
                      region={model.region}
                      tvMode={tvMode}
                      compact={column.id === 3}
                    />
                  ))
                ) : (
                  <div className="sd-inset flex flex-1 items-center justify-center rounded-lg px-2 py-6 text-center text-[10px] text-sd-muted/60">
                    Awaiting results
                  </div>
                )
              ) : (
                Array.from({ length: column.survivorCount }, (_, i) => (
                  <div
                    key={i}
                    className="min-h-[2.75rem] rounded-lg border border-dashed border-emerald-500/15 bg-sd-deep/20"
                  />
                ))
              )}
            </div>
          </div>
          {colIndex < model.columns.length - 1 && (
            <PlayoffColumnConnectors
              from={column}
              to={model.columns[colIndex + 1]}
              region={model.region}
            />
          )}
        </div>
      ))}
      <div className="sr-only">
        Playoff ladder for {REGION_LABELS[model.region]}: score-based cuts, not
        head-to-head matchups.
      </div>
    </div>
  );
}

export function RegionalPlayoffMap({
  region,
  rows,
  latestPublishedRound,
  tvMode = false,
}: Props) {
  const model = buildJulyRegionalPlayoffMap({
    region,
    rows,
    latestPublishedRound,
  });

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <div className="inline-flex items-stretch overflow-hidden rounded-lg shadow-lg">
          <span className="bg-sd-gold px-4 py-1.5 text-sm font-black uppercase tracking-widest text-sd-deep">
            Playoffs
          </span>
          <span
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider ring-1 ring-inset ${REGION_PLAYOFF_ACCENTS[region].badge}`}
          >
            {model.badgeLabel}
          </span>
        </div>
        <h2
          className={`mt-2 font-bold text-white ${tvMode ? "text-2xl" : "text-lg"}`}
        >
          {REGION_LABELS[region]} regional playoffs
        </h2>
        <p className={`text-sd-muted/80 ${tvMode ? "text-sm" : "text-xs"}`}>
          Top scores advance each round — not head-to-head matchups.
        </p>
      </div>
    </div>
  );

  if (tvMode) {
    return (
      <section className="sd-neon-panel space-y-4 p-5">
        {header}
        <PlayoffMapGrid model={model} tvMode />
      </section>
    );
  }

  return (
    <section className="sd-neon-panel space-y-4 p-4 sm:p-5">
      {header}
      <div className="hidden md:block">
        <PlayoffMapGrid model={model} />
      </div>
      <details className="md:hidden">
        <summary className="cursor-pointer list-none rounded-lg sd-btn-ghost px-4 py-2.5 text-center text-sm font-semibold text-white [&::-webkit-details-marker]:hidden">
          View playoff map
        </summary>
        <div className="mt-3 overflow-x-auto">
          <PlayoffMapGrid model={model} />
        </div>
      </details>
      {latestPublishedRound === 0 && rows.length > 0 && (
        <p className="text-xs text-sd-muted/60">
          Round 1 columns unlock after the first July round is published.
        </p>
      )}
    </section>
  );
}
