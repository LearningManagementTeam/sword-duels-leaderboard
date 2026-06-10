import type { CalendarEvent, EventsCalendarConfig } from "@/lib/events-calendar";
import { areaSlug } from "./area-groups";
import type { SdAreaScheduleDates } from "./area-schedules";
import { resolveHostForSetFromDates, SET_DATE_KEYS } from "./area-schedules";
import { formatScheduleTimeLabel } from "./area-schedule-input";
import { SD_SET_FLOW } from "./scoring-config";
import type { SdAreaSetType } from "./types";

const SET_LABELS: Record<SdAreaSetType, string> = {
  group_a: "SET 1",
  group_b: "SET 2",
  area_final: "AREA FINAL",
};

export function areaScheduleCalendarEventId(
  area: string,
  setType: SdAreaSetType
): string {
  return `sd-battle-${areaSlug(area)}-${setType.replace(/_/g, "-")}`;
}

export function calendarEventIdsForArea(area: string): string[] {
  return SD_SET_FLOW.map((step) => areaScheduleCalendarEventId(area, step.key));
}

export function calendarEventsForAreaSchedule(
  area: string,
  dates: SdAreaScheduleDates
): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const step of SD_SET_FLOW) {
    const key = SET_DATE_KEYS[step.key];
    const startAt = dates[key];
    if (!startAt || typeof startAt !== "string") continue;

    const host = resolveHostForSetFromDates(dates, step.key);

    events.push({
      id: areaScheduleCalendarEventId(area, step.key),
      kind: "area_duels",
      title: step.title,
      setLabel: SET_LABELS[step.key],
      startAt,
      timeLabel: formatScheduleTimeLabel(startAt),
      areas: [area],
      description: host ? `Host / Trainer: ${host}` : undefined,
      published: true,
      program: "sword_duels",
    });
  }

  return events;
}

/** Replace auto-synced calendar rows for one area (clears removed battle times). */
export function mergeAreaSchedulesIntoCalendar(
  calendar: EventsCalendarConfig,
  area: string,
  dates: SdAreaScheduleDates
): EventsCalendarConfig {
  const syncedIds = new Set(calendarEventIdsForArea(area));
  const remaining = calendar.events.filter((e) => !syncedIds.has(e.id));
  const synced = calendarEventsForAreaSchedule(area, dates);

  return { events: [...remaining, ...synced] };
}

export function mergeAllAreaSchedulesIntoCalendar(
  calendar: EventsCalendarConfig,
  byArea: Record<string, SdAreaScheduleDates>
): EventsCalendarConfig {
  let result = calendar;
  for (const [area, dates] of Object.entries(byArea)) {
    result = mergeAreaSchedulesIntoCalendar(result, area, dates);
  }
  return result;
}
