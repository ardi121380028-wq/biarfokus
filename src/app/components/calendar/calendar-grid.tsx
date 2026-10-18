"use client";

import { useEffect, useRef, useState } from "react";
import type { CalendarEvent } from "@/types/domain";
import {
  getCurrentTimeTop,
  getEventsForDate,
  HOUR_HEIGHT_PX,
  HOURS_24,
  isSameDay,
  layoutDayEvents,
  toISODate,
} from "@/features/calendar/calendar-service";

type CalendarGridProps = {
  days: Date[];
  events: CalendarEvent[];
  onSlotClick: (dateISO: string, hour: number) => void;
  onEventClick: (event: CalendarEvent) => void;
};

export function CalendarGrid({
  days,
  events,
  onSlotClick,
  onEventClick,
}: CalendarGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentTop, setCurrentTop] = useState<number>(() => getCurrentTimeTop(new Date()));
  const today = new Date();

  // Scroll to ~07:00 or current hour on first mount
  useEffect(() => {
    if (!scrollRef.current) return;
    const initialHour = Math.max(0, Math.min(20, today.getHours() - 1 || 7));
    scrollRef.current.scrollTop = initialHour * HOUR_HEIGHT_PX;
  }, []);

  // Update live current time indicator every 30 seconds
  useEffect(() => {
    const update = () => setCurrentTop(getCurrentTimeTop(new Date()));
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, []);

  const totalHeight = 24 * HOUR_HEIGHT_PX;

  return (
    <div className="cal-grid-wrapper">
      <div ref={scrollRef} className="cal-main-scroll">
        {/* Sticky Columns Header */}
        <div className="cal-date-columns-header">
          <div className="cal-time-axis-spacer" />
          <div className="cal-columns-row">
            {days.map((d) => {
              const isToday = isSameDay(d, today);
              const dayName = d.toLocaleDateString("id-ID", { weekday: "short" });
              return (
                <div
                  key={toISODate(d)}
                  className={isToday ? "cal-day-header is-today" : "cal-day-header"}
                >
                  <span className="cal-day-name">{dayName}</span>
                  <span className="cal-day-number">{d.getDate()}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 24-Hour Grid Body */}
        <div className="cal-grid-body" style={{ height: totalHeight }}>
          {/* Time Labels on Left Axis */}
          <div className="cal-time-axis">
            {HOURS_24.map((hour) => (
              <div
                key={hour}
                className="cal-time-label"
                style={{ height: HOUR_HEIGHT_PX }}
              >
                <span>{String(hour).padStart(2, "0")}:00</span>
              </div>
            ))}
          </div>

          {/* Columns */}
          <div className="cal-columns-body">
            {days.map((d) => {
              const dateISO = toISODate(d);
              const isToday = isSameDay(d, today);
              const dayEvents = getEventsForDate(events, dateISO);
              const positioned = layoutDayEvents(dayEvents, HOUR_HEIGHT_PX);

              return (
                <div
                  key={dateISO}
                  className={isToday ? "cal-column is-today" : "cal-column"}
                  style={{ height: totalHeight }}
                >
                  {/* Hour Cells */}
                  {HOURS_24.map((hour) => (
                    <div
                      key={hour}
                      className="cal-hour-cell"
                      style={{ height: HOUR_HEIGHT_PX }}
                      onClick={() => onSlotClick(dateISO, hour)}
                      title={`Klik untuk buat jadwal pada ${dateISO} pukul ${String(hour).padStart(2, "0")}:00`}
                    />
                  ))}

                  {/* Red Current Time Line on Today */}
                  {isToday && (
                    <div
                      className="cal-current-time-indicator"
                      style={{ top: currentTop }}
                    >
                      <span className="cal-current-time-dot" />
                      <span className="cal-current-time-line" />
                    </div>
                  )}

                  {/* Positioned Event Blocks */}
                  {positioned.map(({ event, top, height, column, columns }) => {
                    const widthPercent = 100 / columns;
                    const leftPercent = column * widthPercent;

                    return (
                      <div
                        key={event.id}
                        className="cal-event-block"
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          left: `calc(${leftPercent}% + 2px)`,
                          width: `calc(${widthPercent}% - 4px)`,
                          backgroundColor: event.color,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                      >
                        <div className="cal-event-content">
                          <strong className="cal-event-title">{event.title}</strong>
                          <span className="cal-event-time">
                            {event.startTime} – {event.endTime}
                          </span>
                          {event.linkedNoteTitle && (
                            <span
                              className="cal-event-linked-badge"
                              title={`Terhubung dengan catatan: ${event.linkedNoteTitle}`}
                            >
                              📝 {event.linkedNoteTitle}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
