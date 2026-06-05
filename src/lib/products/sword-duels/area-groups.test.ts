import { describe, expect, it } from "vitest";
import { splitAreaIntoGroups } from "./area-groups";
import type { Branch } from "@/lib/types";

function branch(code: string, area = "Area 1"): Branch {
  return {
    id: code,
    branch_code: code,
    branch_name: `Branch ${code}`,
    area,
    region: "luzon",
  };
}

describe("splitAreaIntoGroups", () => {
  it("splits 10 branches into 5 and 5", () => {
    const branches = Array.from({ length: 10 }, (_, i) =>
      branch(String(i + 1).padStart(2, "0"))
    );
    const { groupA, groupB } = splitAreaIntoGroups(branches);
    expect(groupA).toHaveLength(5);
    expect(groupB).toHaveLength(5);
    expect(groupA[0].branch_code).toBe("01");
    expect(groupB[0].branch_code).toBe("06");
  });

  it("puts extra branch in group A when odd count", () => {
    const branches = Array.from({ length: 7 }, (_, i) =>
      branch(String(i + 1))
    );
    const { groupA, groupB } = splitAreaIntoGroups(branches);
    expect(groupA).toHaveLength(4);
    expect(groupB).toHaveLength(3);
  });
});
