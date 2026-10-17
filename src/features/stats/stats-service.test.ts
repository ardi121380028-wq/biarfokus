import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateStreaks,
  dailyFocusToCsv,
  formatLocalDay,
  getRangeDays,
  getWeekdayIndex,
  mapDailyFocusRow,
  shiftDay,
  summarizeRange,
} from "./stats-service.ts";

// 2026-10-16 is a Friday.
const TODAY = "2026-10-16";

describe("calendar day helpers", () => {
  it("formats a local date and shifts days across month and year boundaries", () => {
    assert.equal(formatLocalDay(new Date(2026, 9, 6, 23, 59)), "2026-10-06");
    assert.equal(shiftDay("2026-03-01", -1), "2026-02-28");
    assert.equal(shiftDay("2026-12-31", 1), "2027-01-01");
    assert.throws(() => shiftDay("16-10-2026", 1), /Format tanggal tidak valid/);
  });

  it("returns Monday-first weekday indexes", () => {
    assert.equal(getWeekdayIndex("2026-10-12"), 0);
    assert.equal(getWeekdayIndex(TODAY), 4);
    assert.equal(getWeekdayIndex("2026-10-18"), 6);
  });
});

describe("summarizeRange", () => {
  const daily = [
    { day: "2026-10-12", focusSeconds: 1500, pomodoroCount: 1 },
    { day: "2026-10-16", focusSeconds: 3000, pomodoroCount: 2 },
    { day: "2026-09-20", focusSeconds: 2700, pomodoroCount: 1 },
  ];

  it("builds a Monday-to-Sunday series for the current week", () => {
    const days = getRangeDays("week", TODAY);
    assert.equal(days[0], "2026-10-12");
    assert.equal(days[6], "2026-10-18");

    const summary = summarizeRange(daily, "week", TODAY);
    assert.equal(summary.focusSeconds, 4500);
    assert.equal(summary.pomodoroCount, 3);
    assert.equal(summary.series[0].focusSeconds, 1500);
    assert.equal(summary.series[4].focusSeconds, 3000);
    assert.equal(summary.series[6].focusSeconds, 0);
  });

  it("covers exactly the last 7 and 30 days ending today", () => {
    const sevenDays = summarizeRange(daily, "7d", TODAY);
    assert.equal(sevenDays.series.length, 7);
    assert.equal(sevenDays.series[0].day, "2026-10-10");
    assert.equal(sevenDays.series[6].day, TODAY);
    assert.equal(sevenDays.pomodoroCount, 3);

    const thirtyDays = summarizeRange(daily, "30d", TODAY);
    assert.equal(thirtyDays.series.length, 30);
    assert.equal(thirtyDays.series[0].day, "2026-09-17");
    assert.equal(thirtyDays.focusSeconds, 7200);
    assert.equal(thirtyDays.pomodoroCount, 4);
  });
});

describe("calculateStreaks", () => {
  const active = (day: string) => ({ day, focusSeconds: 1500, pomodoroCount: 1 });

  it("counts consecutive days ending today", () => {
    const streaks = calculateStreaks(
      [active("2026-10-14"), active("2026-10-15"), active(TODAY)],
      TODAY,
    );
    assert.deepEqual(streaks, { current: 3, longest: 3 });
  });

  it("keeps the streak alive until the day ends when nothing is done today", () => {
    const streaks = calculateStreaks([active("2026-10-14"), active("2026-10-15")], TODAY);
    assert.equal(streaks.current, 2);
  });

  it("resets the current streak after a missed day but remembers the longest", () => {
    const streaks = calculateStreaks(
      [
        active("2026-10-01"),
        active("2026-10-02"),
        active("2026-10-03"),
        active("2026-10-04"),
        active("2026-10-14"),
      ],
      TODAY,
    );
    assert.deepEqual(streaks, { current: 0, longest: 4 });
  });

  it("ignores days without completed pomodoros", () => {
    const streaks = calculateStreaks(
      [{ day: TODAY, focusSeconds: 0, pomodoroCount: 0 }],
      TODAY,
    );
    assert.deepEqual(streaks, { current: 0, longest: 0 });
  });
});

describe("daily focus rows and CSV export", () => {
  it("maps database rows and rejects malformed ones", () => {
    assert.deepEqual(
      mapDailyFocusRow({ day: "2026-10-16", focus_seconds: "3000", pomodoro_count: 2 }),
      { day: TODAY, focusSeconds: 3000, pomodoroCount: 2 },
    );
    assert.throws(
      () => mapDailyFocusRow({ day: "bukan-tanggal", focus_seconds: 1, pomodoro_count: 1 }),
      /tidak valid/,
    );
    assert.throws(() => mapDailyFocusRow(null), /tidak valid/);
  });

  it("exports sorted CSV with a header row", () => {
    const csv = dailyFocusToCsv([
      { day: "2026-10-16", focusSeconds: 3000, pomodoroCount: 2 },
      { day: "2026-10-12", focusSeconds: 1500, pomodoroCount: 1 },
    ]);
    assert.equal(
      csv,
      [
        "tanggal,fokus_detik,fokus_menit,pomodoro_selesai",
        "2026-10-12,1500,25,1",
        "2026-10-16,3000,50,2",
      ].join("\n"),
    );
  });
});
