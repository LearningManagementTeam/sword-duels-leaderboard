import { formatScheduleDateTime } from "@/lib/event-schedule";
import type { HomeTimelineItem } from "@/lib/home-event-timeline";
import type { SeasonSlug } from "@/lib/scoring-config";

export const NC_PHASE_SCHEDULES_SLUG = "nc_phase_schedules";

export interface NcRoundScheduleDates {
  r1?: string;
  r2?: string;
  r3?: string;
}

export interface NcPhaseSchedulesConfig {
  june: NcRoundScheduleDates;
  july: NcRoundScheduleDates;
  august: NcRoundScheduleDates;
}

export const DEFAULT_NC_PHASE_SCHEDULES: NcPhaseSchedulesConfig = {
  june: {},
  july: {},
  august: {},
};

const PHASE_META: {
  key: keyof NcPhaseSchedulesConfig;
  seasonSlug: SeasonSlug;
  label: string;
  href: string;
}[] = [
  { key: "june", seasonSlug: "june_area", label: "June", href: "/june" },
  { key: "july", seasonSlug: "july_region", label: "July", href: "/july" },
  { key: "august", seasonSlug: "august_finals", label: "The Nationals", href: "/august" },
];

function parseRoundDates(raw: unknown): NcRoundScheduleDates {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const out: NcRoundScheduleDates = {};
  for (const key of ["r1", "r2", "r3"] as const) {
    if (typeof o[key] === "string" && o[key].trim()) {
      const iso = o[key].trim();
      if (!Number.isNaN(Date.parse(iso))) out[key] = iso;
    }
  }
  return out;
}

export function parseNcPhaseSchedulesBody(raw: unknown): NcPhaseSchedulesConfig {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_NC_PHASE_SCHEDULES };
  }
  const o = raw as Record<string, unknown>;
  return {
    june: parseRoundDates(o.june),
    july: parseRoundDates(o.july),
    august: parseRoundDates(o.august),
  };
}

export function upcomingFromNcPhaseSchedules(
  config: NcPhaseSchedulesConfig,
  publishedRounds: Map<SeasonSlug, Set<number>>,
  now = Date.now()
): HomeTimelineItem[] {
  const items: HomeTimelineItem[] = [];

  for (const phase of PHASE_META) {
    const dates = config[phase.key];
    for (const round of [1, 2, 3] as const) {
      const key = `r${round}` as const;
      const at = dates[key];
      if (!at || new Date(at).getTime() <= now) continue;
      if (publishedRounds.get(phase.seasonSlug)?.has(round)) continue;

      items.push({
        id: `nc-phase-${phase.key}-r${round}-${at}`,
        program: "national_competitions",
        title: `${phase.label} · Round ${round}`,
        detail: "Scheduled NC round",
        occurredAt: at,
        href: phase.href,
        source: "scheduled",
      });
    }
  }

  return items.sort(
    (a, b) =>
      new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
  );
}

export { formatScheduleDateTime };
