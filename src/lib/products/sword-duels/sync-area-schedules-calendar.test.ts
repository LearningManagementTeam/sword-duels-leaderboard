import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EventsCalendarConfig } from "@/lib/events-calendar";
import {
  areaScheduleCalendarEventId,
  calendarEventsForAreaSchedule,
  mergeAreaSchedulesIntoCalendar,
} from "./sync-area-schedules-calendar";

describe("sync-area-schedules-calendar", () => {
  it("builds three calendar events with distinct times and hosts", () => {
    const dates = {
      groupA: "2026-06-10T01:00:00.000Z",
      groupB: "2026-06-11T02:00:00.000Z",
      areaFinal: "2026-06-12T03:00:00.000Z",
      hostGroupA: "Host A",
      hostGroupB: "Host B",
      hostAreaFinal: "Host Final",
    };

    const events = calendarEventsForAreaSchedule("Area 1", dates);
    assert.equal(events.length, 3);
    assert.deepEqual(
      events.map((e) => e.startAt),
      [dates.groupA, dates.groupB, dates.areaFinal]
    );
    assert.equal(events[0].description, "Host / Trainer: Host A");
    assert.equal(events[1].description, "Host / Trainer: Host B");
    assert.equal(events[2].description, "Host / Trainer: Host Final");
    assert.equal(
      events[0].id,
      areaScheduleCalendarEventId("Area 1", "group_a")
    );
  });

  it("replaces synced rows for one area without touching others", () => {
    const calendar: EventsCalendarConfig = {
      events: [
        {
          id: areaScheduleCalendarEventId("Area 1", "group_a"),
          kind: "area_duels",
          title: "Old Set 1",
          startAt: "2026-01-01T00:00:00.000Z",
          published: true,
          program: "sword_duels",
        },
        {
          id: "manual-event",
          kind: "area_duels",
          title: "Manual",
          startAt: "2026-05-01T00:00:00.000Z",
          published: true,
          program: "sword_duels",
        },
      ],
    };

    const merged = mergeAreaSchedulesIntoCalendar(calendar, "Area 1", {
      groupA: "2026-06-10T01:00:00.000Z",
      hostGroupA: "New Host",
    });

    assert.ok(merged.events.find((e) => e.id === "manual-event"));
    assert.equal(
      merged.events.find(
        (e) => e.id === areaScheduleCalendarEventId("Area 1", "group_b")
      ),
      undefined
    );
    const updated = merged.events.find(
      (e) => e.id === areaScheduleCalendarEventId("Area 1", "group_a")
    );
    assert.equal(updated?.startAt, "2026-06-10T01:00:00.000Z");
    assert.equal(updated?.description, "Host / Trainer: New Host");
  });
});
