import type { Region, SeasonSlug } from "@/lib/scoring-config";

export const COMPETITION_MAP_SLUG = "competition_map";

export type CompetitionMilestoneId =
  | "pre_season"
  | "june_r1"
  | "june_r2"
  | "june_r3"
  | "june_to_july"
  | "july_r1"
  | "july_r2"
  | "july_r3"
  | "july_to_august"
  | "august_r1"
  | "august_r2"
  | "august_r3"
  | "complete";

export type RegionHighlight = "all" | Region;

export interface CompetitionMapConfig {
  milestoneId: CompetitionMilestoneId;
  regionHighlight: RegionHighlight;
  publicCaption: string;
  showContestantList: boolean;
}

export interface CompetitionMilestoneMeta {
  id: CompetitionMilestoneId;
  label: string;
  shortLabel: string;
  group: "setup" | "june" | "transition" | "july" | "august" | "end";
  seasonSlug: SeasonSlug | null;
  round: number | null;
  usesRegions: boolean;
}

export const COMPETITION_MILESTONES: CompetitionMilestoneMeta[] = [
  {
    id: "pre_season",
    label: "Before competition",
    shortLabel: "Pre",
    group: "setup",
    seasonSlug: null,
    round: null,
    usesRegions: false,
  },
  {
    id: "june_r1",
    label: "June — Round 1",
    shortLabel: "J·R1",
    group: "june",
    seasonSlug: "june_area",
    round: 1,
    usesRegions: true,
  },
  {
    id: "june_r2",
    label: "June — Round 2",
    shortLabel: "J·R2",
    group: "june",
    seasonSlug: "june_area",
    round: 2,
    usesRegions: true,
  },
  {
    id: "june_r3",
    label: "June — Round 3",
    shortLabel: "J·R3",
    group: "june",
    seasonSlug: "june_area",
    round: 3,
    usesRegions: true,
  },
  {
    id: "june_to_july",
    label: "June → July transition",
    shortLabel: "→ Jul",
    group: "transition",
    seasonSlug: "june_area",
    round: null,
    usesRegions: true,
  },
  {
    id: "july_r1",
    label: "July — Round 1",
    shortLabel: "Ju·R1",
    group: "july",
    seasonSlug: "july_region",
    round: 1,
    usesRegions: true,
  },
  {
    id: "july_r2",
    label: "July — Round 2",
    shortLabel: "Ju·R2",
    group: "july",
    seasonSlug: "july_region",
    round: 2,
    usesRegions: true,
  },
  {
    id: "july_r3",
    label: "July — Round 3",
    shortLabel: "Ju·R3",
    group: "july",
    seasonSlug: "july_region",
    round: 3,
    usesRegions: true,
  },
  {
    id: "july_to_august",
    label: "July → August transition",
    shortLabel: "→ Aug",
    group: "transition",
    seasonSlug: "july_region",
    round: null,
    usesRegions: true,
  },
  {
    id: "august_r1",
    label: "August — Round 1",
    shortLabel: "A·R1",
    group: "august",
    seasonSlug: "august_finals",
    round: 1,
    usesRegions: false,
  },
  {
    id: "august_r2",
    label: "August — Round 2",
    shortLabel: "A·R2",
    group: "august",
    seasonSlug: "august_finals",
    round: 2,
    usesRegions: false,
  },
  {
    id: "august_r3",
    label: "August — Round 3",
    shortLabel: "A·R3",
    group: "august",
    seasonSlug: "august_finals",
    round: 3,
    usesRegions: false,
  },
  {
    id: "complete",
    label: "Competition complete",
    shortLabel: "Done",
    group: "end",
    seasonSlug: "august_finals",
    round: null,
    usesRegions: false,
  },
];

const MILESTONE_IDS = new Set(
  COMPETITION_MILESTONES.map((m) => m.id)
);

export const DEFAULT_COMPETITION_MAP_CONFIG: CompetitionMapConfig = {
  milestoneId: "june_r1",
  regionHighlight: "all",
  publicCaption: "Competition is underway — June Round 1 across all regions.",
  showContestantList: true,
};

export function getMilestoneMeta(
  id: CompetitionMilestoneId
): CompetitionMilestoneMeta {
  return (
    COMPETITION_MILESTONES.find((m) => m.id === id) ??
    COMPETITION_MILESTONES.find((m) => m.id === "june_r1")!
  );
}

