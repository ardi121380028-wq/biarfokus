import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  addMonths,
  formatPeriodLabel,
  getCurrentTimeTop,
  getEventsForDate,
  getVisibleDays,
  layoutDayEvents,
  minutesToTime,
  parseISODate,
  parseStoredEvents,
  startOfWeek,
  timeToMinutes,
  toISODate,
  validateEventDraft,
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

  it("handles ISO date parsing and formatting without UTC drift", () => {
    const d = new Date(2026, 9, 18); // 18 Oct 2026
    assert.equal(toISODate(d), "2026-10-18");

    const parsed = parseISODate("2026-10-18");
    assert.equal(parsed.getFullYear(), 2026);
    assert.equal(parsed.getMonth(), 9);
    assert.equal(parsed.getDate(), 18);
  });

  it("calculates Monday-first week start and 7 visible days for week mode", () => {
    // 18 Oct 2026 is Sunday. Monday of that week was 12 Oct 2026.
    const sunday = new Date(2026, 9, 18);
    const monday = startOfWeek(sunday);
    assert.equal(toISODate(monday), "2026-10-12");

    const days = getVisibleDays(sunday, "week");
    assert.equal(days.length, 7);
    assert.equal(toISODate(days[0]), "2026-10-12");
    assert.equal(toISODate(days[6]), "2026-10-18");
  });

  it("paginates by days and months correctly", () => {
    const d = new Date(2026, 9, 18);
    assert.equal(toISODate(addDays(d, 7)), "2026-10-25");
    assert.equal(toISODate(addDays(d, -7)), "2026-10-11");

    assert.equal(toISODate(addMonths(d, 1)), "2026-11-18");
    assert.equal(toISODate(addMonths(d, -1)), "2026-09-18");
  });

  it("formats 7-day period label showing range and year", () => {
    const sunday = new Date(2026, 9, 18);
    const weekDays = getVisibleDays(sunday, "week");
    const label = formatPeriodLabel(weekDays);
    // Should contain dates and year 2026
    assert.equal(label.includes("2026"), true);
    assert.equal(label.includes("12"), true);
    assert.equal(label.includes("18"), true);
  });

  it("calculates current time indicator top position", () => {
    const d = new Date(2026, 9, 18, 10, 30);
    // 10.5 hours * 48px = 504px
    assert.equal(getCurrentTimeTop(d, 48), 504);
  });

  it("lays out overlapping events in side-by-side columns", () => {
    const ev1: CalendarEvent = {
      id: "1",
      title: "Event 1",
      date: "2026-10-18",
      startTime: "09:00",
      endTime: "11:00",
      color: "#d50000",
    };
    const ev2: CalendarEvent = {
      id: "2",
      title: "Event 2",
      date: "2026-10-18",
      startTime: "10:00",
      endTime: "12:00",
      color: "#039be5",
    };

    const positioned = layoutDayEvents([ev1, ev2], 48);
    assert.equal(positioned.length, 2);
    // Both share a cluster of 2 columns
    assert.equal(positioned[0].columns, 2);
    assert.equal(positioned[1].columns, 2);
    assert.notEqual(positioned[0].column, positioned[1].column);
  });

  it("validates event drafts", () => {
    assert.equal(
      validateEventDraft({
        title: "",
        date: "2026-10-18",
        startTime: "09:00",
        endTime: "10:00",
        color: "#d50000",
      }),
      "Judul jadwal wajib diisi.",
    );

    assert.equal(
      validateEventDraft({
        title: "Test",
        date: "2026-10-18",
        startTime: "11:00",
        endTime: "10:00",
        color: "#d50000",
      }),
      "Jam selesai harus setelah jam mulai.",
    );

    assert.equal(
      validateEventDraft({
        title: "Valid",
        date: "2026-10-18",
        startTime: "09:00",
        endTime: "10:00",
        color: "#d50000",
      }),
      null,
    );
  });

  it("parses stored events and purges legacy dummy events to ensure empty initial calendar", () => {
    assert.deepEqual(parseStoredEvents(null), []);
    assert.deepEqual(parseStoredEvents(""), []);
    assert.deepEqual(parseStoredEvents("[]"), []);

    // Purges old legacy dummy events
    const legacy = JSON.stringify([
      { id: "event-work-zitline", title: "Working Z", date: "2026-10-18", startTime: "08:00", endTime: "16:00" },
    ]);
    assert.deepEqual(parseStoredEvents(legacy), []);

    // Keeps genuine user events
    const genuine = JSON.stringify([
      { id: "user-event-1", title: "Meeting Klien", date: "2026-10-18", startTime: "10:00", endTime: "11:00" },
    ]);
    const parsed = parseStoredEvents(genuine);
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0].title, "Meeting Klien");
  });

  it("filters events for a specific date", () => {
    const events: CalendarEvent[] = [
      { id: "1", title: "A", date: "2026-10-18", startTime: "08:00", endTime: "09:00", color: "#fff" },
      { id: "2", title: "B", date: "2026-10-19", startTime: "08:00", endTime: "09:00", color: "#fff" },
    ];
    const filtered = getEventsForDate(events, "2026-10-18");
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].id, "1");
  });
});
