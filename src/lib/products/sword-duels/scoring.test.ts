import { describe, expect, it } from "vitest";
import { computeSetResults } from "./scoring";
import type { SdAreaGroupBranch } from "./types";

function branch(id: string, code: string): SdAreaGroupBranch {
  return {
    branch_id: id,
    branch_code: code,
    branch_name: `Branch ${code}`,
    area: "Area 1",
    region: "luzon",
    group_label: "a",
    sort_order: 1,
  };
}

describe("computeSetResults", () => {
  it("high score mode picks highest points", () => {
    const participants = [branch("a", "01"), branch("b", "02"), branch("c", "03")];
    const { winnerId, ranked } = computeSetResults(
      participants,
      [
        { branch_id: "a", points: 5, hearts_remaining: null, is_eliminated: false },
        { branch_id: "b", points: 9, hearts_remaining: null, is_eliminated: false },
        { branch_id: "c", points: 7, hearts_remaining: null, is_eliminated: false },
      ],
      "high_score"
    );
    expect(winnerId).toBe("b");
    expect(ranked[0].branch_id).toBe("b");
    expect(ranked[0].is_winner).toBe(true);
  });

  it("survival mode picks highest score among top 2 survivors", () => {
    const participants = [branch("a", "01"), branch("b", "02"), branch("c", "03")];
    const { winnerId } = computeSetResults(
      participants,
      [
        { branch_id: "a", points: 10, hearts_remaining: 0, is_eliminated: true },
        { branch_id: "b", points: 8, hearts_remaining: 2, is_eliminated: false },
        { branch_id: "c", points: 9, hearts_remaining: 1, is_eliminated: false },
      ],
      "survival"
    );
    expect(winnerId).toBe("c");
  });
});
