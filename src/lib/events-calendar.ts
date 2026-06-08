import type { EventScheduleProgram } from "@/lib/event-schedule";

export const EVENTS_CALENDAR_SLUG = "events_calendar";

export type CalendarEventKind =
  | "preparation"
  | "branch_duels"
  | "branch_selection"
  | "area_duels"
  | "regional_duel"
  | "custom";

export interface CalendarEvent {
  id: string;
  kind: CalendarEventKind;
  title: string;
  /** ISO date (YYYY-MM-DD) or datetime with offset */
  startAt: string;
  /** Inclusive end date for multi-day blocks (YYYY-MM-DD) */
  endAt?: string;
  timeLabel?: string;
  areas?: string[];
  setLabel?: string;
  description?: string;
  published: boolean;
  program: EventScheduleProgram;
}

export interface EventsCalendarConfig {
  events: CalendarEvent[];
}

export const DEFAULT_EVENTS_CALENDAR: EventsCalendarConfig = {
  events: [],
};

const KINDS = new Set<CalendarEventKind>([
  "preparation",
  "branch_duels",
  "branch_selection",
  "area_duels",
  "regional_duel",
  "custom",
]);

const PROGRAMS = new Set<EventScheduleProgram>([
  "sword_duels",
  "national_competitions",
]);

export const CALENDAR_KIND_LABELS: Record<CalendarEventKind, string> = {
  preparation: "Preparation",
  branch_duels: "Branch Duels",
  branch_selection: "Branch Selection",
  area_duels: "Area Duels",
  regional_duel: "Regional Duel",
  custom: "Event",
};

export const CALENDAR_KIND_STYLES: Record<
  CalendarEventKind,
  { chip: string; glow: string; dot: string }
> = {
  preparation: {
    chip: "bg-emerald-500/20 text-emerald-100 ring-emerald-400/35",
    glow: "shadow-[0_0_20px_rgb(52_211_153/0.25)]",
    dot: "bg-emerald-400",
  },
  branch_duels: {
    chip: "bg-cyan-500/20 text-cyan-100 ring-cyan-400/35",
    glow: "shadow-[0_0_20px_rgb(34_211_238/0.25)]",
    dot: "bg-cyan-400",
  },
  branch_selection: {
    chip: "bg-fuchsia-500/20 text-fuchsia-100 ring-fuchsia-400/35",
    glow: "shadow-[0_0_20px_rgb(217_70_239/0.25)]",
    dot: "bg-fuchsia-400",
  },
  area_duels: {
    chip: "bg-lime-500/20 text-lime-100 ring-lime-400/35",
    glow: "shadow-[0_0_24px_rgb(163_230_53/0.3)]",
    dot: "bg-lime-400",
  },
  regional_duel: {
    chip: "bg-amber-500/20 text-amber-100 ring-amber-400/40",
    glow: "shadow-[0_0_28px_rgb(251_191_36/0.35)]",
    dot: "bg-amber-400",
  },
  custom: {
    chip: "bg-violet-500/20 text-violet-100 ring-violet-400/35",
    glow: "shadow-[0_0_16px_rgb(167_139_250/0.2)]",
    dot: "bg-violet-400",
  },
};

function parseDayKey(iso: string): number {
  const datePart = iso.slice(0, 10);
  const [y, m, d] = datePart.split("-").map(Number);
  return y * 10000 + m * 100 + d;
}

export function parseEventsCalendarBody(raw: unknown): EventsCalendarConfig {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_EVENTS_CALENDAR };
  }
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.events)) {
    return { ...DEFAULT_EVENTS_CALENDAR };
  }

  const events: CalendarEvent[] = [];
  for (const row of o.events) {
    if (!row || typeof row !== "object") continue;
    const e = row as Record<string, unknown>;
    const id = typeof e.id === "string" ? e.id.trim() : "";
    const title = typeof e.title === "string" ? e.title.trim() : "";
    const startAt =
      typeof e.startAt === "string" ? e.startAt.trim() : "";
    if (!id || !title || !startAt) continue;
    if (Number.isNaN(Date.parse(startAt.length === 10 ? `${startAt}T00:00:00+08:00` : startAt))) {
      continue;
    }

    const kind = KINDS.has(e.kind as CalendarEventKind)
      ? (e.kind as CalendarEventKind)
      : "custom";
    const program = PROGRAMS.has(e.program as EventScheduleProgram)
      ? (e.program as EventScheduleProgram)
      : "sword_duels";

    const endAt =
      typeof e.endAt === "string" && e.endAt.trim()
        ? e.endAt.trim()
        : undefined;

    events.push({
      id,
      kind,
      title,
      startAt,
      endAt,
      timeLabel:
        typeof e.timeLabel === "string" && e.timeLabel.trim()
          ? e.timeLabel.trim()
          : undefined,
      areas: Array.isArray(e.areas)
        ? e.areas
            .filter(
              (a): a is string => typeof a === "string" && a.trim().length > 0
            )
            .map((a) => a.trim())
        : undefined,
      setLabel:
        typeof e.setLabel === "string" && e.setLabel.trim()
          ? e.setLabel.trim()
          : undefined,
      description:
        typeof e.description === "string" && e.description.trim()
          ? e.description.trim()
          : undefined,
      published: e.published !== false,
      program,
    });
  }

  return { events };
}

