import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  advancementSlot,
  pickKnockoutMatchWinner,
} from "./knockout-advance";

describe("advancementSlot", () => {
  it("maps r16 match 0 winner to qf match 0 slot a", () => {
    assert.deepEqual(advancementSlot("r16", 0), {
      round: "qf",
      matchIndex: 0,
      side: "a",
    });
  });

  it("maps r16 match 1 winner to qf match 0 slot b", () => {
    assert.deepEqual(advancementSlot("r16", 1), {
      round: "qf",
      matchIndex: 0,
      side: "b",
    });
  });

  it("returns null for final", () => {
    assert.equal(advancementSlot("final", 0), null);
  });
});

describe("pickKnockoutMatchWinner", () => {
  it("picks higher score", () => {
    assert.equal(
      pickKnockoutMatchWinner("a", "b", { a: 10, b: 7 }),
      "a"
    );
  });

  it("throws on tie", () => {
    assert.throws(
      () => pickKnockoutMatchWinner("a", "b", { a: 5, b: 5 }),
      /tie/i
    );
  });
});
