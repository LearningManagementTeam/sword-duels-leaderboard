import { compareAreaNames, sortAreasByNumber } from "./area-groups";
import { formatScheduleTimeLabel } from "./area-schedule-input";
import type {
  SdAreaScheduleDates,
  SdAreaSchedulesConfig,
} from "./area-schedules";
import type { SdAreaSetType } from "./types";

export type SdCalendarBranchRow = {
  id: string;
  name: string;
  code: string;
};

export type SdCalendarAreaBracket = {
  area: string;
  groupA: SdCalendarBranchRow[];
  groupB: SdCalendarBranchRow[];
};

const SET_DATE_KEYS: Record<
  SdAreaSetType,
  keyof SdAreaScheduleDates
> = {
  group_a: "groupA",
  group_b: "groupB",
  area_final: "areaFinal",
};

const SET_LABELS: Record<SdAreaSetType, string> = {
  group_a: "Set 1",
  group_b: "Set 2",
  area_final: "Area final",
};

function resolveHostForSet(
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

export type SdCalendarDaySetBattle = {
  setType: SdAreaSetType;
  setLabel: string;
  timeLabel: string | null;
  host: string | null;
  branches: SdCalendarBranchRow[];
};

export type SdCalendarDayAreaCard = {
  area: string;
  sets: SdCalendarDaySetBattle[];
};

export type SdCalendarBranchMatch = {
  area: string;
  setType: SdAreaSetType;
  setLabel: string;
  timeLabel: string | null;
  host: string | null;
  branch: SdCalendarBranchRow;
};

function dayKeyFromDate(day: Date): number {
  return (
    day.getFullYear() * 10000 + (day.getMonth() + 1) * 100 + day.getDate()
  );
}

function dayKeyFromIso(iso: string): number {
  if (iso.length === 10) {
    const [y, m, d] = iso.split("-").map(Number);
    return y * 10000 + m * 100 + d;
  }
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const pick = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return (
    Number(pick("year")) * 10000 +
    Number(pick("month")) * 100 +
    Number(pick("day"))
  );
}

function branchesForSet(
  bracket: SdCalendarAreaBracket,
  setType: SdAreaSetType
): SdCalendarBranchRow[] {
  if (setType === "group_a") return bracket.groupA;
  if (setType === "group_b") return bracket.groupB;
  return [];
}

export function buildCalendarDayAreaCards(
  day: Date,
  brackets: SdCalendarAreaBracket[],
  schedules: SdAreaSchedulesConfig
): SdCalendarDayAreaCard[] {
  const dayKey = dayKeyFromDate(day);
  const bracketByArea = new Map(brackets.map((b) => [b.area, b]));
  const areas = sortAreasByNumber(brackets.map((b) => b.area));
  const cards: SdCalendarDayAreaCard[] = [];

  for (const area of areas) {
    const bracket = bracketByArea.get(area);
    const dates = schedules.byArea[area];
    if (!bracket || !dates) continue;

    const sets: SdCalendarDaySetBattle[] = [];
    for (const setType of ["group_a", "group_b", "area_final"] as const) {
      const iso = dates[SET_DATE_KEYS[setType]];
      if (!iso || dayKeyFromIso(iso) !== dayKey) continue;
      sets.push({
        setType,
        setLabel: SET_LABELS[setType],
        timeLabel: formatScheduleTimeLabel(iso),
        host: resolveHostForSet(dates, setType),
        branches: branchesForSet(bracket, setType),
      });
    }

    if (sets.length > 0) {
      cards.push({ area, sets });
    }
  }

  return cards.sort((a, b) => compareAreaNames(a.area, b.area));
}

export function findBranchOnCalendarDay(
  query: string,
  cards: SdCalendarDayAreaCard[]
): SdCalendarBranchMatch | null {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return null;

  for (const card of cards) {
    for (const set of card.sets) {
      for (const branch of set.branches) {
        const name = branch.name.toLowerCase();
        const code = branch.code.toLowerCase();
        if (name.includes(q) || code.includes(q)) {
          return {
            area: card.area,
            setType: set.setType,
            setLabel: set.setLabel,
            timeLabel: set.timeLabel,
            host: set.host,
            branch,
          };
        }
      }
    }
  }
  return null;
}

export function serializeBracketsForCalendar(
  brackets: import("./types").SdAreaBracket[]
): SdCalendarAreaBracket[] {
  return sortAreasByNumber(brackets.map((b) => b.area)).map((area) => {
    const bracket = brackets.find((b) => b.area === area)!;
    return {
      area: bracket.area,
      groupA: bracket.groupA.map((b) => ({
        id: b.branch_id,
        name: b.branch_name,
        code: b.branch_code,
      })),
      groupB: bracket.groupB.map((b) => ({
        id: b.branch_id,
        name: b.branch_name,
        code: b.branch_code,
      })),
    };
  });
}
