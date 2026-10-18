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
import styles from "./calendar.module.css";

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
    <div className={styles.gridWrapper}>
      <div ref={scrollRef} className={styles.scrollArea}>
        {/* Sticky Columns Header */}
        <div className={styles.columnsHeaderRow}>
          <div className={styles.timeAxisSpacer} />
          <div className={styles.columnsHeaderList}>
            {days.map((d) => {
              const isToday = isSameDay(d, today);
              const dayName = d.toLocaleDateString("id-ID", { weekday: "short" });
              return (
                <div
                  key={toISODate(d)}
                  className={
                    isToday
                      ? `${styles.dayColumnHeader} ${styles.dayToday}`
                      : styles.dayColumnHeader
                  }
                >
                  <span className={styles.dayName}>{dayName}</span>
                  <span className={styles.dayNumber}>{d.getDate()}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 24-Hour Grid Body */}
        <div className={styles.gridBody} style={{ height: totalHeight }}>
          {/* Time Labels on Left Axis */}
          <div className={styles.timeAxis}>
            {HOURS_24.map((hour) => (
              <div
                key={hour}
                className={styles.timeLabel}
                style={{ height: HOUR_HEIGHT_PX }}
              >
                <span>{String(hour).padStart(2, "0")}:00</span>
              </div>
            ))}
          </div>

          {/* Columns */}
          <div className={styles.columnsBody}>
            {days.map((d) => {
              const dateISO = toISODate(d);
              const isToday = isSameDay(d, today);
              const dayEvents = getEventsForDate(events, dateISO);
              const positioned = layoutDayEvents(dayEvents, HOUR_HEIGHT_PX);

              return (
                <div
                  key={dateISO}
                  className={
                    isToday
                      ? `${styles.column} ${styles.columnToday}`
                      : styles.column
                  }
                  style={{ height: totalHeight }}
                >
                  {/* Hour Cells */}
                  {HOURS_24.map((hour) => (
                    <div
                      key={hour}
                      className={styles.hourCell}
                      style={{ height: HOUR_HEIGHT_PX }}
                      onClick={() => onSlotClick(dateISO, hour)}
                      title={`Klik untuk buat jadwal pada ${dateISO} pukul ${String(hour).padStart(2, "0")}:00`}
                    />
                  ))}

                  {/* Red Current Time Line on Today */}
                  {isToday && (
                    <div
                      className={styles.currentTimeIndicator}
                      style={{ top: currentTop }}
                    >
                      <span className={styles.currentTimeDot} />
                      <span className={styles.currentTimeLine} />
                    </div>
                  )}

                  {/* Positioned Event Blocks */}
                  {positioned.map(({ event, top, height, column, columns }) => {
                    const widthPercent = 100 / columns;
                    const leftPercent = column * widthPercent;

                    return (
                      <div
                        key={event.id}
                        className={styles.eventBlock}
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
                        <div className={styles.eventContent}>
                          <strong className={styles.eventTitle}>{event.title}</strong>
                          <span className={styles.eventTime}>
                            {event.startTime} – {event.endTime}
                          </span>
                          {event.linkedNoteTitle && (
                            <span
                              className={styles.eventLinkedBadge}
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
