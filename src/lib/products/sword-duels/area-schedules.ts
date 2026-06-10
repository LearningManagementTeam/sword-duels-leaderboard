import { formatScheduleDateTime } from "@/lib/event-schedule";
import { SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";
import type { HomeTimelineItem } from "@/lib/home-event-timeline";
import { areaSlug } from "./area-groups";
import { SD_SET_FLOW } from "./scoring-config";
import type { SdAreaSetType, SdSet } from "./types";
import { isAreaSetType } from "./format-guards";
import {
  isRegionalAverageFormat,
  type SdTournamentFormat,
} from "./tournament-format";

export const SD_AREA_SCHEDULES_SLUG = "sd_area_schedules";

export interface SdAreaScheduleDates {
  groupA?: string;
  groupB?: string;
  areaFinal?: string;
  /** Default host / trainer when per-set host is blank. */
  hostTrainer?: string;
  hostGroupA?: string;
  hostGroupB?: string;
  hostAreaFinal?: string;
}

export interface SdNationalsScheduleDates {
  /** V1 */
  wildcard?: string;
  knockout?: string;
  /** V2 */
  regionalR1?: string;
  regionalR2?: string;
  regionalR3?: string;
  finals?: string;
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
  SdAreaSetType,
  keyof SdAreaScheduleDates
> = {
  group_a: "groupA",
  group_b: "groupB",
  area_final: "areaFinal",
};

export { SET_DATE_KEYS };

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
      if (typeof row.hostTrainer === "string" && row.hostTrainer.trim()) {
        dates.hostTrainer = row.hostTrainer.trim();
      }
      if (typeof row.hostGroupA === "string" && row.hostGroupA.trim()) {
        dates.hostGroupA = row.hostGroupA.trim();
      }
      if (typeof row.hostGroupB === "string" && row.hostGroupB.trim()) {
        dates.hostGroupB = row.hostGroupB.trim();
      }
      if (typeof row.hostAreaFinal === "string" && row.hostAreaFinal.trim()) {
        dates.hostAreaFinal = row.hostAreaFinal.trim();
      }
      if (
        dates.groupA ||
        dates.groupB ||
        dates.areaFinal ||
        dates.hostTrainer ||
        dates.hostGroupA ||
        dates.hostGroupB ||
        dates.hostAreaFinal
      ) {
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
    if (typeof n.regionalR1 === "string" && n.regionalR1.trim()) {
      nationals.regionalR1 = n.regionalR1.trim();
    }
    if (typeof n.regionalR2 === "string" && n.regionalR2.trim()) {
      nationals.regionalR2 = n.regionalR2.trim();
    }
    if (typeof n.regionalR3 === "string" && n.regionalR3.trim()) {
      nationals.regionalR3 = n.regionalR3.trim();
    }
    if (typeof n.finals === "string" && n.finals.trim()) {
      nationals.finals = n.finals.trim();
    }
  }

  return { byArea, nationals };
}

export type SdAreaSetPublishState = Partial<
  Record<SdAreaSetType, "published" | "draft">
>;

export function publishStateForArea(sets: SdSet[]): SdAreaSetPublishState {
  const state: SdAreaSetPublishState = {};
  for (const set of sets) {
    if (!isAreaSetType(set.set_type)) continue;
    state[set.set_type] = set.status;
  }
  return state;
}

export interface SdAreaScheduleRow {
  setType: SdAreaSetType;
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
  format: SdTournamentFormat | null | undefined = "classic_v1",
  now = Date.now()
): HomeTimelineItem[] {
  const isV2 = isRegionalAverageFormat(format);
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

  if (isV2) {
    const v2Phases: {
      key: keyof SdNationalsScheduleDates;
      title: string;
      href: string;
    }[] = [
      {
        key: "regionalR1",
        title: "Nationals · Regional Round 1",
        href: `${SWORD_DUELS_PUBLIC}/nationals#regionals`,
      },
      {
        key: "regionalR2",
        title: "Nationals · Regional Round 2",
        href: `${SWORD_DUELS_PUBLIC}/nationals#regionals`,
      },
      {
        key: "regionalR3",
        title: "Nationals · Regional Round 3",
        href: `${SWORD_DUELS_PUBLIC}/nationals#regionals`,
      },
      {
        key: "finals",
        title: "Nationals · Finals",
        href: `${SWORD_DUELS_PUBLIC}/nationals#knockout`,
      },
    ];
    for (const phase of v2Phases) {
      const at = config.nationals[phase.key];
      if (!at || new Date(at).getTime() <= now) continue;
      items.push({
        id: `sd-nationals-${phase.key}-${at}`,
        program: "sword_duels",
        title: phase.title,
        detail: "Scheduled nationals phase",
        occurredAt: at,
        href: phase.href,
        source: "scheduled",
      });
    }
  } else {
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

export function resolveAreaHostTrainer(
  config: SdAreaSchedulesConfig,
  area: string
): string | null {
  const dates = config.byArea[area];
  if (!dates) return null;
  return (
    dates.hostTrainer?.trim() ||
    dates.hostGroupA?.trim() ||
    dates.hostGroupB?.trim() ||
    dates.hostAreaFinal?.trim() ||
    null
  );
}

export function resolveHostForSetFromDates(
  dates: SdAreaScheduleDates,
  setType: SdAreaSetType
): string | null {
  const perSet =
    setType === "group_a"
      ? dates.hostGroupA
      : setType === "group_b"
        ? dates.hostGroupB
        : dates.hostAreaFinal;
  const specific = perSet?.trim();
  if (specific) return specific;
  return dates.hostTrainer?.trim() || null;
}

export function resolveBattleScheduleForSet(
  config: SdAreaSchedulesConfig | undefined,
  area: string,
  setType: SdAreaSetType
): { scheduledAt?: string; hostTrainer: string | null } {
  if (!config) {
    return { hostTrainer: null };
  }
  const dates = config.byArea[area] ?? {};
  const key = SET_DATE_KEYS[setType];
  const scheduledAt = dates[key];
  return {
    scheduledAt,
    hostTrainer: resolveHostForSetFromDates(dates, setType),
  };
}
