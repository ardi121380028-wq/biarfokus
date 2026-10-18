"use client";

import { useMemo } from "react";
import type { CalendarEvent } from "@/types/domain";
import {
  getYearCalendarMonths,
  isSameDay,
  toISODate,
} from "@/features/calendar/calendar-service";

type CalendarYearViewProps = {
  anchorDate: Date;
  events: CalendarEvent[];
  onSelectDate: (date: Date) => void;
};

const MINI_DAY_HEADERS = ["S", "M", "T", "W", "T", "F", "S"];

export function CalendarYearView({
  anchorDate,
  events,
  onSelectDate,
}: CalendarYearViewProps) {
  const currentYear = anchorDate.getFullYear();
  const today = useMemo(() => new Date(), []);

  // Set of dates having events for fast lookup
  const datesWithEvents = useMemo(() => {
    const set = new Set<string>();
    for (const ev of events) {
      set.add(ev.date);
    }
    return set;
  }, [events]);

  const months = useMemo(
    () => getYearCalendarMonths(currentYear, true),
    [currentYear],
  );

  return (
    <div className="cal-year-wrapper">
      <div className="cal-year-grid">
        {months.map((m) => (
          <div key={m.monthIndex} className="cal-year-month-card">
            <h3 className="cal-year-month-title">{m.monthName}</h3>

            <div className="cal-year-mini-table">
              {/* Header: Week Spacer + S M T W T F S */}
              <div className="cal-year-mini-header">
                <span className="cal-year-mini-wk-col" />
                {MINI_DAY_HEADERS.map((h, i) => (
                  <span key={i} className="cal-year-mini-head-cell">
                    {h}
                  </span>
                ))}
              </div>

              {/* Weeks */}
              <div className="cal-year-mini-body">
                {m.weeks.map((week, wIdx) => (
                  <div key={wIdx} className="cal-year-mini-row">
                    <span
                      className="cal-year-mini-wk-col"
                      title={`Minggu ke-${week.weekNumber}`}
                    >
                      {week.weekNumber}
                    </span>

                    {week.days.map((d) => {
                      const dateISO = toISODate(d);
                      const isCurrentMonth = d.getMonth() === m.monthIndex;
                      const isToday = isSameDay(d, today);
                      const hasEvent = datesWithEvents.has(dateISO);

                      return (
                        <button
                          key={dateISO}
                          type="button"
                          className={`cal-year-mini-day ${
                            !isCurrentMonth ? "is-dimmed" : ""
                          } ${isToday ? "today-badge" : ""}`}
                          onClick={() => onSelectDate(d)}
                          title={`${dateISO}${hasEvent ? " (ada jadwal)" : ""}`}
                        >
                          <span className="mini-day-number">{d.getDate()}</span>
                          {hasEvent && isCurrentMonth && (
                            <span className="mini-event-dot" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
