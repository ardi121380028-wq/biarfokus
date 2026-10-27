import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  addMonths,
  buildGoogleCalendarUrl,
  formatPeriodLabel,
  generateIcsContent,
  getCurrentTimeTop,
  getEventsForDate,
  getMonthCalendarWeeks,
  getSmartTimeblockSlot,
  getVisibleDays,
  getWeekNumber,
  getYearCalendarMonths,
  layoutDayEvents,
  minutesToTime,
  moveEventTimeRange,
  parseISODate,
  parseStoredEvents,
  resizeEventTimeRange,
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

  it("calculates Sunday-first and Monday-first week start accurately", () => {
    // 18 Oct 2026 is Sunday.
    const sunday = new Date(2026, 9, 18);
    // Sunday-first (Google Calendar standard)
    const sunStart = startOfWeek(sunday, true);
    assert.equal(toISODate(sunStart), "2026-10-18");
    const sunDays = getVisibleDays(sunday, "week", true);
    assert.equal(sunDays.length, 7);
    assert.equal(toISODate(sunDays[0]), "2026-10-18");
    assert.equal(toISODate(sunDays[6]), "2026-10-24");

    // Monday-first
    const monStart = startOfWeek(sunday, false);
    assert.equal(toISODate(monStart), "2026-10-12");
    const monDays = getVisibleDays(sunday, "week", false);
    assert.equal(monDays.length, 7);
    assert.equal(toISODate(monDays[0]), "2026-10-12");
    assert.equal(toISODate(monDays[6]), "2026-10-18");
  });

  it("calculates ISO week number correctly (Week 43 for 18 Oct 2026)", () => {
    const d = new Date(2026, 9, 18);
    assert.equal(getWeekNumber(d), 43);
  });

  it("builds multi-week grid for Month view", () => {
    const anchor = new Date(2026, 9, 18);
    const weeks = getMonthCalendarWeeks(anchor, true);
    // October has 5 or 6 weeks depending on padding
    assert.equal(weeks.length >= 5 && weeks.length <= 6, true);
    for (const w of weeks) {
      assert.equal(w.days.length, 7);
    }
  });

  it("builds 12-month overview for Year view", () => {
    const months = getYearCalendarMonths(2026, true);
    assert.equal(months.length, 12);
    assert.equal(months[0].monthIndex, 0); // January
    assert.equal(months[9].monthIndex, 9); // October
    assert.equal(months[11].monthIndex, 11); // December
  });

  it("paginates by days, months and years correctly", () => {
    const d = new Date(2026, 9, 18);
    assert.equal(toISODate(addDays(d, 7)), "2026-10-25");
    assert.equal(toISODate(addDays(d, -7)), "2026-10-11");

    assert.equal(toISODate(addMonths(d, 1)), "2026-11-18");
    assert.equal(toISODate(addMonths(d, -1)), "2026-09-18");
  });

  it("formats 7-day period label showing range and year", () => {
    const sunday = new Date(2026, 9, 18);
    const weekDays = getVisibleDays(sunday, "week", false);
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

  it("calculates drag-to-move time range with 15-minute snapping", () => {
    // Event with 90-minute duration (1.5 hours)
    // Moving to 08:07 should snap to 08:00 – 09:30
    const moved = moveEventTimeRange(487, 90, 15);
    assert.equal(moved.startTime, "08:00");
    assert.equal(moved.endTime, "09:30");

    // Moving to 14:23 should snap to 14:15 – 15:45 (at 14:23, 23 rounds to 30 => 14:30 – 16:00)
    const moved2 = moveEventTimeRange(14 * 60 + 23, 90, 15);
    assert.equal(moved2.startTime, "14:30");
    assert.equal(moved2.endTime, "16:00");
  });

  it("calculates resize-to-adjust duration from top and bottom handles", () => {
    // Drag bottom handle: start is fixed at 08:00 (480 mins)
    // Dragging end to 10:28 snaps to 10:30
    const resizedBottom = resizeEventTimeRange("bottom", 10 * 60 + 28, 480, 15, 15);
    assert.equal(resizedBottom.startTime, "08:00");
    assert.equal(resizedBottom.endTime, "10:30");

    // Drag top handle: end is fixed at 12:00 (720 mins)
    // Dragging start up to 09:14 snaps to 09:15
    const resizedTop = resizeEventTimeRange("top", 9 * 60 + 14, 720, 15, 15);
    assert.equal(resizedTop.startTime, "09:15");
    assert.equal(resizedTop.endTime, "12:00");
  });

  it("projects recurring daily events across dates", () => {
    const dailyEvent: CalendarEvent = {
      id: "ev-daily",
      title: "Daily Standup",
      date: "2026-10-18", // Sunday
      startTime: "09:00",
      endTime: "09:30",
      color: "#039be5",
      recurrence: { frequency: "daily" },
    };

    // Sunday (base date)
    const sunEvents = getEventsForDate([dailyEvent], "2026-10-18");
    assert.equal(sunEvents.length, 1);
    assert.equal(sunEvents[0].id, "ev-daily");
    assert.equal(sunEvents[0].isRecurringOccurrence, undefined);

    // Monday (virtual occurrence)
    const monEvents = getEventsForDate([dailyEvent], "2026-10-19");
    assert.equal(monEvents.length, 1);
    assert.equal(monEvents[0].isRecurringOccurrence, true);
    assert.equal(monEvents[0].originalEventId, "ev-daily");
    assert.equal(monEvents[0].date, "2026-10-19");

    // Past date before start date should not project
    const pastEvents = getEventsForDate([dailyEvent], "2026-10-17");
    assert.equal(pastEvents.length, 0);
  });

  it("projects weekdays recurrence (Mon-Fri) accurately", () => {
    const weekdayEvent: CalendarEvent = {
      id: "ev-work",
      title: "Deep Work Sprint",
      date: "2026-10-19", // Monday
      startTime: "08:00",
      endTime: "16:00",
      color: "#039be5",
      recurrence: { frequency: "weekdays" },
    };

    // Monday (weekday 1) => matches
    assert.equal(getEventsForDate([weekdayEvent], "2026-10-19").length, 1);
    // Friday (2026-10-23, weekday 5) => matches
    assert.equal(getEventsForDate([weekdayEvent], "2026-10-23").length, 1);
    // Saturday (2026-10-24, weekday 6) => excluded
    assert.equal(getEventsForDate([weekdayEvent], "2026-10-24").length, 0);
    // Sunday (2026-10-25, weekday 0) => excluded
    assert.equal(getEventsForDate([weekdayEvent], "2026-10-25").length, 0);
  });

  it("handles custom days recurrence (repeat except specific days)", () => {
    // Repeat on Mon(1), Tue(2), Thu(4), Fri(5) -> excluding Wed(3), Sat(6), Sun(0)
    const customEvent: CalendarEvent = {
      id: "ev-gym",
      title: "Gym Workout",
      date: "2026-10-19", // Monday
      startTime: "17:00",
      endTime: "18:00",
      color: "#33b679",
      recurrence: {
        frequency: "custom",
        daysOfWeek: [1, 2, 4, 5], // Monday, Tuesday, Thursday, Friday
      },
    };

    // Monday (19th) -> matches
    assert.equal(getEventsForDate([customEvent], "2026-10-19").length, 1);
    // Tuesday (20th) -> matches
    assert.equal(getEventsForDate([customEvent], "2026-10-20").length, 1);
    // Wednesday (21st) -> EXCLUDED (not in daysOfWeek)
    assert.equal(getEventsForDate([customEvent], "2026-10-21").length, 0);
    // Thursday (22nd) -> matches
    assert.equal(getEventsForDate([customEvent], "2026-10-22").length, 1);
    // Friday (23rd) -> matches
    assert.equal(getEventsForDate([customEvent], "2026-10-23").length, 1);
    // Saturday (24th) -> EXCLUDED
    assert.equal(getEventsForDate([customEvent], "2026-10-24").length, 0);
  });

  it("respects untilDate cutoff for recurring events", () => {
    const limitedEvent: CalendarEvent = {
      id: "ev-camp",
      title: "Bootcamp Day",
      date: "2026-10-19",
      startTime: "10:00",
      endTime: "11:00",
      color: "#f6bf26",
      recurrence: {
        frequency: "daily",
        untilDate: "2026-10-21", // only until Oct 21
      },
    };

    assert.equal(getEventsForDate([limitedEvent], "2026-10-19").length, 1);
    assert.equal(getEventsForDate([limitedEvent], "2026-10-21").length, 1);
    // Oct 22 is after cutoff => excluded
    assert.equal(getEventsForDate([limitedEvent], "2026-10-22").length, 0);
  });

  it("validates recurrence configuration strictly", () => {
    // Valid custom recurrence
    const validErr = validateEventDraft({
      title: "Valid",
      date: "2026-10-19",
      startTime: "09:00",
      endTime: "10:00",
      color: "#039be5",
      recurrence: { frequency: "custom", daysOfWeek: [1, 3, 5] },
    });
    assert.equal(validErr, null);

    // Custom recurrence without any days selected
    const emptyDaysErr = validateEventDraft({
      title: "Invalid",
      date: "2026-10-19",
      startTime: "09:00",
      endTime: "10:00",
      color: "#039be5",
      recurrence: { frequency: "custom", daysOfWeek: [] },
    });
    assert.match(emptyDaysErr || "", /minimal satu hari/i);

    // untilDate before start date
    const pastUntilErr = validateEventDraft({
      title: "Invalid Cutoff",
      date: "2026-10-19",
      startTime: "09:00",
      endTime: "10:00",
      color: "#039be5",
      recurrence: { frequency: "daily", untilDate: "2026-10-18" },
    });
    assert.match(pastUntilErr || "", /tidak boleh sebelum/i);
  });

  it("builds valid Google Calendar URLs with correct date-time parameters", () => {
    const url = buildGoogleCalendarUrl({
      title: "Deep Work Sesi 1",
      description: "Fokus selesaikan fitur timeblock",
      date: "2026-10-27",
      startTime: "09:00",
      endTime: "10:30",
    });

    assert.ok(url.startsWith("https://calendar.google.com/calendar/render?"));
    assert.ok(url.includes("action=TEMPLATE"));
    assert.ok(url.includes("text=Deep+Work+Sesi+1"));
    assert.ok(url.includes("dates=20261027T090000%2F20261027T103000"));
    assert.ok(url.includes("details="));
  });

  it("generates standard RFC-compliant iCalendar (.ics) content", () => {
    const testEvents: CalendarEvent[] = [
      {
        id: "ev-test-1",
        title: "Sprint Planning",
        date: "2026-10-27",
        startTime: "14:00",
        endTime: "15:00",
        color: "#0284c7",
        category: "task",
        description: "Review backlog",
      },
    ];

    const ics = generateIcsContent(testEvents);
    assert.ok(ics.includes("BEGIN:VCALENDAR"));
    assert.ok(ics.includes("VERSION:2.0"));
    assert.ok(ics.includes("BEGIN:VEVENT"));
    assert.ok(ics.includes("UID:ev-test-1@biarfokus.site"));
    assert.ok(ics.includes("DTSTART:20261027T140000"));
    assert.ok(ics.includes("DTEND:20261027T150000"));
    assert.ok(ics.includes("SUMMARY:Sprint Planning"));
    assert.ok(ics.includes("END:VEVENT"));
    assert.ok(ics.includes("END:VCALENDAR"));
  });

  it("computes smart timeblock slots rounded to sensible intervals with break time included", () => {
    // Default: 50m focus + 10m break = 60m total
    const slotWithBreak = getSmartTimeblockSlot(50, 10, true);
    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(slotWithBreak.date));
    assert.ok(/^([01]\d|2[0-3]):[0-5]\d$/.test(slotWithBreak.startTime));
    assert.ok(/^([01]\d|2[0-3]):[0-5]\d$/.test(slotWithBreak.endTime));
    assert.strictEqual(slotWithBreak.totalMinutes, 60);

    // Without break: 50m focus
    const slotPure = getSmartTimeblockSlot(50, 10, false);
    assert.strictEqual(slotPure.totalMinutes, 50);
  });
});


