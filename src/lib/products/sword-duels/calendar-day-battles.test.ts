import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildCalendarDayAreaCards,
  findBranchOnCalendarDay,
  type SdCalendarAreaBracket,
} from "./calendar-day-battles";
import type { SdAreaSchedulesConfig } from "./area-schedules";

const brackets: SdCalendarAreaBracket[] = [
  {
    area: "Area 1",
    groupA: [
      { id: "a1", name: "SKYONE ILOCOS SUR", code: "703" },
      { id: "a2", name: "BAYAMBANG PANGASINAN", code: "704" },
    ],
    groupB: [
      { id: "b1", name: "SM CITY BAGUIO", code: "801" },
      { id: "b2", name: "SAN CARLOS PANGASINAN", code: "802" },
    ],
  },
];

const schedules: SdAreaSchedulesConfig = {
  byArea: {
    "Area 1": {
      groupA: "2026-06-15T10:00:00+08:00",
      groupB: "2026-06-15T11:00:00+08:00",
      hostGroupA: "Ms. Jill",
      hostGroupB: "Ms. Jill",
    },
  },
  nationals: {},
};

describe("calendar-day-battles", () => {
  it("builds area cards with both sets on the same day", () => {
    const day = new Date(2026, 5, 15);
    const cards = buildCalendarDayAreaCards(day, brackets, schedules);
    assert.equal(cards.length, 1);
    assert.equal(cards[0]!.area, "Area 1");
    assert.equal(cards[0]!.sets.length, 2);
    assert.equal(cards[0]!.sets[0]!.branches.length, 2);
    assert.match(cards[0]!.sets[0]!.timeLabel ?? "", /10:00/);
    assert.match(cards[0]!.sets[1]!.timeLabel ?? "", /11:00/);
  });

  it("finds a branch match for viewer lookup", () => {
    const day = new Date(2026, 5, 15);
    const cards = buildCalendarDayAreaCards(day, brackets, schedules);
    const match = findBranchOnCalendarDay("baguio", cards);
    assert.ok(match);
    assert.equal(match!.branch.name, "SM CITY BAGUIO");
    assert.equal(match!.setLabel, "Set 2");
    assert.equal(match!.area, "Area 1");
  });
});
