"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildCalendarDayAreaCards,
  findBranchOnCalendarDay,
  type SdCalendarAreaBracket,
  type SdCalendarBranchMatch,
  type SdCalendarDayAreaCard,
} from "@/lib/products/sword-duels/calendar-day-battles";
import type { SdAreaSchedulesConfig } from "@/lib/products/sword-duels/area-schedules";

interface Props {
  selectedDay: Date;
  brackets: SdCalendarAreaBracket[];
  schedules: SdAreaSchedulesConfig;
}

const SET_COLUMN_STYLES = {
  group_a: {
    header: "bg-emerald-600/90 text-white",
    body: "bg-emerald-950/35",
    border: "border-emerald-500/25",
  },
  group_b: {
    header: "bg-cyan-700/90 text-white",
    body: "bg-cyan-950/35",
    border: "border-cyan-500/25",
  },
  area_final: {
    header: "bg-lime-600/85 text-sd-deep",
    body: "bg-lime-950/25",
    border: "border-lime-400/30",
  },
} as const;

function BranchMatchCard({ match }: { match: SdCalendarBranchMatch }) {
  return (
    <div className="rounded-xl border border-lime-400/40 bg-gradient-to-r from-lime-400/15 to-cyan-400/10 p-4 ring-1 ring-lime-400/25">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lime-200/90">
        Your branch
      </p>
      <p className="mt-1 text-lg font-semibold text-white">{match.branch.name}</p>
      <dl className="mt-3 grid gap-1 text-sm text-emerald-100/90 sm:grid-cols-2">
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-sd-muted">Area</dt>
          <dd className="font-medium text-white">{match.area}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-sd-muted">Battle</dt>
          <dd className="font-medium text-white">{match.setLabel}</dd>
        </div>
        {match.timeLabel && (
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-sd-muted">Time</dt>
            <dd className="font-medium text-white">{match.timeLabel}</dd>
          </div>
        )}
        {match.host && (
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-sd-muted">Host</dt>
            <dd className="font-medium text-white">{match.host}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

function SetColumn({
  set,
  highlightBranchId,
}: {
  set: SdCalendarDayAreaCard["sets"][number];
  highlightBranchId?: string;
}) {
  const styles = SET_COLUMN_STYLES[set.setType];

  if (set.setType === "area_final") {
    return (
      <div
        className={`overflow-hidden rounded-lg border ${styles.border} ${styles.body}`}
      >
        <div
          className={`px-3 py-2 text-center text-xs font-bold uppercase tracking-wider ${styles.header}`}
        >
          {set.setLabel}
          {set.timeLabel ? ` · ${set.timeLabel}` : ""}
        </div>
        <p className="px-3 py-4 text-center text-sm text-emerald-100/90">
          Spot 1 vs Spot 2 — area representative battle
        </p>
        {set.host && (
          <p className="border-t border-lime-400/20 px-3 py-2 text-center text-xs text-sd-muted">
            Host: <span className="text-white">{set.host}</span>
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex min-h-0 flex-col overflow-hidden rounded-lg border ${styles.border}`}
    >
      <div
        className={`px-3 py-2 text-center text-xs font-bold uppercase tracking-wider ${styles.header}`}
      >
        {set.setLabel}
        {set.timeLabel ? ` · ${set.timeLabel}` : ""}
      </div>
      <ol className={`flex-1 divide-y divide-white/5 ${styles.body} px-1 py-1`}>
        {set.branches.map((branch, i) => {
          const highlighted = highlightBranchId === branch.id;
          return (
            <li
              key={branch.id}
              className={`flex gap-2 px-2 py-1.5 text-sm ${
                highlighted
                  ? "rounded-md bg-lime-400/20 font-semibold text-lime-100 ring-1 ring-lime-400/50"
                  : "text-emerald-50/95"
              }`}
            >
              <span className="w-5 shrink-0 tabular-nums text-sd-muted/70">
                {i + 1}.
              </span>
              <span className="min-w-0 leading-snug">{branch.name}</span>
            </li>
          );
        })}
      </ol>
      {set.host && (
        <p className="border-t border-white/10 bg-sd-deep/40 px-3 py-2 text-center text-xs text-sd-muted">
          Host: <span className="text-white">{set.host}</span>
        </p>
      )}
    </div>
  );
}

function AreaBattleCard({
  card,
  highlightBranchId,
}: {
  card: SdCalendarDayAreaCard;
  highlightBranchId?: string;
}) {
  const groupSets = card.sets.filter((s) => s.setType !== "area_final");
  const finalSet = card.sets.find((s) => s.setType === "area_final");

  return (
    <article className="overflow-hidden rounded-xl border border-emerald-500/20 bg-sd-deep/30 shadow-lg">
      <header className="bg-emerald-700/90 px-4 py-2.5 text-center">
        <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-white">
          {card.area}
        </h3>
      </header>

      {groupSets.length > 0 && (
        <div
          className={`grid gap-0 border-b border-emerald-500/15 ${
            groupSets.length > 1 ? "sm:grid-cols-2" : "grid-cols-1"
          }`}
        >
          {groupSets.map((set) => (
            <SetColumn
              key={set.setType}
              set={set}
              highlightBranchId={highlightBranchId}
            />
          ))}
        </div>
      )}

      {finalSet && (
        <div className="p-3">
          <SetColumn set={finalSet} highlightBranchId={highlightBranchId} />
        </div>
      )}
    </article>
  );
}

export function SdCalendarDayBattles({
  selectedDay,
  brackets,
  schedules,
}: Props) {
  const [branchQuery, setBranchQuery] = useState("");

  useEffect(() => {
    setBranchQuery("");
  }, [selectedDay.getTime()]);

  const areaCards = useMemo(
    () => buildCalendarDayAreaCards(selectedDay, brackets, schedules),
    [selectedDay, brackets, schedules]
  );

  const branchMatch = useMemo(
    () => findBranchOnCalendarDay(branchQuery, areaCards),
    [branchQuery, areaCards]
  );

  if (areaCards.length === 0) {
    return (
      <div className="space-y-3">
        <div className="sd-inset rounded-lg p-3">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200/90">
              Find my branch
            </span>
            <input
              type="search"
              value={branchQuery}
              onChange={(e) => setBranchQuery(e.target.value)}
              placeholder="Type branch name (e.g. SM City Baguio)"
              className="sd-input mt-2 w-full rounded-lg px-3 py-2.5 text-sm"
              autoComplete="off"
              disabled
            />
          </label>
        </div>
        <p className="text-sm text-sd-muted">
          No area group battles on this day. Pick another date on the calendar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="sd-inset rounded-lg p-3">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200/90">
            Find my branch
          </span>
          <input
            type="search"
            value={branchQuery}
            onChange={(e) => setBranchQuery(e.target.value)}
            placeholder="Type branch name (e.g. SM City Baguio)"
            className="sd-input mt-2 w-full rounded-lg px-3 py-2.5 text-sm"
            autoComplete="off"
          />
        </label>
        <p className="mt-2 text-xs text-sd-muted">
          See which area, set, and time your branch battles on this day.
        </p>
      </div>

      {branchMatch && <BranchMatchCard match={branchMatch} />}

      {branchQuery.trim().length >= 2 && !branchMatch && (
        <p className="text-sm text-amber-100/90">
          No branch match on this day — try another date or check spelling.
        </p>
      )}

      <div className="space-y-4">
        {areaCards.map((card) => (
          <AreaBattleCard
            key={card.area}
            card={card}
            highlightBranchId={branchMatch?.branch.id}
          />
        ))}
      </div>
    </div>
  );
}
