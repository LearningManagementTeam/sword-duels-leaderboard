import {
  getSurvivorCount,
  REGION_LABELS,
  type Region,
} from "@/lib/scoring-config";
import type { BranchStatus, StandingRow } from "@/lib/types";

export const JULY_ENTRANTS_PER_REGION = 8;

export const REGION_PLAYOFF_ACCENTS: Record<
  Region,
  { connector: string; badge: string; glow: string }
> = {
  luzon: {
    connector: "stroke-emerald-400",
    badge: "bg-emerald-500/25 text-emerald-100 ring-emerald-400/40",
    glow: "ring-emerald-400/50 shadow-[0_0_14px_rgb(74_222_128/0.35)]",
  },
  ncr: {
    connector: "stroke-fuchsia-400",
    badge: "bg-fuchsia-500/20 text-fuchsia-100 ring-fuchsia-400/40",
    glow: "ring-fuchsia-400/50 shadow-[0_0_14px_rgb(232_121_249/0.35)]",
  },
  vismin: {
    connector: "stroke-lime-400",
    badge: "bg-lime-500/20 text-lime-100 ring-lime-400/40",
    glow: "ring-lime-400/50 shadow-[0_0_14px_rgb(163_230_53/0.35)]",
  },
};

export interface PlayoffSlot {
  branch_id: string | null;
  branch_name: string;
  branch_code: string;
  rank: number;
  status: BranchStatus | "placeholder";
  eliminatedInRound?: number | null;
  tieBreakerInRound?: number | null;
  representative_1?: string | null;
  employee_no?: string | null;
  position?: string | null;
  photo_url?: string | null;
  roundScore: number | null;
  isChampion?: boolean;
  isPlaceholder?: boolean;
}

export interface PlayoffColumn {
  id: number;
  label: string;
  subtitle: string;
  slots: PlayoffSlot[];
  survivorCount: number;
  isRevealed: boolean;
}

export interface JulyRegionalPlayoffMapModel {
  region: Region;
  latestPublishedRound: number;
  remainingCount: number;
  badgeLabel: string;
  columns: PlayoffColumn[];
}

export interface NationalsChampionSlot {
  region: Region;
  branch_id: string | null;
  branch_name: string;
  branch_code: string;
  representative_1?: string | null;
  status: BranchStatus | "placeholder";
  rank: number;
  total_points: number;
  isOverallChampion: boolean;
}

export interface NationalsConvergenceMapModel {
  latestPublishedRound: number;
  regionalChampions: NationalsChampionSlot[];
  finalsChampion: NationalsChampionSlot | null;
}

function roundPoints(row: StandingRow, round: number): number | null {
  if (round === 1) return row.round1_points;
  if (round === 2) return row.round2_points;
  if (round === 3) return row.round3_points;
  return null;
}

/** True if branch is still in the pool after `roundNum` completes. */
export function survivedAfterRound(row: StandingRow, roundNum: number): boolean {
  if (row.manually_advanced_after_round === roundNum) return true;
  if (
    row.eliminated_in_round != null &&
    row.eliminated_in_round <= roundNum
  ) {
    return false;
  }
  if (
    row.tie_breaker_in_round != null &&
    row.tie_breaker_in_round <= roundNum
  ) {
    return (
      row.manually_advanced_after_round != null &&
      row.manually_advanced_after_round >= roundNum
    );
  }
  return true;
}

function toPlayoffSlot(
  row: StandingRow,
  roundScoreRound: number,
  opts?: { isChampion?: boolean }
): PlayoffSlot {
  return {
    branch_id: row.branch_id,
    branch_name: row.branch_name,
    branch_code: row.branch_code,
    rank: row.rank,
    status: row.status,
    eliminatedInRound: row.eliminated_in_round,
    tieBreakerInRound: row.tie_breaker_in_round,
    representative_1: row.representative_1,
    roundScore: roundPoints(row, roundScoreRound),
    isChampion: opts?.isChampion,
    isPlaceholder: false,
  };
}

function placeholderSlot(index: number): PlayoffSlot {
  return {
    branch_id: null,
    branch_name: `Slot ${index + 1}`,
    branch_code: "",
    rank: index + 1,
    status: "placeholder",
    roundScore: null,
    isPlaceholder: true,
  };
}

function sortByRank(rows: StandingRow[]): StandingRow[] {
  return [...rows].sort((a, b) => a.rank - b.rank);
}

function remainingBadgeLabel(
  latestPublishedRound: number,
  remainingCount: number
): string {
  if (latestPublishedRound <= 0) return `${JULY_ENTRANTS_PER_REGION} TEAMS`;
  if (latestPublishedRound >= 3) return "CHAMPION";
  if (remainingCount === 1) return "1 REMAINING";
  return `${remainingCount} REMAINING`;
}

