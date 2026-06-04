import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { StandingRow } from "@/lib/types";
import {
  buildJulyRegionalPlayoffMap,
  buildNationalsConvergenceMap,
  survivedAfterRound,
  connectorBranchIds,
  JULY_ENTRANTS_PER_REGION,
} from "./playoff-map";

function julyRow(
  partial: Partial<StandingRow> & Pick<StandingRow, "branch_id" | "rank">
): StandingRow {
  return {
    branch_code: partial.branch_code ?? "B001",
    branch_name: partial.branch_name ?? "Test Branch",
    area: partial.area ?? "Area 1",
    region: partial.region ?? "luzon",
    total_points: partial.total_points ?? 0,
    round1_points: partial.round1_points ?? null,
    round2_points: partial.round2_points ?? null,
    round3_points: partial.round3_points ?? null,
    total_wins: partial.total_wins ?? 0,
    status: partial.status ?? "active",
    ...partial,
  };
}

describe("survivedAfterRound", () => {
  it("eliminated in round 1 does not survive after R1", () => {
    const row = julyRow({
      branch_id: "a",
      rank: 5,
      eliminated_in_round: 1,
    });
    assert.equal(survivedAfterRound(row, 1), false);
  });

  it("active branch survives through unpublished rounds", () => {
    const row = julyRow({ branch_id: "a", rank: 1, eliminated_in_round: null });
    assert.equal(survivedAfterRound(row, 2), true);
  });

  it("tie-breaker without manual advance fails cut", () => {
    const row = julyRow({
      branch_id: "a",
      rank: 4,
      tie_breaker_in_round: 1,
    });
    assert.equal(survivedAfterRound(row, 1), false);
  });

  it("manual advance rescues tie-breaker", () => {
    const row = julyRow({
      branch_id: "a",
      rank: 4,
      tie_breaker_in_round: 1,
      manually_advanced_after_round: 1,
    });
    assert.equal(survivedAfterRound(row, 1), true);
  });
});

describe("buildJulyRegionalPlayoffMap", () => {
  const eightRows: StandingRow[] = Array.from({ length: 8 }, (_, i) =>
    julyRow({
      branch_id: `b${i}`,
      branch_name: `Branch ${i + 1}`,
      rank: i + 1,
      round1_points: 15 - i,
      region: "luzon",
    })
  );

  it("pre-publish shows field column; later columns hidden", () => {
    const model = buildJulyRegionalPlayoffMap({
      region: "luzon",
      rows: eightRows,
      latestPublishedRound: 0,
    });
    assert.equal(model.columns[0].slots.length, JULY_ENTRANTS_PER_REGION);
    assert.equal(model.columns[0].slots[0].branch_name, "Branch 1");
    assert.equal(model.columns[1].isRevealed, false);
    assert.equal(model.badgeLabel, "8 TEAMS");
  });

  it("after R1 reveals top 4 survivors column", () => {
    const rows = eightRows.map((r, i) =>
      i < 4
        ? r
        : { ...r, eliminated_in_round: 1, status: "eliminated" as const }
    );
    const model = buildJulyRegionalPlayoffMap({
      region: "luzon",
      rows,
      latestPublishedRound: 1,
    });
    assert.equal(model.columns[1].slots.length, 4);
    assert.equal(model.remainingCount, 4);
    assert.equal(model.columns[1].isRevealed, true);
  });

  it("after R3 shows single champion", () => {
    const rows = eightRows.map((r, i) => {
      if (i === 0) {
        return {
          ...r,
          status: "regional_finalist" as const,
          round2_points: 1,
          round3_points: 5,
        };
      }
      return {
        ...r,
        eliminated_in_round: i < 4 ? 1 : i < 6 ? 2 : 3,
        status: "eliminated" as const,
      };
    });
    const model = buildJulyRegionalPlayoffMap({
      region: "luzon",
      rows,
      latestPublishedRound: 3,
    });
    assert.equal(model.columns[3].slots.length, 1);
    assert.equal(model.columns[3].slots[0].isChampion, true);
    assert.equal(model.badgeLabel, "CHAMPION");
  });
});

describe("buildNationalsConvergenceMap", () => {
  it("maps three regional champions", () => {
    const rows: StandingRow[] = (
      ["luzon", "ncr", "vismin"] as const
    ).map((region, i) =>
      julyRow({
        branch_id: region,
        branch_name: `${region} winner`,
        region,
        rank: i + 1,
        status: i === 0 ? "champion" : "advanced",
        total_points: 30 - i,
      })
    );
    const model = buildNationalsConvergenceMap({
      rows,
      latestPublishedRound: 1,
    });
    assert.equal(model.regionalChampions.length, 3);
    assert.equal(model.finalsChampion?.branch_id, "luzon");
  });
});

describe("connectorBranchIds", () => {
  it("returns ids present in both columns", () => {
    const from = {
      id: 0,
      label: "",
      subtitle: "",
      survivorCount: 8,
      isRevealed: true,
      slots: [
        {
          branch_id: "a",
          branch_name: "A",
          branch_code: "",
          rank: 1,
          status: "active" as const,
          roundScore: 10,
        },
        {
          branch_id: "b",
          branch_name: "B",
          branch_code: "",
          rank: 2,
          status: "eliminated" as const,
          roundScore: 5,
        },
      ],
    };
    const to = {
      id: 1,
      label: "",
      subtitle: "",
      survivorCount: 4,
      isRevealed: true,
      slots: [
        {
          branch_id: "a",
          branch_name: "A",
          branch_code: "",
          rank: 1,
          status: "active" as const,
          roundScore: 10,
        },
      ],
    };
    const ids = connectorBranchIds(from, to);
    assert.deepEqual([...ids], ["a"]);
  });
});