export function publishedCalendarEvents(
  config: EventsCalendarConfig
): CalendarEvent[] {
  return config.events.filter((e) => e.published);
}

export function eventOccursOnDate(event: CalendarEvent, day: Date): boolean {
  const dayKey =
    day.getFullYear() * 10000 + (day.getMonth() + 1) * 100 + day.getDate();
  const startKey = parseDayKey(event.startAt);
  if (event.endAt) {
    const endKey = parseDayKey(event.endAt);
    return dayKey >= startKey && dayKey <= endKey;
  }
  return dayKey === startKey;
}

export function eventsOnDate(
  events: CalendarEvent[],
  day: Date
): CalendarEvent[] {
  return events
    .filter((e) => eventOccursOnDate(e, day))
    .sort((a, b) => eventSortTime(a) - eventSortTime(b));
}

function eventSortTime(event: CalendarEvent): number {
  const iso =
    event.startAt.length === 10
      ? `${event.startAt}T08:00:00+08:00`
      : event.startAt;
  return new Date(iso).getTime();
}

export function eventEndTime(event: CalendarEvent): number {
  if (event.endAt) {
    return new Date(`${event.endAt}T23:59:59+08:00`).getTime();
  }
  const iso =
    event.startAt.length === 10
      ? `${event.startAt}T23:59:59+08:00`
      : event.startAt;
  return new Date(iso).getTime();
}

export function nextCalendarEvent(
  events: CalendarEvent[],
  now = Date.now()
): CalendarEvent | null {
  const upcoming = events
    .filter((e) => eventEndTime(e) >= now)
    .sort((a, b) => eventSortTime(a) - eventSortTime(b));
  return upcoming[0] ?? null;
}

