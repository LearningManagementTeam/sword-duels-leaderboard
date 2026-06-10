"use client";

import { useMemo, useState } from "react";
import {
  CALENDAR_KIND_LABELS,
  CALENDAR_KIND_STYLES,
  countdownToEvent,
  eventsOnDate,
  formatCalendarDateRange,
  nextCalendarEvent,
  resolveCalendarEventTimeLabel,
  type CalendarEvent,
  type CalendarEventKind,
} from "@/lib/events-calendar";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface Props {
  events: CalendarEvent[];
  mode?: "public" | "admin";
  selectedDay?: Date | null;
  onSelectDay?: (day: Date | null) => void;
  initialMonth?: { year: number; month: number };
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function EventCard({
  event,
  compact,
}: {
  event: CalendarEvent;
  compact?: boolean;
}) {
  const styles = CALENDAR_KIND_STYLES[event.kind];
  const timeLabel = resolveCalendarEventTimeLabel(event);
  return (
    <article
      className={`rounded-xl border border-emerald-500/15 bg-sd-deep/40 p-3 ring-1 ring-inset ring-emerald-500/10 ${styles.glow}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1 ring-inset ${styles.chip}`}
        >
          {CALENDAR_KIND_LABELS[event.kind]}
        </span>
        {event.setLabel && (
          <span className="text-[9px] font-semibold uppercase tracking-wider text-sd-muted/70">
            {event.setLabel}
          </span>
        )}
      </div>
      <h3
        className={`mt-2 font-semibold text-white ${compact ? "text-sm" : "text-base"}`}
      >
        {event.title}
      </h3>
      <p className="mt-1 text-xs text-sd-muted">
        {formatCalendarDateRange(event)}
        {timeLabel ? ` · ${timeLabel}` : ""}
      </p>
      {event.areas && event.areas.length > 0 && (
        <p className="mt-2 text-xs text-cyan-100/80">
          {event.areas.join(" · ")}
        </p>
      )}
      {event.description && (
        <p className="mt-2 text-xs text-sd-muted/90">{event.description}</p>
      )}
    </article>
  );
}

export function EventsCalendarInteractive({
  events,
  mode = "public",
  selectedDay: controlledDay,
  onSelectDay,
  initialMonth,
}: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(
    initialMonth?.year ?? today.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    initialMonth?.month ?? today.getMonth()
  );
  const [internalDay, setInternalDay] = useState<Date | null>(today);

  const selectedDay =
    controlledDay !== undefined ? controlledDay : internalDay;

  function pickDay(day: Date) {
    if (onSelectDay) onSelectDay(day);
    else setInternalDay(day);
  }

  const monthLabel = `${MONTH_NAMES[viewMonth]} ${viewYear}`;

  const gridDays = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startPad; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(viewYear, viewMonth, d));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewYear, viewMonth]);

  const dayEvents = selectedDay ? eventsOnDate(events, selectedDay) : [];
  const nextEvent = nextCalendarEvent(events);
  const nextTimeLabel = nextEvent
    ? resolveCalendarEventTimeLabel(nextEvent)
    : undefined;
  const countdown = nextEvent ? countdownToEvent(nextEvent) : null;

  const kindCounts = useMemo(() => {
    const counts = new Map<CalendarEventKind, number>();
    for (const e of events) {
      counts.set(e.kind, (counts.get(e.kind) ?? 0) + 1);
    }
    return counts;
  }, [events]);

  function shiftMonth(delta: number) {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  return (
    <div className="space-y-6">
      {mode === "public" && nextEvent && countdown && (
        <div
          className={`sd-neon-panel flex flex-wrap items-center justify-between gap-4 p-4 ${
            countdown.urgent
              ? "border-fuchsia-500/30 bg-gradient-to-r from-fuchsia-950/40 to-cyan-950/30"
              : ""
          }`}
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lime-300/80">
              Next up
            </p>
            <p className="mt-1 text-lg font-semibold text-white">
              {nextEvent.title}
            </p>
            <p className="text-sm text-sd-muted">
              {formatCalendarDateRange(nextEvent)}
              {nextTimeLabel ? ` · ${nextTimeLabel}` : ""}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-sd-muted">
              Countdown
            </p>
            <p
              className={`font-mono text-2xl font-bold tabular-nums ${
                countdown.urgent ? "text-fuchsia-300" : "text-lime-300"
              }`}
            >
              {countdown.label}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(
          [
            "preparation",
            "branch_duels",
            "branch_selection",
            "area_duels",
            "regional_duel",
          ] as CalendarEventKind[]
        )
          .filter((k) => (kindCounts.get(k) ?? 0) > 0)
          .map((kind) => (
            <span
              key={kind}
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset ${CALENDAR_KIND_STYLES[kind].chip}`}
            >
              {CALENDAR_KIND_LABELS[kind]}
            </span>
          ))}
      </div>

      <div className="sd-neon-panel overflow-hidden p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="sd-glass rounded-lg px-3 py-1.5 text-sm text-sd-muted hover:text-white"
            aria-label="Previous month"
          >
            ←
          </button>
          <h2 className="text-lg font-semibold text-white">{monthLabel}</h2>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="sd-glass rounded-lg px-3 py-1.5 text-sm text-sd-muted hover:text-white"
            aria-label="Next month"
          >
            →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wider text-sd-muted/70">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {gridDays.map((day, i) => {
            if (!day) {
              return (
                <div
                  key={`empty-${i}`}
                  className="min-h-[4.5rem] rounded-lg bg-sd-deep/20"
                  aria-hidden
                />
              );
            }

            const onDay = eventsOnDate(events, day);
            const isToday = sameDay(day, today);
            const isSelected = selectedDay && sameDay(day, selectedDay);
            const hasBattle = onDay.some(
              (e) =>
                e.kind === "branch_duels" ||
                e.kind === "area_duels" ||
                e.kind === "regional_duel"
            );
            const hasPrep = onDay.some((e) => e.kind === "preparation");

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => pickDay(day)}
                className={`relative min-h-[4.5rem] rounded-lg border p-1.5 text-left transition ${
                  isSelected
                    ? "border-lime-400/50 bg-lime-400/10 ring-1 ring-lime-400/30"
                    : isToday
                      ? "border-cyan-400/40 bg-cyan-400/5"
                      : "border-emerald-500/10 bg-sd-deep/30 hover:border-emerald-400/30 hover:bg-emerald-500/5"
                } ${hasBattle ? CALENDAR_KIND_STYLES.branch_duels.glow : ""}`}
              >
                <span
                  className={`text-sm font-semibold ${
                    isToday ? "text-cyan-200" : "text-white"
                  }`}
                >
                  {day.getDate()}
                </span>
                <div className="mt-1 flex flex-wrap gap-0.5">
                  {onDay.slice(0, 4).map((e) => (
                    <span
                      key={e.id}
                      className={`h-1.5 w-1.5 rounded-full ${CALENDAR_KIND_STYLES[e.kind].dot}`}
                      title={e.title}
                    />
                  ))}
                </div>
                {hasPrep && onDay.length === 1 && (
                  <span className="mt-0.5 block truncate text-[8px] uppercase tracking-wide text-emerald-300/80">
                    Prep
                  </span>
                )}
                {hasBattle && (
                  <span className="mt-0.5 block truncate text-[8px] font-bold uppercase tracking-wide text-cyan-200/90">
                    Duel
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="sd-neon-panel p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-white">
          {selectedDay
            ? selectedDay.toLocaleDateString("en-PH", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })
            : "Pick a day"}
        </h2>
        {dayEvents.length === 0 ? (
          <p className="mt-3 text-sm text-sd-muted">
            No events on this day.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {dayEvents.map((event) => (
              <li key={event.id}>
                <EventCard event={event} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
