export const EVENT_SCHEDULE_SLUG = "event_schedule";

export type EventScheduleProgram =
  | "sword_duels"
  | "national_competitions";

export interface EventScheduleEntry {
  id: string;
  program: EventScheduleProgram;
  title: string;
  /** ISO 8601 datetime */
  scheduledAt: string;
  area?: string;
}

export interface EventScheduleConfig {
  entries: EventScheduleEntry[];
}

export const DEFAULT_EVENT_SCHEDULE: EventScheduleConfig = {
  entries: [],
};

const PROGRAMS = new Set<EventScheduleProgram>([
  "sword_duels",
  "national_competitions",
]);

export const EVENT_SCHEDULE_PROGRAM_LABELS: Record<EventScheduleProgram, string> =
  {
    sword_duels: "Sword Duels",
    national_competitions: "National Competitions",
  };

export function parseEventScheduleBody(raw: unknown): EventScheduleConfig {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_EVENT_SCHEDULE };
  }
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.entries)) {
    return { ...DEFAULT_EVENT_SCHEDULE };
  }

  const entries: EventScheduleEntry[] = [];
  for (const row of o.entries) {
    if (!row || typeof row !== "object") continue;
    const e = row as Record<string, unknown>;
    const id = typeof e.id === "string" ? e.id.trim() : "";
    const title = typeof e.title === "string" ? e.title.trim() : "";
    const scheduledAt =
      typeof e.scheduledAt === "string" ? e.scheduledAt.trim() : "";
    if (!id || !title || !scheduledAt) continue;
    if (Number.isNaN(Date.parse(scheduledAt))) continue;

    const program = PROGRAMS.has(e.program as EventScheduleProgram)
      ? (e.program as EventScheduleProgram)
      : "sword_duels";

    entries.push({
      id,
      program,
      title,
      scheduledAt,
      area:
        typeof e.area === "string" && e.area.trim()
          ? e.area.trim()
          : undefined,
    });
  }

  return { entries };
}

export function upcomingScheduleEntries(
  config: EventScheduleConfig,
  now = Date.now(),
  limit = 8
): EventScheduleEntry[] {
  return config.entries
    .filter((e) => new Date(e.scheduledAt).getTime() > now)
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    )
    .slice(0, limit);
}

/** Drop manual schedule rows whose date has passed (run on save). */
export function prunePastScheduleEntries(
  config: EventScheduleConfig,
  now = Date.now()
): { config: EventScheduleConfig; removed: number } {
  const before = config.entries.length;
  const entries = config.entries.filter(
    (e) => new Date(e.scheduledAt).getTime() > now
  );
  return {
    config: { entries },
    removed: before - entries.length,
  };
}

export function formatScheduleDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
