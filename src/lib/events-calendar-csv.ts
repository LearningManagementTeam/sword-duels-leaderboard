import {
  buildDefaultEventsCalendar2026,
  type CalendarEvent,
  type CalendarEventKind,
  type EventsCalendarConfig,
} from "@/lib/events-calendar";
import type { EventScheduleProgram } from "@/lib/event-schedule";
import { compareAreaNames } from "@/lib/products/sword-duels/area-groups";

export const EVENTS_CALENDAR_CSV_HEADER =
  "kind,title,start_date,end_date,start_time,time_label,area,set_label,published,program";

export interface EventsCalendarCsvResult {
  events: CalendarEvent[];
  errors: string[];
}

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

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

function parsePublished(value: string): boolean {
  const v = value.trim().toLowerCase();
  if (!v || v === "yes" || v === "true" || v === "1" || v === "y") return true;
  return false;
}

function parseDateOnly(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return undefined;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseTimeCell(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const m24 = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (m24) {
    const h = Number.parseInt(m24[1]!, 10);
    const min = m24[2]!;
    if (h >= 0 && h <= 23) {
      return `${String(h).padStart(2, "0")}:${min}`;
    }
  }
  const m12 = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(trimmed);
  if (m12) {
    let h = Number.parseInt(m12[1]!, 10);
    const min = m12[2]!;
    const mer = m12[3]!.toUpperCase();
    if (mer === "PM" && h < 12) h += 12;
    if (mer === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${min}`;
  }
  return undefined;
}

function combineStartAt(
  startDate: string,
  startTime?: string
): string {
  if (startTime) {
    return `${startDate}T${startTime}:00+08:00`;
  }
  return startDate;
}

function eventImportId(event: {
  kind: string;
  startAt: string;
  area?: string;
  title: string;
}): string {
  const datePart = event.startAt.slice(0, 10);
  const areaPart = event.area
    ? event.area.toLowerCase().replace(/\s+/g, "-")
    : "all";
  const titlePart = event.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 24);
  return `csv-${areaPart}-${event.kind}-${datePart}-${titlePart}`;
}

function escapeCsvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function startTimeFromEvent(event: CalendarEvent): string {
  if (event.startAt.length <= 10) return "";
  const d = new Date(event.startAt);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function sortCalendarEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => {
    const startA =
      a.startAt.length === 10
        ? `${a.startAt}T08:00:00+08:00`
        : a.startAt;
    const startB =
      b.startAt.length === 10
        ? `${b.startAt}T08:00:00+08:00`
        : b.startAt;
    const startCmp = new Date(startA).getTime() - new Date(startB).getTime();
    if (startCmp !== 0) return startCmp;

    const aMacro = !a.areas?.length;
    const bMacro = !b.areas?.length;
    if (aMacro && !bMacro) return -1;
    if (!aMacro && bMacro) return 1;

    const aArea = a.areas?.[0];
    const bArea = b.areas?.[0];
    if (aArea && bArea) {
      const areaCmp = compareAreaNames(aArea, bArea);
      if (areaCmp !== 0) return areaCmp;
    }

    return a.title.localeCompare(b.title);
  });
}

export function parseEventsCalendarCsv(text: string): EventsCalendarCsvResult {
  const errors: string[] = [];
  const events: CalendarEvent[] = [];
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { events, errors: ["CSV is empty."] };
  }

  const header = splitCsvLine(lines[0]!).map((h) => h.toLowerCase());
  const idx = (name: string) => header.indexOf(name);

  const kindIdx = idx("kind");
  const titleIdx = idx("title");
  const startDateIdx = idx("start_date");
  const endDateIdx = idx("end_date");
  const startTimeIdx = idx("start_time");
  const timeLabelIdx = idx("time_label");
  const areaIdx = idx("area");
  const setLabelIdx = idx("set_label");
  const publishedIdx = idx("published");
  const programIdx = idx("program");

  if (kindIdx === -1 || titleIdx === -1 || startDateIdx === -1) {
    return {
      events,
      errors: ['Header must include "kind", "title", and "start_date".'],
    };
  }

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]!);
    const kindRaw = cells[kindIdx]?.trim().toLowerCase() ?? "";
    const title = cells[titleIdx]?.trim() ?? "";
    const startDateRaw = cells[startDateIdx]?.trim() ?? "";

    if (!title) {
      errors.push(`Row ${i + 1}: missing title.`);
      continue;
    }

    if (!KINDS.has(kindRaw as CalendarEventKind)) {
      errors.push(`Row ${i + 1}: invalid kind "${kindRaw}".`);
      continue;
    }

    const startDate = parseDateOnly(startDateRaw);
    if (!startDate) {
      errors.push(`Row ${i + 1}: invalid start_date for "${title}".`);
      continue;
    }

    const endDateRaw = endDateIdx >= 0 ? cells[endDateIdx]?.trim() : "";
    const endDate = endDateRaw ? parseDateOnly(endDateRaw) : undefined;
    if (endDateRaw && !endDate) {
      errors.push(`Row ${i + 1}: invalid end_date for "${title}".`);
      continue;
    }

    const startTimeRaw =
      startTimeIdx >= 0 ? cells[startTimeIdx]?.trim() ?? "" : "";
    const startTime = startTimeRaw ? parseTimeCell(startTimeRaw) : undefined;
    if (startTimeRaw && !startTime) {
      errors.push(
        `Row ${i + 1}: invalid start_time "${startTimeRaw}" (use HH:MM or HH:MM AM).`
      );
      continue;
    }

    const area =
      areaIdx >= 0 && cells[areaIdx]?.trim() ? cells[areaIdx]!.trim() : undefined;

    const programRaw =
      programIdx >= 0 ? cells[programIdx]?.trim().toLowerCase() : "sword_duels";
    const program = PROGRAMS.has(programRaw as EventScheduleProgram)
      ? (programRaw as EventScheduleProgram)
      : "sword_duels";

    const published =
      publishedIdx >= 0
        ? parsePublished(cells[publishedIdx] ?? "yes")
        : true;

    const startAt = combineStartAt(startDate, startTime);

    const event: CalendarEvent = {
      id: eventImportId({
        kind: kindRaw,
        startAt,
        area,
        title,
      }),
      kind: kindRaw as CalendarEventKind,
      title,
      startAt,
      endAt: endDate,
      timeLabel:
        timeLabelIdx >= 0 && cells[timeLabelIdx]?.trim()
          ? cells[timeLabelIdx]!.trim()
          : undefined,
      areas: area ? [area] : undefined,
      setLabel:
        setLabelIdx >= 0 && cells[setLabelIdx]?.trim()
          ? cells[setLabelIdx]!.trim()
          : undefined,
      published,
      program,
    };

    events.push(event);
  }

  return { events: sortCalendarEvents(events), errors };
}

export function eventsCalendarToCsv(config: EventsCalendarConfig): string {
  const rows = sortCalendarEvents(config.events).map((event) => {
    const startDate = event.startAt.slice(0, 10);
    const cells = [
      event.kind,
      event.title,
      startDate,
      event.endAt ?? "",
      startTimeFromEvent(event),
      event.timeLabel ?? "",
      event.areas?.[0] ?? "",
      event.setLabel ?? "",
      event.published ? "yes" : "no",
      event.program,
    ];
    return cells.map(escapeCsvCell).join(",");
  });

  return [EVENTS_CALENDAR_CSV_HEADER, ...rows].join("\n");
}

export function buildEventsCalendarCsvTemplate(): string {
  return eventsCalendarToCsv(buildDefaultEventsCalendar2026());
}

export const EVENTS_CALENDAR_CSV_TEMPLATE = buildEventsCalendarCsvTemplate();

export function importEventsCalendarCsv(
  text: string
): { config: EventsCalendarConfig; errors: string[] } {
  const { events, errors } = parseEventsCalendarCsv(text);
  return { config: { events }, errors };
}
