import { describe, expect, it } from "vitest";
import { splitAreaIntoGroups } from "./area-groups";
import type { Branch } from "@/lib/types";

function branch(
  code: string,
  name: string,
  area = "Area 1"
): Branch {
  return {
    id: code,
    branch_code: code,
    branch_name: name,
    area,
    region: "luzon",
  };
}

describe("splitAreaIntoGroups", () => {
  it("splits 10 branches into 5 and 5 by branch code", () => {
    const branches = Array.from({ length: 10 }, (_, i) =>
      branch(String(i + 1).padStart(2, "0"), `Branch ${i + 1}`)
    );
    const { groupA, groupB } = splitAreaIntoGroups(branches, "branch_code");
    expect(groupA).toHaveLength(5);
    expect(groupB).toHaveLength(5);
    expect(groupA[0].branch_code).toBe("01");
    expect(groupB[0].branch_code).toBe("06");
  });

  it("splits by branch name when mode is branch_name", () => {
    const branches = [
      branch("300", "Zeta Branch"),
      branch("100", "Alpha Branch"),
      branch("200", "Beta Branch"),
      branch("400", "Omega Branch"),
    ];
    const byCode = splitAreaIntoGroups(branches, "branch_code");
    const byName = splitAreaIntoGroups(branches, "branch_name");

    expect(byCode.groupA.map((b) => b.branch_code)).toEqual(["100", "200"]);
    expect(byCode.groupB.map((b) => b.branch_code)).toEqual(["300", "400"]);

    expect(byName.groupA.map((b) => b.branch_name)).toEqual([
      "Alpha Branch",
      "Beta Branch",
    ]);
    expect(byName.groupB.map((b) => b.branch_name)).toEqual([
      "Omega Branch",
      "Zeta Branch",
    ]);
  });

  it("puts extra branch in group A when odd count", () => {
    const branches = Array.from({ length: 7 }, (_, i) =>
      branch(String(i + 1), `Branch ${i + 1}`)
    );
    const { groupA, groupB } = splitAreaIntoGroups(branches);
    expect(groupA).toHaveLength(4);
    expect(groupB).toHaveLength(3);
  });
});
