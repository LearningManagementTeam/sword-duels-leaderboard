import type { StandingRow } from "@/lib/types";
import {
  getRoundMechanics,
  getSurvivorCount,
  judgedScoreLabel,
  SCORING_CONFIG,
  type RoundLayoutVariant,
  type SeasonSlug,
} from "@/lib/scoring-config";

export interface RoundViewConfig {
  latestPublishedRound: number;
  roundName: string;
  layoutVariant: RoundLayoutVariant;
  bannerTagline: string;
  cutLineLabel: string;
  emptyMessage: string;
  heroLabel: string;
  showPodium: boolean;
  podiumMode: "quiz_score" | "finish_order" | "none";
}

export function participantDisplayName(row: StandingRow): string {
  if (row.is_placeholder) return row.branch_name;
  const name = row.representative_1?.trim();
  return name || row.branch_name;
}

export function participantInitials(row: StandingRow): string {
  const name = participantDisplayName(row);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function branchSubtext(row: StandingRow): string {
  if (row.is_placeholder) return "Placeholder · awaiting participant";
  return `${row.branch_name} · ${row.branch_code}`;
}

export function roundPointsForRound(
  row: StandingRow,
  round: number
): number | null {
  if (round === 1) return row.round1_points;
  if (round === 2) return row.round2_points;
  if (round === 3) return row.round3_points;
  return null;
}

export function round2Survived(row: StandingRow): boolean | null {
  if (row.round2_points === null) return null;
  return row.round2_points >= 1;
}

export function heartsRemaining(row: StandingRow): number | null {
  if (row.round2_points === null) return null;
  return row.round2_points;
}

export function hasHeartsRemaining(row: StandingRow): boolean | null {
  const hearts = heartsRemaining(row);
  if (hearts === null) return null;
  return hearts > 0;
}

export function formatQuizScore(
  points: number | null,
  max: number
): string {
  if (points === null) return "—";
  return `${points}/${max}`;
}

export function formatRound2Status(row: StandingRow): string {
  const survived = round2Survived(row);
  if (survived === null) return "—";
  return survived ? "Survived" : "Out";
}

export function formatRound3EliminatedSubtext(row: StandingRow): string | null {
  if (row.status === "eliminated" && row.round3_points != null && row.round3_points < 5) {
    return `${row.round3_points} correct`;
  }
  return null;
}

export function getRoundViewConfig(
  seasonSlug: SeasonSlug,
  latestPublishedRound: number,
  region?: string
): RoundViewConfig {
  const roundNum = latestPublishedRound > 0 ? latestPublishedRound : 1;
  const mechanics = getRoundMechanics(seasonSlug, roundNum);
  const config = SCORING_CONFIG[seasonSlug];

  const defaultCut =
    region && "survivorsPerRound" in config
      ? getSurvivorCount(seasonSlug, roundNum, region as "luzon" | "ncr" | "vismin") ?? 32
      : 24;

  let cutLineLabel = `Cut line — top ${defaultCut} advance`;
  if (latestPublishedRound > 0 && latestPublishedRound < config.roundCount) {
    cutLineLabel = `Cut line — top ${defaultCut} advance to Round ${latestPublishedRound + 1}`;
  } else if (seasonSlug === "june_area" && latestPublishedRound === 3) {
    cutLineLabel = `Cut line — top ${defaultCut} advance to July`;
  } else if (seasonSlug === "july_region" && latestPublishedRound === 3) {
    cutLineLabel = `Cut line — top ${defaultCut} advance to August`;
  }

  if (latestPublishedRound === 0) {
    return {
      latestPublishedRound: 0,
      roundName: mechanics?.roundName ?? "Round 1",
      layoutVariant: mechanics?.layoutVariant ?? "quiz_ladder",
      bannerTagline: mechanics?.bannerTagline ?? "Standings appear after publish",
      cutLineLabel,
      emptyMessage: "Round 1 kicks off soon — ranks appear here after publish.",
      heroLabel: "Score",
      showPodium: false,
      podiumMode: "none",
    };
  }

  if (!mechanics) {
    return {
      latestPublishedRound,
      roundName: `Round ${latestPublishedRound}`,
      layoutVariant: "cumulative",
      bannerTagline: "",
      cutLineLabel,
      emptyMessage: "No standings yet.",
      heroLabel: "Total",
      showPodium: true,
      podiumMode: "quiz_score",
    };
  }

  if (mechanics.kind === "quiz") {
    return {
      latestPublishedRound,
      roundName: mechanics.roundName,
      layoutVariant: mechanics.layoutVariant,
      bannerTagline: mechanics.bannerTagline,
      cutLineLabel,
      emptyMessage: "No scores published yet.",
      heroLabel: "Quiz score",
      showPodium: false,
      podiumMode: "none",
    };
  }

  if (mechanics.kind === "last_man_standing") {
    return {
      latestPublishedRound,
      roundName: mechanics.roundName,
      layoutVariant: mechanics.layoutVariant,
      bannerTagline: mechanics.bannerTagline,
      cutLineLabel,
      emptyMessage: "Survival results appear after publish.",
      heroLabel: "Status",
      showPodium: false,
      podiumMode: "none",
    };
  }

  if (mechanics.kind === "hearts_survival") {
    return {
      latestPublishedRound,
      roundName: mechanics.roundName,
      layoutVariant: mechanics.layoutVariant,
      bannerTagline: mechanics.bannerTagline,
      cutLineLabel,
      emptyMessage: "Heart counts appear after publish.",
      heroLabel: "Hearts",
      showPodium: false,
      podiumMode: "none",
    };
  }

  if (mechanics.kind === "lifelines_quiz") {
    return {
      latestPublishedRound,
      roundName: mechanics.roundName,
      layoutVariant: mechanics.layoutVariant,
      bannerTagline: mechanics.bannerTagline,
      cutLineLabel: "Championship standings — cumulative % across finals rounds",
      emptyMessage: "Nationals scores appear after publish.",
      heroLabel: "Round score",
      showPodium: true,
      podiumMode: "quiz_score",
    };
  }

  if (mechanics.kind === "judged_round") {
    return {
      latestPublishedRound,
      roundName: mechanics.roundName,
      layoutVariant: mechanics.layoutVariant,
      bannerTagline: mechanics.bannerTagline,
      cutLineLabel: "Championship standings — cumulative % across finals rounds",
      emptyMessage: "Judge scores appear after publish.",
      heroLabel: "Judge score",
      showPodium: true,
      podiumMode: "quiz_score",
    };
  }

  return {
    latestPublishedRound,
    roundName: mechanics.roundName,
    layoutVariant: mechanics.layoutVariant,
    bannerTagline: mechanics.bannerTagline,
    cutLineLabel,
    emptyMessage: "Qualification results appear after publish.",
    heroLabel: "Qualification",
    showPodium: true,
    podiumMode: "finish_order",
  };
}

export function sortRowsForRoundView(
  rows: StandingRow[],
  view: RoundViewConfig
): StandingRow[] {
  const copy = [...rows];

  if (view.layoutVariant === "quiz_ladder") {
    copy.sort((a, b) => {
      const aScore = a.round1_points ?? -1;
      const bScore = b.round1_points ?? -1;
      if (bScore !== aScore) return bScore - aScore;
      return a.branch_name.localeCompare(b.branch_name);
    });
    copy.forEach((r, i) => {
      r.rank = i + 1;
    });
    return copy;
  }

  if (view.layoutVariant === "survival_roster") {
    copy.sort((a, b) => {
      const aSurv = round2Survived(a) ? 0 : 1;
      const bSurv = round2Survived(b) ? 0 : 1;
      if (aSurv !== bSurv) return aSurv - bSurv;
      return a.branch_name.localeCompare(b.branch_name);
    });
    copy.forEach((r, i) => {
      r.rank = i + 1;
    });
    return copy;
  }

  if (view.layoutVariant === "hearts_roster") {
    copy.sort((a, b) => {
      const aHearts = heartsRemaining(a) ?? -1;
      const bHearts = heartsRemaining(b) ?? -1;
      if (bHearts !== aHearts) return bHearts - aHearts;
      return a.branch_name.localeCompare(b.branch_name);
    });
    copy.forEach((r, i) => {
      r.rank = i + 1;
    });
    return copy;
  }

  if (
    view.layoutVariant === "percentage_score" ||
    view.layoutVariant === "judged_score"
  ) {
    const round = view.latestPublishedRound;
    copy.sort((a, b) => {
      const aScore = roundPointsForRound(a, round) ?? -1;
      const bScore = roundPointsForRound(b, round) ?? -1;
      if (bScore !== aScore) return bScore - aScore;
      if (b.total_points !== a.total_points) return b.total_points - a.total_points;
      return a.branch_name.localeCompare(b.branch_name);
    });
    copy.forEach((r, i) => {
      r.rank = i + 1;
    });
    return copy;
  }

  if (view.layoutVariant === "finish_order_champions") {
    copy.sort((a, b) => {
      const aOrder = a.round3_finish_order ?? 999;
      const bOrder = b.round3_finish_order ?? 999;
      const aQual = a.round3_finish_order != null ? 0 : 1;
      const bQual = b.round3_finish_order != null ? 0 : 1;
      if (aQual !== bQual) return aQual - bQual;
      if (aOrder !== bOrder) return aOrder - bOrder;
      const aPts = a.round3_points ?? -1;
      const bPts = b.round3_points ?? -1;
      if (bPts !== aPts) return bPts - aPts;
      return a.branch_name.localeCompare(b.branch_name);
    });
    copy.forEach((r, i) => {
      r.rank = i + 1;
    });
    return copy;
  }

  return copy;
}

export function splitHeartsRows(rows: StandingRow[]): {
  standing: StandingRow[];
  fallen: StandingRow[];
} {
  const standing: StandingRow[] = [];
  const fallen: StandingRow[] = [];
  for (const row of rows) {
    if (hasHeartsRemaining(row)) standing.push(row);
    else if (hasHeartsRemaining(row) === false) fallen.push(row);
    else standing.push(row);
  }
  return { standing, fallen };
}

export function heartsCounts(rows: StandingRow[]): {
  standing: number;
  fallen: number;
} {
  let standing = 0;
  let fallen = 0;
  for (const row of rows) {
    const alive = hasHeartsRemaining(row);
    if (alive) standing++;
    else if (alive === false) fallen++;
  }
  return { standing, fallen };
}

export function splitSurvivalRows(rows: StandingRow[]): {
  standing: StandingRow[];
  fallen: StandingRow[];
} {
  const standing: StandingRow[] = [];
  const fallen: StandingRow[] = [];
  for (const row of rows) {
    if (round2Survived(row)) standing.push(row);
    else fallen.push(row);
  }
  return { standing, fallen };
}

export function splitQualificationRows(rows: StandingRow[]): {
  podium: StandingRow[];
  qualifiers: StandingRow[];
  eliminated: StandingRow[];
} {
  const qualified = rows.filter((r) => r.round3_finish_order != null);
  const podium = qualified.filter((r) => (r.round3_finish_order ?? 99) <= 3);
  const qualifiers = qualified.filter((r) => (r.round3_finish_order ?? 99) > 3);
  const eliminated = rows.filter((r) => r.round3_finish_order == null);
  return { podium, qualifiers, eliminated };
}

export function formatHeroMetric(
  row: StandingRow,
  view: RoundViewConfig,
  seasonSlug: SeasonSlug
): string | null {
  if (view.layoutVariant === "quiz_ladder") {
    const max =
      getRoundMechanics(seasonSlug, view.latestPublishedRound)?.kind === "quiz"
        ? (getRoundMechanics(seasonSlug, view.latestPublishedRound) as { maxPoints: number })
            .maxPoints
        : 10;
    return formatQuizScore(row.round1_points, max);
  }
  if (view.layoutVariant === "survival_roster") {
    return formatRound2Status(row);
  }
  if (view.layoutVariant === "hearts_roster") {
    const hearts = heartsRemaining(row);
    if (hearts === null) return "—";
    return `${hearts} ♥`;
  }
  if (view.layoutVariant === "percentage_score") {
    const pts = roundPointsForRound(row, view.latestPublishedRound);
    if (pts === null) return "—";
    return `${pts}%`;
  }
  if (view.layoutVariant === "judged_score") {
    const pts = roundPointsForRound(row, view.latestPublishedRound);
    if (pts === null) return "—";
    return `${judgedScoreLabel(pts)} · ${pts}%`;
  }
  if (view.layoutVariant === "finish_order_champions") {
    if (row.round3_finish_order != null && row.round3_finish_order <= 3) {
      return `#${row.round3_finish_order}`;
    }
    if (row.round3_finish_order != null) {
      return "Qualified";
    }
    return formatRound3EliminatedSubtext(row) ?? "—";
  }
  return String(row.total_points);
}

export function survivalCounts(rows: StandingRow[]): {
  standing: number;
  fallen: number;
} {
  let standing = 0;
  let fallen = 0;
  for (const row of rows) {
    if (round2Survived(row)) standing++;
    else if (round2Survived(row) === false) fallen++;
  }
  return { standing, fallen };
}

export function advancingZoneCounts(
  rows: StandingRow[],
  _advancementCutoff: number
): { advancing: number; tieBreaker: number; eliminated: number } {
  let advancing = 0;
  let tieBreaker = 0;
  let eliminated = 0;
  for (const row of rows) {
    if (row.status === "tie_breaker") tieBreaker++;
    else if (row.status === "eliminated") eliminated++;
    else advancing++;
  }
  return { advancing, tieBreaker, eliminated };
}

/** Rank where the cut line should render — after any tied score block at the cutoff. */
export function resolveCutLineRank(
  rows: StandingRow[],
  advancementCutoff: number,
  scoreFn: (row: StandingRow) => number | null
): number | null {
  if (advancementCutoff <= 0 || rows.length <= advancementCutoff) return null;

  const cutoffScore = scoreFn(rows[advancementCutoff - 1]);
  if (cutoffScore === null) return advancementCutoff + 1;

  let blockStart = advancementCutoff - 1;
  while (blockStart > 0 && scoreFn(rows[blockStart - 1]) === cutoffScore) {
    blockStart--;
  }
  let blockEnd = advancementCutoff - 1;
  while (
    blockEnd < rows.length - 1 &&
    scoreFn(rows[blockEnd + 1]) === cutoffScore
  ) {
    blockEnd++;
  }

  const lineRank = blockEnd + 2;
  return lineRank <= rows.length ? lineRank : null;
}
