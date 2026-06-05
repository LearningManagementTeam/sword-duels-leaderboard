import { describe, expect, it } from "vitest";
import {
  pickWildcardRoundWinner,
  resolveWildcardFromLosers,
} from "./wildcard-selection";

describe("resolveWildcardFromLosers", () => {
  it("auto-selects sole 2nd-highest tier loser", () => {
    const result = resolveWildcardFromLosers([
      { id: "a", area: "Area 1", repName: "A", areaFinalScore: 8 },
      { id: "b", area: "Area 2", repName: "B", areaFinalScore: 6 },
      { id: "c", area: "Area 3", repName: "C", areaFinalScore: 4 },
    ]);
    expect(result.kind).toBe("auto");
    if (result.kind === "auto") {
      expect(result.candidate.id).toBe("b");
    }
  });

  it("returns tiebreak when multiple share 2nd-highest tier", () => {
    const result = resolveWildcardFromLosers([
      { id: "a", area: "Area 1", repName: "A", areaFinalScore: 7 },
      { id: "b", area: "Area 2", repName: "B", areaFinalScore: 6 },
      { id: "c", area: "Area 3", repName: "C", areaFinalScore: 6 },
      { id: "d", area: "Area 4", repName: "D", areaFinalScore: 5 },
    ]);
    expect(result.kind).toBe("tiebreak");
    if (result.kind === "tiebreak") {
      expect(result.tiedScore).toBe(6);
      expect(result.candidates).toHaveLength(2);
    }
  });
});

describe("pickWildcardRoundWinner", () => {
  it("picks highest wildcard round score", () => {
    const candidates = [
      { id: "a", area: "Area 2", repName: "B", areaFinalScore: 6 },
      { id: "b", area: "Area 3", repName: "C", areaFinalScore: 6 },
    ];
    const winner = pickWildcardRoundWinner(candidates, { a: 4, b: 7 });
    expect(winner?.id).toBe("b");
  });
});
