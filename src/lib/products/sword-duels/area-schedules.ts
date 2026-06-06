import { formatScheduleDateTime } from "@/lib/event-schedule";
import { SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";
import type { HomeTimelineItem } from "@/lib/home-event-timeline";
import { areaSlug } from "./area-groups";
import { SD_SET_FLOW } from "./scoring-config";
import type { SdSet, SdSetType } from "./types";

export const SD_AREA_SCHEDULES_SLUG = "sd_area_schedules";

export interface SdAreaScheduleDates {
  groupA?: string;
  groupB?: string;
  areaFinal?: string;
}

export interface SdNationalsScheduleDates {
  wildcard?: string;
  knockout?: string;
}

export interface SdAreaSchedulesConfig {
  byArea: Record<string, SdAreaScheduleDates>;
  nationals: SdNationalsScheduleDates;
}

export const DEFAULT_SD_AREA_SCHEDULES: SdAreaSchedulesConfig = {
  byArea: {},
  nationals: {},
};

const SET_DATE_KEYS: Record<
  SdSetType,
  keyof SdAreaScheduleDates
> = {
  group_a: "groupA",
  group_b: "groupB",
  area_final: "areaFinal",
};

export function parseSdAreaSchedulesBody(raw: unknown): SdAreaSchedulesConfig {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_SD_AREA_SCHEDULES, byArea: {}, nationals: {} };
  }
  const o = raw as Record<string, unknown>;
  const byArea: Record<string, SdAreaScheduleDates> = {};

  if (o.byArea && typeof o.byArea === "object") {
    for (const [area, value] of Object.entries(o.byArea as Record<string, unknown>)) {
      if (!value || typeof value !== "object") continue;
      const row = value as Record<string, unknown>;
      const dates: SdAreaScheduleDates = {};
      if (typeof row.groupA === "string" && row.groupA.trim()) {
        dates.groupA = row.groupA.trim();
      }
      if (typeof row.groupB === "string" && row.groupB.trim()) {
        dates.groupB = row.groupB.trim();
      }
      if (typeof row.areaFinal === "string" && row.areaFinal.trim()) {
        dates.areaFinal = row.areaFinal.trim();
      }
      if (dates.groupA || dates.groupB || dates.areaFinal) {
        byArea[area] = dates;
      }
    }
  }

  const nationals: SdNationalsScheduleDates = {};
  if (o.nationals && typeof o.nationals === "object") {
    const n = o.nationals as Record<string, unknown>;
    if (typeof n.wildcard === "string" && n.wildcard.trim()) {
      nationals.wildcard = n.wildcard.trim();
    }
    if (typeof n.knockout === "string" && n.knockout.trim()) {
      nationals.knockout = n.knockout.trim();
    }
  }

  return { byArea, nationals };
}

export type SdAreaSetPublishState = Partial<
  Record<SdSetType, "published" | "draft">
>;

export function publishStateForArea(sets: SdSet[]): SdAreaSetPublishState {
  const state: SdAreaSetPublishState = {};
  for (const set of sets) {
    state[set.set_type] = set.status;
  }
  return state;
}

export interface SdAreaScheduleRow {
  setType: SdSetType;
  title: string;
  scheduledAt?: string;
  status?: "published" | "draft";
  isPast: boolean;
}

export function areaScheduleRows(
  area: string,
  config: SdAreaSchedulesConfig,
  publishState: SdAreaSetPublishState,
  now = Date.now()
): SdAreaScheduleRow[] {
  const dates = config.byArea[area] ?? {};
  return SD_SET_FLOW.map((step) => {
    const key = SET_DATE_KEYS[step.key];
    const scheduledAt = dates[key];
    const status = publishState[step.key];
    return {
      setType: step.key,
      title: step.title,
      scheduledAt,
      status,
      isPast: scheduledAt ? new Date(scheduledAt).getTime() < now : false,
    };
  });
}

export function upcomingFromSdAreaSchedules(
  config: SdAreaSchedulesConfig,
  sets: SdSet[],
  now = Date.now()
): HomeTimelineItem[] {
  const items: HomeTimelineItem[] = [];
  const setsByArea = new Map<string, SdSet[]>();
  for (const set of sets) {
    const list = setsByArea.get(set.area) ?? [];
    list.push(set);
    setsByArea.set(set.area, list);
  }

  for (const [area, dates] of Object.entries(config.byArea)) {
    const areaSets = setsByArea.get(area) ?? [];
    const publishState = publishStateForArea(areaSets);
    const href = `${SWORD_DUELS_PUBLIC}/${areaSlug(area)}`;

    for (const step of SD_SET_FLOW) {
      const key = SET_DATE_KEYS[step.key];
      const at = dates[key];
      if (!at || new Date(at).getTime() <= now) continue;
      if (publishState[step.key] === "published") continue;

      items.push({
        id: `sd-area-schedule-${area}-${step.key}-${at}`,
        program: "sword_duels",
        title: `${area} · ${step.title}`,
        detail: "Scheduled area battle",
        occurredAt: at,
        href,
        source: "scheduled",
      });
    }
  }

  if (config.nationals.wildcard) {
    const at = config.nationals.wildcard;
    if (new Date(at).getTime() > now) {
      items.push({
        id: `sd-nationals-wildcard-${at}`,
        program: "sword_duels",
        title: "Nationals · Wild card",
        detail: "Scheduled nationals phase",
        occurredAt: at,
        href: `${SWORD_DUELS_PUBLIC}/nationals#wildcard`,
        source: "scheduled",
      });
    }
  }

  if (config.nationals.knockout) {
    const at = config.nationals.knockout;
    if (new Date(at).getTime() > now) {
      items.push({
        id: `sd-nationals-knockout-${at}`,
        program: "sword_duels",
        title: "Nationals · Knockout",
        detail: "Scheduled nationals phase",
        occurredAt: at,
        href: `${SWORD_DUELS_PUBLIC}/nationals#knockout`,
        source: "scheduled",
      });
    }
  }

  return items.sort(
    (a, b) =>
      new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
  );
}

export function formatAreaScheduleWhen(iso?: string): string | null {
  if (!iso) return null;
  return formatScheduleDateTime(iso);
}
