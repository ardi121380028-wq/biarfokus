import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateEventPosition,
  getCurrentTimeIndicatorPosition,
  getEventsForDate,
  minutesToTime,
  timeToMinutes,
} from "./calendar-service.ts";
import type { CalendarEvent } from "../../types/domain.ts";

describe("calendar-service", () => {
  it("converts time string to minutes and back accurately", () => {
    assert.equal(timeToMinutes("08:30"), 510);
    assert.equal(timeToMinutes("00:00"), 0);
    assert.equal(timeToMinutes("23:45"), 1425);

    assert.equal(minutesToTime(510), "08:30");
    assert.equal(minutesToTime(0), "00:00");
  });

  it("calculates event position and height based on 60px/hour and 06:00 start", () => {
    // 08:00 to 16:00:
    // start is 2 hours after 06:00 -> top = 2 * 60 = 120px
    // duration is 8 hours -> height = 8 * 60 = 480px
    const pos = calculateEventPosition("08:00", "16:00", 6, 60);
    assert.equal(pos.top, 120);
    assert.equal(pos.height, 480);
  });

  it("calculates current time indicator position", () => {
    // At 10:30 (4.5 hours after 06:00): top = 4.5 * 60 = 270px
    const date = new Date("2026-10-18T10:30:00");
    const top = getCurrentTimeIndicatorPosition(date, 6, 60);
    assert.equal(top, 270);
  });

  it("filters and sorts events for a given date", () => {
    const events: CalendarEvent[] = [
      {
        id: "2",
        title: "Later",
        date: "2026-10-18",
        startTime: "16:00",
        endTime: "17:00",
        color: "#fff",
      },
      {
        id: "1",
        title: "Earlier",
        date: "2026-10-18",
        startTime: "08:00",
        endTime: "10:00",
        color: "#fff",
      },
      {
        id: "3",
        title: "Other Date",
        date: "2026-10-19",
        startTime: "08:00",
        endTime: "10:00",
        color: "#fff",
      },
    ];

    const result = getEventsForDate(events, "2026-10-18");
    assert.equal(result.length, 2);
    assert.equal(result[0].id, "1");
    assert.equal(result[1].id, "2");
  });
});
