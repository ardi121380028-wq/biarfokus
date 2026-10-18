"use client";

import { useMemo } from "react";
import type { CalendarEvent } from "@/types/domain";
import {
  formatDuration,
  getEventsForDate,
  getMonthCalendarWeeks,
  isSameDay,
  toISODate,
} from "@/features/calendar/calendar-service";

type CalendarMonthViewProps = {
  anchorDate: Date;
  events: CalendarEvent[];
  onSelectDate: (date: Date) => void;
  onSlotClick: (dateISO: string, hour?: number) => void;
  onEventClick: (event: CalendarEvent) => void;
};

const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export function CalendarMonthView({
  anchorDate,
  events,
  onSelectDate,
  onSlotClick,
  onEventClick,
}: CalendarMonthViewProps) {
  const today = useMemo(() => new Date(), []);
  const weeks = useMemo(() => getMonthCalendarWeeks(anchorDate, true), [anchorDate]);
  const currentMonth = anchorDate.getMonth();

  return (
    <div className="cal-month-wrapper">
      {/* 7-Day Header */}
      <div className="cal-month-header-row">
        <div className="cal-month-week-col-spacer">Wk</div>
        <div className="cal-month-days-header">
          {DAY_NAMES.map((name) => (
            <div key={name} className="cal-month-day-head">
              {name}
            </div>
          ))}
        </div>
      </div>

      {/* Weeks Grid */}
      <div className="cal-month-grid-body">
        {weeks.map((week, wIdx) => (
          <div key={wIdx} className="cal-month-week-row">
            {/* Week Number Column */}
            <div
              className="cal-month-week-col"
              title={`Minggu ke-${week.weekNumber}`}
            >
              <span>{week.weekNumber}</span>
            </div>

            {/* 7 Days in Week */}
            <div className="cal-month-days-row">
              {week.days.map((d) => {
                const dateISO = toISODate(d);
                const isToday = isSameDay(d, today);
                const isCurrentMonth = d.getMonth() === currentMonth;
                const isFirstOfMonth = d.getDate() === 1;
                const dayEvents = getEventsForDate(events, dateISO);

                const maxDisplay = 4;
                const visibleEvents = dayEvents.slice(0, maxDisplay);
                const overflowCount = Math.max(0, dayEvents.length - maxDisplay);

                return (
                  <div
                    key={dateISO}
                    className={`cal-month-cell ${!isCurrentMonth ? "is-other-month" : ""} ${
                      isToday ? "is-today" : ""
                    }`}
                    onClick={() => onSlotClick(dateISO, 9)}
                  >
                    {/* Date Number Header */}
                    <div className="cal-month-cell-header">
                      <button
                        type="button"
                        className={`cal-month-day-btn ${isToday ? "today-badge" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDate(d);
                        }}
                        title={`Buka tampilan hari untuk ${dateISO}`}
                      >
                        {isFirstOfMonth
                          ? `${d.getDate()} ${d.toLocaleDateString("id-ID", { month: "short" })}`
                          : d.getDate()}
                      </button>
                    </div>

                    {/* Events List */}
                    <div className="cal-month-events-list">
                      {visibleEvents.map((event) => (
                        <div
                          key={event.id}
                          className="cal-month-event-item"
                          style={{
                            borderLeftColor: event.color || "#039be5",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick(event);
                          }}
                          title={`${event.startTime} – ${event.endTime}: ${event.title}`}
                        >
                          <span
                            className="cal-month-event-dot"
                            style={{ backgroundColor: event.color || "#039be5" }}
                          />
                          <span className="cal-month-event-time">
                            {event.startTime}
                          </span>
                          <span className="cal-month-event-title">
                            {event.title}
                          </span>
                        </div>
                      ))}

                      {overflowCount > 0 && (
                        <button
                          type="button"
                          className="cal-month-more-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectDate(d);
                          }}
                          title={`Lihat semua ${dayEvents.length} jadwal`}
                        >
                          +{overflowCount} lainnya
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