export function buildJulyRegionalPlayoffMap(input: {
  region: Region;
  rows: StandingRow[];
  latestPublishedRound: number;
}): JulyRegionalPlayoffMapModel {
  const { region, rows, latestPublishedRound } = input;
  const regionalRows = sortByRank(rows.filter((r) => r.region === region));

  const col0Slots: PlayoffSlot[] =
    regionalRows.length > 0
      ? regionalRows
          .slice(0, JULY_ENTRANTS_PER_REGION)
          .map((r) => toPlayoffSlot(r, 1))
      : Array.from({ length: JULY_ENTRANTS_PER_REGION }, (_, i) =>
          placeholderSlot(i)
        );

  const afterR1 =
    latestPublishedRound >= 1
      ? sortByRank(regionalRows.filter((r) => survivedAfterRound(r, 1))).map(
          (r) => toPlayoffSlot(r, 1)
        )
      : [];

  const afterR2 =
    latestPublishedRound >= 2
      ? sortByRank(regionalRows.filter((r) => survivedAfterRound(r, 2))).map(
          (r) => toPlayoffSlot(r, 2)
        )
      : [];

  const afterR3 =
    latestPublishedRound >= 3
      ? sortByRank(regionalRows.filter((r) => survivedAfterRound(r, 3)))
          .slice(0, 1)
          .map((r) => toPlayoffSlot(r, 3, { isChampion: true }))
      : [];

  const remainingCount =
    latestPublishedRound >= 3
      ? afterR3.length
      : latestPublishedRound === 2
        ? afterR2.length
        : latestPublishedRound === 1
          ? afterR1.length
          : JULY_ENTRANTS_PER_REGION;

  const columns: PlayoffColumn[] = [
    {
      id: 0,
      label: "Round 1 field",
      subtitle: `${JULY_ENTRANTS_PER_REGION} teams`,
      slots: col0Slots,
      survivorCount: JULY_ENTRANTS_PER_REGION,
      isRevealed: true,
    },
    {
      id: 1,
      label: "After Round 1",
      subtitle: `Top ${getSurvivorCount("july_region", 1, region) ?? 4}`,
      slots: afterR1,
      survivorCount: getSurvivorCount("july_region", 1, region) ?? 4,
      isRevealed: latestPublishedRound >= 1,
    },
    {
      id: 2,
      label: "After Round 2",
      subtitle: `Top ${getSurvivorCount("july_region", 2, region) ?? 2}`,
      slots: afterR2,
      survivorCount: getSurvivorCount("july_region", 2, region) ?? 2,
      isRevealed: latestPublishedRound >= 2,
    },
    {
      id: 3,
      label: "Regional champion",
      subtitle: "Advances to The Nationals",
      slots: afterR3,
      survivorCount: 1,
      isRevealed: latestPublishedRound >= 3,
    },
  ];

  return {
    region,
    latestPublishedRound,
    remainingCount,
    badgeLabel: remainingBadgeLabel(latestPublishedRound, remainingCount),
    columns,
  };
}

function toNationalsChampionSlot(row: StandingRow): NationalsChampionSlot {
  return {
    region: row.region,
    branch_id: row.branch_id,
    branch_name: row.branch_name,
    branch_code: row.branch_code,
    representative_1: row.representative_1,
    status: row.status,
    rank: row.rank,
    total_points: row.total_points,
    isOverallChampion: row.status === "champion",
  };
}

export function buildNationalsConvergenceMap(input: {
  rows: StandingRow[];
  latestPublishedRound: number;
}): NationalsConvergenceMapModel {
  const { rows, latestPublishedRound } = input;
  const sorted = sortByRank(rows);

  const regionalChampions: NationalsChampionSlot[] = (
    ["luzon", "ncr", "vismin"] as Region[]
  ).map((region) => {
    const row = sorted.find((r) => r.region === region);
    if (!row) {
      return {
        region,
        branch_id: null,
        branch_name: `${REGION_LABELS[region]} champion`,
        branch_code: "",
        status: "placeholder" as const,
        rank: 0,
        total_points: 0,
        isOverallChampion: false,
      };
    }
    return toNationalsChampionSlot(row);
  });

  const championRow = sorted.find((r) => r.status === "champion");
  const finalsChampion: NationalsChampionSlot | null = championRow
    ? toNationalsChampionSlot(championRow)
    : latestPublishedRound >= 3 && sorted[0]
      ? toNationalsChampionSlot(sorted[0])
      : null;

  return {
    latestPublishedRound,
    regionalChampions,
    finalsChampion,
  };
}

/** Branch IDs that appear in both columns — for connector lines. */
export function connectorBranchIds(
  from: PlayoffColumn,
  to: PlayoffColumn
): Set<string> {
  const nextIds = new Set(
    to.slots.map((s) => s.branch_id).filter(Boolean) as string[]
  );
  return new Set(
    from.slots
      .map((s) => s.branch_id)
      .filter((id): id is string => id != null && nextIds.has(id))
  );
}
