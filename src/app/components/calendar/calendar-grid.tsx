"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { CalendarEvent } from "@/types/domain";
import {
  DEFAULT_EVENT_COLOR,
  getCurrentTimeTop,
  getEventsForDate,
  HOUR_HEIGHT_PX,
  HOURS_24,
  isSameDay,
  layoutDayEvents,
  moveEventTimeRange,
  resizeEventTimeRange,
  timeToMinutes,
  toISODate,
} from "@/features/calendar/calendar-service";

type CalendarGridProps = {
  days: Date[];
  events: CalendarEvent[];
  onSlotClick: (dateISO: string, hour: number) => void;
  onEventClick: (event: CalendarEvent) => void;
  onUpdateEvent: (event: CalendarEvent) => void;
};

type DragMode = "move" | "resize-top" | "resize-bottom";

type DragSession = {
  mode: DragMode;
  event: CalendarEvent;
  initialDateISO: string;
  initialStartMins: number;
  initialEndMins: number;
  durationMins: number;
  startY: number;
  startX: number;
  hasMoved: boolean;
  currentDateISO: string;
  currentStartTime: string;
  currentEndTime: string;
};

export function CalendarGrid({
  days,
  events,
  onSlotClick,
  onEventClick,
  onUpdateEvent,
}: CalendarGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [currentTop, setCurrentTop] = useState<number>(() => getCurrentTimeTop(new Date()));
  const [dragState, setDragState] = useState<DragSession | null>(null);
  const dragSessionRef = useRef<DragSession | null>(null);

  const today = new Date();

  // Scroll to ~07:00 on first mount
  useEffect(() => {
    if (!scrollRef.current) return;
    const initialHour = Math.max(0, Math.min(20, new Date().getHours() - 1 || 7));
    scrollRef.current.scrollTop = initialHour * HOUR_HEIGHT_PX;
  }, []);

  // Update live current time indicator every 30 seconds
  useEffect(() => {
    const update = () => setCurrentTop(getCurrentTimeTop(new Date()));
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, []);

  function handleStartDrag(
    e: ReactPointerEvent,
    event: CalendarEvent,
    mode: DragMode,
  ) {
    if (e.button !== 0) return;
    e.stopPropagation();

    const startMins = timeToMinutes(event.startTime);
    const endMins = timeToMinutes(event.endTime);
    const duration = Math.max(15, endMins - startMins);

    const session: DragSession = {
      mode,
      event,
      initialDateISO: event.date,
      initialStartMins: startMins,
      initialEndMins: endMins,
      durationMins: duration,
      startY: e.clientY,
      startX: e.clientX,
      hasMoved: false,
      currentDateISO: event.date,
      currentStartTime: event.startTime,
      currentEndTime: event.endTime,
    };

    dragSessionRef.current = session;

    let rafId: number | null = null;

    function onPointerMove(moveEvt: PointerEvent) {
      if (!dragSessionRef.current) return;
      const s = dragSessionRef.current;
      const deltaY = moveEvt.clientY - s.startY;
      const deltaX = moveEvt.clientX - s.startX;

      if (!s.hasMoved && (Math.abs(deltaY) > 4 || Math.abs(deltaX) > 4)) {
        s.hasMoved = true;
      }
      if (!s.hasMoved) return;

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const deltaMins = Math.round((deltaY / HOUR_HEIGHT_PX) * 60);

        let targetDate = s.initialDateISO;
        if (days.length > 1) {
          for (const d of days) {
            const iso = toISODate(d);
            const colEl = columnRefs.current[iso];
            if (colEl) {
              const rect = colEl.getBoundingClientRect();
              if (moveEvt.clientX >= rect.left && moveEvt.clientX <= rect.right) {
                targetDate = iso;
                break;
              }
            }
          }
        }
        s.currentDateISO = targetDate;

        if (s.mode === "move") {
          const { startTime, endTime } = moveEventTimeRange(
            s.initialStartMins + deltaMins,
            s.durationMins,
            15,
          );
          s.currentStartTime = startTime;
          s.currentEndTime = endTime;
        } else if (s.mode === "resize-bottom") {
          const { startTime, endTime } = resizeEventTimeRange(
            "bottom",
            s.initialEndMins + deltaMins,
            s.initialStartMins,
            15,
            15,
          );
          s.currentStartTime = startTime;
          s.currentEndTime = endTime;
        } else if (s.mode === "resize-top") {
          const { startTime, endTime } = resizeEventTimeRange(
            "top",
            s.initialStartMins + deltaMins,
            s.initialEndMins,
            15,
            15,
          );
          s.currentStartTime = startTime;
          s.currentEndTime = endTime;
        }

        setDragState({ ...s });
      });
    }

    function onPointerUp() {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);

      const s = dragSessionRef.current;
      dragSessionRef.current = null;
      setDragState(null);

      if (!s) return;

      if (s.hasMoved) {
        onUpdateEvent({
          ...s.event,
          date: s.currentDateISO,
          startTime: s.currentStartTime,
          endTime: s.currentEndTime,
        });
      } else {
        if (mode === "move") {
          onEventClick(s.event);
        }
      }
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  const totalHeight = 24 * HOUR_HEIGHT_PX;

  return (
    <div
      className={`cal-grid-wrapper ${days.length === 1 ? "view-day" : "view-week"} ${
        dragState ? "is-active-dragging" : ""
      }`}
    >
      <div ref={scrollRef} className="cal-main-scroll">
        {/* Sticky Columns Header */}
        <div className="cal-date-columns-header">
          <div className="cal-time-axis-spacer">
            <span className="cal-timezone-badge">GMT+07</span>
          </div>
          <div className="cal-columns-row">
            {days.map((d) => {
              const isToday = isSameDay(d, today);
              const dayName = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
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
            {HOURS_24.map((hour) => {
              const hour12 =
                hour === 0
                  ? "12 AM"
                  : hour === 12
                  ? "12 PM"
                  : hour > 12
                  ? `${hour - 12} PM`
                  : `${hour} AM`;
              return (
                <div
                  key={hour}
                  className="cal-time-label"
                  style={{ height: HOUR_HEIGHT_PX }}
                >
                  <span>{hour12}</span>
                </div>
              );
            })}
          </div>

          {/* Columns */}
          <div className="cal-columns-body">
            {days.map((d) => {
              const dateISO = toISODate(d);
              const isToday = isSameDay(d, today);
              const dayEvents = getEventsForDate(events, dateISO);
              const positioned = layoutDayEvents(dayEvents, HOUR_HEIGHT_PX);

              // Check if currently dragging into this column from another date
              const isDragTargetColumn =
                dragState &&
                dragState.hasMoved &&
                dragState.currentDateISO === dateISO &&
                dragState.initialDateISO !== dateISO;

              return (
                <div
                  key={dateISO}
                  ref={(el) => {
                    columnRefs.current[dateISO] = el;
                  }}
                  className={`cal-column ${isToday ? "is-today" : ""} ${
                    isDragTargetColumn ? "drag-target-hover" : ""
                  }`}
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
                    const isCurrentBeingDragged =
                      dragState && dragState.event.id === event.id;

                    // If dragged across columns, hide from original column
                    if (
                      isCurrentBeingDragged &&
                      dragState.hasMoved &&
                      dragState.currentDateISO !== dateISO
                    ) {
                      return null;
                    }

                    // If being dragged/resized within this column, compute live position
                    let displayTop = top;
                    let displayHeight = height;
                    let displayStartTime = event.startTime;
                    let displayEndTime = event.endTime;

                    if (isCurrentBeingDragged && dragState.hasMoved) {
                      const liveStartMins = timeToMinutes(dragState.currentStartTime);
                      const liveEndMins = timeToMinutes(dragState.currentEndTime);
                      displayTop = (liveStartMins / 60) * HOUR_HEIGHT_PX;
                      displayHeight = Math.max(
                        14,
                        ((liveEndMins - liveStartMins) / 60) * HOUR_HEIGHT_PX,
                      );
                      displayStartTime = dragState.currentStartTime;
                      displayEndTime = dragState.currentEndTime;
                    }

                    const widthPercent = 100 / columns;
                    const leftPercent = column * widthPercent;

                    const isShortEvent = displayHeight <= 58;
                    const isTinyEvent = displayHeight <= 34;

                    return (
                      <div
                        key={event.id}
                        className={`cal-event-block ${
                          isShortEvent ? "is-short-event" : ""
                        } ${isTinyEvent ? "is-tiny-event" : ""} ${
                          isCurrentBeingDragged && dragState.hasMoved ? "is-dragging" : ""
                        }`}
                        style={{
                          top: `${displayTop}px`,
                          height: `${displayHeight}px`,
                          left: `calc(${leftPercent}% + 2px)`,
                          width: `calc(${widthPercent}% - 4px)`,
                          backgroundColor: event.color || DEFAULT_EVENT_COLOR,
                        }}
                        onPointerDown={(e) => handleStartDrag(e, event, "move")}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                      >
                        {/* Top Resize Handle */}
                        <div
                          className="cal-resize-handle top"
                          onPointerDown={(e) => handleStartDrag(e, event, "resize-top")}
                          title="Tarik untuk ubah jam mulai"
                        >
                          <div className="cal-resize-grip-line" />
                        </div>

                        {/* Cyan Accent Left Stripe */}
                        <div className="cal-event-accent-strip" />

                        <div className="cal-event-content">
                          {isShortEvent ? (
                            <div className="cal-event-headline-row">
                              <strong className="cal-event-title">
                                {event.title}
                                {((event.recurrence?.frequency && event.recurrence.frequency !== "none") ||
                                  event.isRecurringOccurrence) && (
                                  <span className="cal-repeat-indicator" title="Jadwal rutin berulang">
                                    🔁
                                  </span>
                                )}
                              </strong>
                              <span className="cal-event-time">
                                {displayStartTime}–{displayEndTime}
                              </span>
                            </div>
                          ) : (
                            <>
                              <strong className="cal-event-title">
                                {event.title}
                                {((event.recurrence?.frequency && event.recurrence.frequency !== "none") ||
                                  event.isRecurringOccurrence) && (
                                  <span className="cal-repeat-indicator" title="Jadwal rutin berulang">
                                    🔁
                                  </span>
                                )}
                              </strong>
                              <span className="cal-event-time">
                                {displayStartTime} – {displayEndTime}
                              </span>
                            </>
                          )}

                          {!isTinyEvent && event.linkedItemText ? (
                            <span
                              className="cal-event-linked-badge cal-event-subtask-badge"
                              title={`Sub-task: ${event.linkedItemText}${event.linkedNoteTitle ? ` (${event.linkedNoteTitle})` : ""}`}
                            >
                              ☑️ {event.linkedItemText}
                            </span>
                          ) : !isTinyEvent && event.linkedNoteTitle ? (
                            <span
                              className="cal-event-linked-badge"
                              title={`Terhubung dengan catatan: ${event.linkedNoteTitle}`}
                            >
                              📝 {event.linkedNoteTitle}
                            </span>
                          ) : !isTinyEvent && event.linkedKanbanCardId ? (
                            <span
                              className="cal-event-linked-badge cal-event-kanban-badge"
                              title={`Terhubung dengan kartu Kanban: ${event.linkedKanbanBoardTitle || "Kanban"}`}
                            >
                              📋 {event.linkedKanbanBoardTitle || "Kanban"}
                            </span>
                          ) : null}
                        </div>

                        {/* Bottom Resize Handle */}
                        <div
                          className="cal-resize-handle bottom"
                          onPointerDown={(e) => handleStartDrag(e, event, "resize-bottom")}
                          title="Tarik untuk atur durasi jam selesai"
                        >
                          <div className="cal-resize-grip-line" />
                        </div>
                      </div>
                    );
                  })}

                  {/* Ghost preview when dragging from another column into this column */}
                  {isDragTargetColumn && dragState && (
                    <div
                      className="cal-event-block is-dragging ghost-preview"
                      style={{
                        top: `${(timeToMinutes(dragState.currentStartTime) / 60) * HOUR_HEIGHT_PX}px`,
                        height: `${
                          Math.max(
                            14,
                            ((timeToMinutes(dragState.currentEndTime) -
                              timeToMinutes(dragState.currentStartTime)) /
                              60) *
                              HOUR_HEIGHT_PX,
                          )
                        }px`,
                        left: "4px",
                        right: "4px",
                        backgroundColor: dragState.event.color || DEFAULT_EVENT_COLOR,
                      }}
                    >
                      <div className="cal-event-accent-strip" />
                      <div className="cal-event-content">
                        <strong className="cal-event-title">{dragState.event.title}</strong>
                        <span className="cal-event-time">
                          {dragState.currentStartTime} – {dragState.currentEndTime}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
