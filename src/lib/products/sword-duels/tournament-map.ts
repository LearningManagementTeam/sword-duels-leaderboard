import type { PlayoffSlot } from "@/lib/playoff-map";
import type { Region } from "@/lib/scoring-config";
import type {
  SdAreaBracket,
  SdAreaGroupBranch,
  SdSet,
  SdSetScore,
  SdSetType,
} from "./types";
import { computeSetResults, type ScoredBranch } from "./scoring";

export interface TournamentColumn {
  id: string;
  label: string;
  subtitle: string;
  slots: PlayoffSlot[];
  isRevealed: boolean;
  lane: "a" | "b" | "final";
}

export interface AreaTournamentMapModel {
  area: string;
  region: Region;
  badgeLabel: string;
  columns: TournamentColumn[];
  areaChampion: PlayoffSlot | null;
  groupAWinnerId: string | null;
  groupBWinnerId: string | null;
}

function toSlot(
  row: ScoredBranch,
  opts?: { isChampion?: boolean; eliminated?: boolean }
): PlayoffSlot {
  return {
    branch_id: row.branch_id,
    branch_name: row.branch_name,
    branch_code: row.branch_code,
    rank: row.rank,
    status: opts?.isChampion
      ? "champion"
      : opts?.eliminated
        ? "eliminated"
        : row.is_winner
          ? "advanced"
          : "active",
    representative_1: row.representative_1,
    roundScore: row.points,
    isChampion: opts?.isChampion,
    eliminatedInRound: opts?.eliminated ? 1 : null,
  };
}

function placeholderSlot(label: string, index: number): PlayoffSlot {
  return {
    branch_id: null,
    branch_name: label,
    branch_code: "",
    rank: index + 1,
    status: "placeholder",
    roundScore: null,
    isPlaceholder: true,
  };
}

function setByType(sets: SdSet[], type: SdSetType): SdSet | undefined {
  return sets.find((s) => s.set_type === type);
}

function scoresForSet(
  setId: string | undefined,
  allScores: Map<string, SdSetScore[]>
): SdSetScore[] {
  if (!setId) return [];
  return allScores.get(setId) ?? [];
}

function isPublished(set: SdSet | undefined): boolean {
  return set?.status === "published";
}

