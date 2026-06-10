import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatScheduleTimeLabel,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from "./area-schedule-input";

describe("area-schedule-input", () => {
  it("stores datetime-local as Philippine wall time (+08:00)", () => {
    assert.equal(
      fromDatetimeLocalValue("2026-06-10T10:00"),
      "2026-06-10T10:00:00+08:00"
    );
  });

  it("formats ISO instants in Philippine time regardless of host TZ", () => {
    assert.equal(
      formatScheduleTimeLabel("2026-06-10T02:00:00.000Z"),
      formatScheduleTimeLabel("2026-06-10T10:00:00+08:00")
    );
    assert.match(formatScheduleTimeLabel("2026-06-10T10:00:00+08:00"), /10:00/);
  });

  it("round-trips datetime-local through ISO in PH time", () => {
    const iso = fromDatetimeLocalValue("2026-06-15T14:30");
    assert.equal(iso, "2026-06-15T14:30:00+08:00");
    assert.equal(toDatetimeLocalValue(iso), "2026-06-15T14:30");
  });
});