export function parseCompetitionMapBody(raw: unknown): CompetitionMapConfig {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_COMPETITION_MAP_CONFIG };
  }
  const o = raw as Record<string, unknown>;
  const milestoneId =
    typeof o.milestoneId === "string" &&
    MILESTONE_IDS.has(o.milestoneId as CompetitionMilestoneId)
      ? (o.milestoneId as CompetitionMilestoneId)
      : DEFAULT_COMPETITION_MAP_CONFIG.milestoneId;

  const regionHighlight =
    o.regionHighlight === "all" ||
    o.regionHighlight === "luzon" ||
    o.regionHighlight === "ncr" ||
    o.regionHighlight === "vismin"
      ? o.regionHighlight
      : DEFAULT_COMPETITION_MAP_CONFIG.regionHighlight;

  return {
    milestoneId,
    regionHighlight,
    publicCaption:
      typeof o.publicCaption === "string"
        ? o.publicCaption.trim()
        : DEFAULT_COMPETITION_MAP_CONFIG.publicCaption,
    showContestantList:
      typeof o.showContestantList === "boolean"
        ? o.showContestantList
        : DEFAULT_COMPETITION_MAP_CONFIG.showContestantList,
  };
}

export function milestoneIndex(id: CompetitionMilestoneId): number {
  return COMPETITION_MILESTONES.findIndex((m) => m.id === id);
}

const MILESTONES_WITHOUT_CONTESTANT_LIST = new Set<CompetitionMilestoneId>([
  "pre_season",
  "june_to_july",
  "july_to_august",
  "complete",
]);

/** Transition / setup milestones should not show live cohort lists. */
export function milestoneShowsContestantList(id: CompetitionMilestoneId): boolean {
  return !MILESTONES_WITHOUT_CONTESTANT_LIST.has(id);
}

export function seasonSlugToPublicPath(slug: SeasonSlug): string {
  if (slug === "june_area") return "/june";
  if (slug === "july_region") return "/july";
  return "/august";
}

export function regionBoardPath(
  seasonSlug: SeasonSlug,
  region: Region
): string {
  const base = seasonSlugToPublicPath(seasonSlug);
  return seasonSlug === "august_finals" ? base : `${base}/${region}`;
}

export function getMilestoneDataHint(meta: CompetitionMilestoneMeta): {
  message: string;
  linkHref?: string;
  linkLabel?: string;
} {
  if (meta.id === "pre_season") {
    return {
      message: "Competition has not started — publish June Round 1 when ready.",
      linkHref: "/june/luzon",
      linkLabel: "Open June standings",
    };
  }
  if (meta.id === "complete") {
    return { message: "Season complete — finals results are on the August board." };
  }
  if (meta.group === "transition") {
    const next =
      meta.id === "june_to_july"
        ? "July regional phase"
        : "August finals";
    return {
      message: `Between phases — no single-round cohort. Publish ${next} standings when the phase begins.`,
      linkHref: meta.id === "june_to_july" ? "/july/luzon" : "/august",
      linkLabel: meta.id === "june_to_july" ? "Open July standings" : "Open August finals",
    };
  }
  const phase =
    meta.seasonSlug === "june_area"
      ? "June"
      : meta.seasonSlug === "july_region"
        ? "July"
        : "August";
  const roundPart =
    meta.round != null ? ` Round ${meta.round}` : "";
  return {
    message: `No published ${phase}${roundPart} standings yet, or everyone is eliminated.`,
    linkHref: meta.seasonSlug
      ? seasonSlugToPublicPath(meta.seasonSlug)
      : undefined,
    linkLabel: meta.seasonSlug
      ? `Open ${phase} standings`
      : undefined,
  };
}

export type CompetitionMapPhaseTab = "june" | "july" | "august";

export function milestonePhaseTab(
  id: CompetitionMilestoneId
): CompetitionMapPhaseTab {
  const meta = getMilestoneMeta(id);
  if (meta.group === "july" || meta.id === "july_to_august") return "july";
  if (meta.group === "august" || meta.group === "end") return "august";
  return "june";
}

export function milestonesForPhaseTab(
  tab: CompetitionMapPhaseTab
): CompetitionMilestoneMeta[] {
  if (tab === "june") {
    return COMPETITION_MILESTONES.filter(
      (m) =>
        m.group === "setup" ||
        m.group === "june" ||
        m.id === "june_to_july"
    );
  }
  if (tab === "july") {
    return COMPETITION_MILESTONES.filter(
      (m) => m.group === "july" || m.id === "july_to_august"
    );
  }
  return COMPETITION_MILESTONES.filter(
    (m) => m.group === "august" || m.group === "end"
  );
}