export function formatCalendarDate(iso: string): string {
  const d = new Date(
    iso.length === 10 ? `${iso}T12:00:00+08:00` : iso
  );
  return d.toLocaleDateString("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatCalendarDateRange(event: CalendarEvent): string {
  if (event.endAt && event.endAt !== event.startAt.slice(0, 10)) {
    const start = formatCalendarDate(event.startAt);
    const end = formatCalendarDate(event.endAt);
    return `${start} – ${end}`;
  }
  return formatCalendarDate(event.startAt);
}

export function formatCalendarEventTitle(event: CalendarEvent): string {
  if (event.areas?.length === 1) {
    return `${event.areas[0]} · ${event.title}`;
  }
  if (event.areas && event.areas.length > 1) {
    return `${event.title} (${event.areas.length} areas)`;
  }
  return event.title;
}

export function countdownToEvent(
  event: CalendarEvent,
  now = Date.now()
): { label: string; urgent: boolean } | null {
  const target = eventSortTime(event);
  const diff = target - now;
  if (diff <= 0) return null;

  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

  if (days > 0) {
    return { label: `${days}d ${hours}h`, urgent: days <= 2 };
  }
  if (hours > 0) {
    return { label: `${hours}h ${minutes}m`, urgent: true };
  }
  return { label: `${minutes}m`, urgent: true };
}

const BRANCH_SCHEDULE_GROUPS = [
  {
    areas: ["Area 1", "Area 2", "Area 7", "Area 10"],
    setsDate: "2026-06-15",
    setsTimeLabel: "10:00 AM & 11:00 AM",
    setsAt: "2026-06-15T10:00:00+08:00",
    selectionAt: "2026-06-22T10:00:00+08:00",
    selectionTimeLabel: "10:00 AM",
  },
  {
    areas: ["Area 3", "Area 5", "Area 8", "Area 11"],
    setsDate: "2026-06-15",
    setsTimeLabel: "2:00 PM & 3:00 PM",
    setsAt: "2026-06-15T14:00:00+08:00",
    selectionAt: "2026-06-22T11:00:00+08:00",
    selectionTimeLabel: "11:00 AM",
  },
  {
    areas: ["Area 4", "Area 6", "Area 9", "Area 12"],
    setsDate: "2026-06-17",
    setsTimeLabel: "10:00 AM & 11:00 AM",
    setsAt: "2026-06-17T10:00:00+08:00",
    selectionAt: "2026-06-22T14:00:00+08:00",
    selectionTimeLabel: "2:00 PM",
  },
  {
    areas: ["Area 13", "Area 14", "Area 15"],
    setsDate: "2026-06-17",
    setsTimeLabel: "2:00 PM & 3:00 PM",
    setsAt: "2026-06-17T14:00:00+08:00",
    selectionAt: "2026-06-22T15:00:00+08:00",
    selectionTimeLabel: "3:00 PM",
  },
] as const;

/** Initial 2026 Branch Duels schedule from operator spreadsheet. */
export function buildDefaultEventsCalendar2026(): EventsCalendarConfig {
  const macro: CalendarEvent[] = [
    {
      id: "macro-prep-jun-8",
      kind: "preparation",
      title: "Sword Duel Preparations",
      startAt: "2026-06-08",
      endAt: "2026-06-12",
      published: true,
      program: "sword_duels",
    },
    {
      id: "macro-branch-jun-15",
      kind: "branch_duels",
      title: "Branch Duels",
      startAt: "2026-06-15",
      timeLabel: "10:00 & 11:00 AM · 2:00 & 3:00 PM",
      published: true,
      program: "sword_duels",
    },
    {
      id: "macro-branch-jun-17",
      kind: "branch_duels",
      title: "Branch Duels",
      startAt: "2026-06-17",
      timeLabel: "10:00 & 11:00 AM · 2:00 & 3:00 PM",
      published: true,
      program: "sword_duels",
    },
    {
      id: "macro-selection-jun-22",
      kind: "branch_selection",
      title: "Branch Selections",
      startAt: "2026-06-22",
      timeLabel: "10:00 AM – 3:00 PM",
      published: true,
      program: "sword_duels",
    },
    {
      id: "macro-prep-jun-29",
      kind: "preparation",
      title: "Preparation",
      startAt: "2026-06-29",
      endAt: "2026-06-30",
      published: true,
      program: "sword_duels",
    },
    {
      id: "macro-prep-jul-1",
      kind: "preparation",
      title: "Preparation",
      startAt: "2026-07-01",
      endAt: "2026-07-03",
      published: true,
      program: "sword_duels",
    },
    {
      id: "macro-area-jul-6",
      kind: "area_duels",
      title: "Area Duels",
      startAt: "2026-07-06",
      published: true,
      program: "sword_duels",
    },
    {
      id: "macro-area-jul-8",
      kind: "area_duels",
      title: "Area Duels",
      startAt: "2026-07-08",
      published: true,
      program: "sword_duels",
    },
    {
      id: "macro-area-jul-13",
      kind: "area_duels",
      title: "Area Duels",
      startAt: "2026-07-13",
      published: true,
      program: "sword_duels",
    },
    {
      id: "macro-prep-jul-20",
      kind: "preparation",
      title: "Preparation",
      startAt: "2026-07-20",
      endAt: "2026-07-24",
      published: true,
      program: "sword_duels",
    },
    {
      id: "macro-regional-jul-27",
      kind: "regional_duel",
      title: "Regional Duel",
      startAt: "2026-07-27",
      published: true,
      program: "sword_duels",
    },
  ];

  const areaEvents: CalendarEvent[] = [];
  for (const group of BRANCH_SCHEDULE_GROUPS) {
    for (const area of group.areas) {
      const slug = area.toLowerCase().replace(/\s+/g, "-");
      areaEvents.push({
        id: `${slug}-sets`,
        kind: "branch_duels",
        title: "Set 1 & 2",
        setLabel: "SET 1 & 2",
        startAt: group.setsAt,
        timeLabel: group.setsTimeLabel,
        areas: [area],
        published: true,
        program: "sword_duels",
      });
      areaEvents.push({
        id: `${slug}-selection`,
        kind: "branch_selection",
        title: "Area Selection",
        setLabel: "AREA SELECTION",
        startAt: group.selectionAt,
        timeLabel: group.selectionTimeLabel,
        areas: [area],
        published: true,
        program: "sword_duels",
      });
    }
  }

  return { events: [...macro, ...areaEvents] };
}

export function newCalendarEvent(
  partial?: Partial<CalendarEvent>
): CalendarEvent {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const startAt = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

  return {
    id: crypto.randomUUID(),
    kind: "custom",
    title: "New event",
    startAt,
    published: false,
    program: "sword_duels",
    ...partial,
  };
}
