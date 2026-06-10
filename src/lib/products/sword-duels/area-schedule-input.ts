/** datetime-local ↔ ISO helpers for area battle schedules (Philippine time). */

export const PHILIPPINES_TIME_ZONE = "Asia/Manila";

const LOCAL_DATETIME_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

function parseScheduleInstant(iso: string): Date {
  return new Date(iso.length === 10 ? `${iso}T12:00:00+08:00` : iso);
}

function phDateTimeParts(d: Date): Record<string, string> {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PHILIPPINES_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  return Object.fromEntries(parts.map((p) => [p.type, p.value]));
}

/** Show datetime-local input value in Philippine time. */
export function toDatetimeLocalValue(iso?: string): string {
  if (!iso) return "";
  const d = parseScheduleInstant(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = phDateTimeParts(d);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** Parse datetime-local as Philippine wall time (not browser/server TZ). */
export function fromDatetimeLocalValue(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const match = LOCAL_DATETIME_RE.exec(trimmed);
  if (match) {
    const [, y, mo, d, h, mi] = match;
    return `${y}-${mo}-${d}T${h}:${mi}:00+08:00`;
  }
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

/** Short time label for calendars and public boards (always PH time). */
export function formatScheduleTimeLabel(iso: string): string {
  return parseScheduleInstant(iso).toLocaleString("en-PH", {
    timeZone: PHILIPPINES_TIME_ZONE,
    timeStyle: "short",
  });
}