export function buildAreaTournamentMap(input: {
  bracket: SdAreaBracket;
  sets: SdSet[];
  scoresBySetId: Map<string, SdSetScore[]>;
}): AreaTournamentMapModel {
  const { bracket, sets } = input;
  const region = bracket.region as Region;

  const groupASet = setByType(sets, "group_a");
  const groupBSet = setByType(sets, "group_b");
  const finalSet = setByType(sets, "area_final");

  const groupAResults = computeSetResults(
    bracket.groupA,
    scoresForSet(groupASet?.id, input.scoresBySetId),
    groupASet?.scoring_mode ?? "high_score"
  );
  const groupBResults = computeSetResults(
    bracket.groupB,
    scoresForSet(groupBSet?.id, input.scoresBySetId),
    groupBSet?.scoring_mode ?? "high_score"
  );

  const groupAWinnerId =
    isPublished(groupASet) && groupASet?.winner_branch_id
      ? groupASet.winner_branch_id
      : isPublished(groupASet)
        ? groupAResults.winnerId
        : null;

  const groupBWinnerId =
    isPublished(groupBSet) && groupBSet?.winner_branch_id
      ? groupBSet.winner_branch_id
      : isPublished(groupBSet)
        ? groupBResults.winnerId
        : null;

  const finalParticipants = [bracket.groupA, bracket.groupB]
    .flat()
    .filter(
      (b) =>
        b.branch_id === groupAWinnerId || b.branch_id === groupBWinnerId
    );

  const finalResults = computeSetResults(
    finalParticipants,
    scoresForSet(finalSet?.id, input.scoresBySetId),
    finalSet?.scoring_mode ?? "high_score"
  );

  const areaChampionId =
    isPublished(finalSet) && finalSet?.winner_branch_id
      ? finalSet.winner_branch_id
      : isPublished(finalSet)
        ? finalResults.winnerId
        : null;

  const groupAFieldSlots: PlayoffSlot[] = isPublished(groupASet)
    ? groupAResults.ranked.map((r) =>
        toSlot(r, {
          isChampion: r.branch_id === groupAWinnerId,
          eliminated: r.branch_id !== groupAWinnerId,
        })
      )
    : bracket.groupA.map((b, i) => ({
        branch_id: b.branch_id,
        branch_name: b.branch_name,
        branch_code: b.branch_code,
        rank: i + 1,
        status: "active" as const,
        representative_1: b.representative_1,
        roundScore: scoresForSet(groupASet?.id, input.scoresBySetId).find(
          (s) => s.branch_id === b.branch_id
        )?.points ?? null,
      }));

  const groupBFieldSlots: PlayoffSlot[] = isPublished(groupBSet)
    ? groupBResults.ranked.map((r) =>
        toSlot(r, {
          isChampion: r.branch_id === groupBWinnerId,
          eliminated: r.branch_id !== groupBWinnerId,
        })
      )
    : bracket.groupB.map((b, i) => ({
        branch_id: b.branch_id,
        branch_name: b.branch_name,
        branch_code: b.branch_code,
        rank: i + 1,
        status: "active" as const,
        representative_1: b.representative_1,
        roundScore: scoresForSet(groupBSet?.id, input.scoresBySetId).find(
          (s) => s.branch_id === b.branch_id
        )?.points ?? null,
      }));

  function winnerSlot(
    winnerId: string,
    ranked: ScoredBranch[],
    pool: SdAreaGroupBranch[]
  ): PlayoffSlot {
    const row = ranked.find((r) => r.branch_id === winnerId);
    if (row) return toSlot(row, { isChampion: !areaChampionId });
    const b = pool.find((x) => x.branch_id === winnerId);
    return {
      branch_id: winnerId,
      branch_name: b?.branch_name ?? "Winner",
      branch_code: b?.branch_code ?? "",
      rank: 1,
      status: "advanced",
      representative_1: b?.representative_1,
      roundScore: null,
    };
  }

  const groupAWinnerSlot: PlayoffSlot[] = groupAWinnerId
    ? [winnerSlot(groupAWinnerId, groupAResults.ranked, bracket.groupA)]
    : [placeholderSlot("Group A winner", 0)];

  const groupBWinnerSlot: PlayoffSlot[] = groupBWinnerId
    ? [winnerSlot(groupBWinnerId, groupBResults.ranked, bracket.groupB)]
    : [placeholderSlot("Group B winner", 0)];

  const finalSlots: PlayoffSlot[] =
    groupAWinnerId && groupBWinnerId
      ? isPublished(finalSet)
        ? finalResults.ranked.map((r) =>
            toSlot(r, {
              isChampion: r.branch_id === areaChampionId,
              eliminated: r.branch_id !== areaChampionId,
            })
          )
        : finalParticipants.map((b, i) => ({
            branch_id: b.branch_id,
            branch_name: b.branch_name,
            branch_code: b.branch_code,
            rank: i + 1,
            status: "active" as const,
            representative_1: b.representative_1,
            roundScore:
              scoresForSet(finalSet?.id, input.scoresBySetId).find(
                (s) => s.branch_id === b.branch_id
              )?.points ?? null,
          }))
      : [placeholderSlot("Awaiting group winners", 0)];

  const areaChampion: PlayoffSlot | null = areaChampionId
    ? (() => {
        const row = finalResults.ranked.find((r) => r.branch_id === areaChampionId);
        if (row) return toSlot(row, { isChampion: true });
        const b = finalParticipants.find((x) => x.branch_id === areaChampionId);
        if (!b) return null;
        return {
          branch_id: b.branch_id,
          branch_name: b.branch_name,
          branch_code: b.branch_code,
          rank: 1,
          status: "champion" as const,
          representative_1: b.representative_1,
          roundScore: null,
          isChampion: true,
        };
      })()
    : null;

  let badgeLabel = `${bracket.branchCount} BRANCHES`;
  if (areaChampionId) badgeLabel = "AREA REP";
  else if (groupAWinnerId && groupBWinnerId) badgeLabel = "FINAL SET";
  else if (groupAWinnerId || groupBWinnerId) badgeLabel = "1 GROUP DONE";

  const columns: TournamentColumn[] = [
    {
      id: "group_a_field",
      label: "Set 1 · Group A",
      subtitle: `${bracket.groupA.length} branches battle`,
      slots: groupAFieldSlots,
      isRevealed: true,
      lane: "a",
    },
    {
      id: "group_a_winner",
      label: "Spot 1",
      subtitle: "Group A winner",
      slots: groupAWinnerSlot,
      isRevealed: !!groupAWinnerId || isPublished(groupASet),
      lane: "a",
    },
    {
      id: "group_b_field",
      label: "Set 2 · Group B",
      subtitle: `${bracket.groupB.length} branches battle`,
      slots: groupBFieldSlots,
      isRevealed: true,
      lane: "b",
    },
    {
      id: "group_b_winner",
      label: "Spot 2",
      subtitle: "Group B winner",
      slots: groupBWinnerSlot,
      isRevealed: !!groupBWinnerId || isPublished(groupBSet),
      lane: "b",
    },
    {
      id: "area_final",
      label: "Area representative",
      subtitle: "Spot 1 vs Spot 2",
      slots: areaChampion
        ? [areaChampion]
        : finalSlots,
      isRevealed: !!(groupAWinnerId && groupBWinnerId),
      lane: "final",
    },
  ];

  return {
    area: bracket.area,
    region,
    badgeLabel,
    columns,
    areaChampion,
    groupAWinnerId,
    groupBWinnerId,
  };
}
