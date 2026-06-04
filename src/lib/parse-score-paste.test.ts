import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseScorePaste } from "./parse-score-paste";

describe("parseScorePaste", () => {
  it("parses comma-separated rows", () => {
    const { rows, errors } = parseScorePaste("BR001,10\nBR002,8", 15);
    assert.equal(errors.length, 0);
    assert.equal(rows.length, 2);
    assert.equal(rows[0].branch_code, "BR001");
    assert.equal(rows[0].points, 10);
  });

  it("skips header row", () => {
    const { rows, errors } = parseScorePaste(
      "branch_code,points\nBR001,5",
      10
    );
    assert.equal(errors.length, 0);
    assert.equal(rows.length, 1);
  });

  it("rejects out-of-range scores", () => {
    const { errors } = parseScorePaste("BR001,99", 10);
    assert.ok(errors.length > 0);
  });
});
