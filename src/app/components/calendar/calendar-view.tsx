"use client";

import { useMemo, useState } from "react";
import type { CalendarEvent } from "@/types/domain";
import {
  addDays,
  addMonths,
  CALENDAR_COLORS,
  DEFAULT_EVENT_COLOR,
  formatPeriodLabel,
  getVisibleDays,
  minutesToTime,
  snapMinutes,
  toISODate,
  type CalendarViewMode,
  type EventDraft,
} from "@/features/calendar/calendar-service";
import { useCalendarEvents } from "@/features/calendar/use-calendar-events";
import { useKeepNotes } from "@/features/notes/use-keep-notes";
import { CalendarHeader } from "./calendar-header";
import { CalendarGrid } from "./calendar-grid";
import { CalendarEventModal } from "./calendar-event-modal";
import styles from "./calendar.module.css";

type CalendarViewProps = {
  userId?: string | null;
  onNavigateToNotes?: () => void;
};

export function CalendarView({ userId, onNavigateToNotes }: CalendarViewProps) {
  const { events, addEvent, updateEvent, deleteEvent } = useCalendarEvents(userId);
  const { notes } = useKeepNotes(userId);

  const [anchorDate, setAnchorDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("week");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [modalDraft, setModalDraft] = useState<EventDraft | null>(null);

  // Visible days: 7 days for week mode, 1 day for day mode
  const visibleDays = useMemo(
    () => getVisibleDays(anchorDate, viewMode),
    [anchorDate, viewMode],
  );

  const periodLabel = useMemo(
    () => formatPeriodLabel(visibleDays),
    [visibleDays],
  );

  /* Pagination */
  function handleToday() {
    setAnchorDate(new Date());
  }

  function handlePrevPeriod() {
    setAnchorDate((prev) => addDays(prev, viewMode === "week" ? -7 : -1));
  }

  function handleNextPeriod() {
    setAnchorDate((prev) => addDays(prev, viewMode === "week" ? 7 : 1));
  }

  function handlePrevMonth() {
    setAnchorDate((prev) => addMonths(prev, -1));
  }

  function handleNextMonth() {
    setAnchorDate((prev) => addMonths(prev, 1));
  }

  /* Create & Edit Modal Triggers */
  function handleOpenCreate(defaultDateISO?: string, hour = 9) {
    const date = defaultDateISO || toISODate(anchorDate);
    const startMins = snapMinutes(hour * 60, 30);
    const endMins = Math.min(24 * 60 - 1, startMins + 60);

    setEditingId(undefined);
    setModalDraft({
      title: "",
      date,
      startTime: minutesToTime(startMins),
      endTime: minutesToTime(endMins),
      color: DEFAULT_EVENT_COLOR,
      category: "event",
      description: "",
    });
    setModalOpen(true);
  }

  function handleOpenEdit(event: CalendarEvent) {
    setEditingId(event.id);
    setModalDraft({
      title: event.title,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      color: event.color,
      category: event.category || "event",
      description: event.description,
      linkedNoteId: event.linkedNoteId,
      linkedNoteTitle: event.linkedNoteTitle,
      linkedItemId: event.linkedItemId,
    });
    setModalOpen(true);
  }

  function handleSaveDraft(draft: EventDraft, id?: string) {
    if (id) {
      updateEvent({ ...draft, id });
    } else {
      addEvent(draft);
    }
    setModalOpen(false);
  }

  return (
    <section className="inner-page">
      <div className={styles.container}>
        <CalendarHeader
          periodLabel={periodLabel}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onToday={handleToday}
          onPrevPeriod={handlePrevPeriod}
          onNextPeriod={handleNextPeriod}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onCreateClick={() => handleOpenCreate()}
        />

        {/* Empty notice banner if no events have been created yet */}
        {events.length === 0 && (
          <div className={styles.emptyNotice}>
            <span>
              📅 <strong>Kalender masih kosong.</strong> Klik pada petak jam mana saja atau tekan{" "}
              <strong>+ Buat Jadwal</strong> untuk mulai time-blocking dan menghubungkan to-do list aktif kamu.
            </span>
            {onNavigateToNotes && (
              <button
                type="button"
                className={styles.todayBtn}
                onClick={onNavigateToNotes}
              >
                Lihat Catatan →
              </button>
            )}
          </div>
        )}

        {/* 7-Day / 1-Day Time-Blocking Grid */}
        <CalendarGrid
          days={visibleDays}
          events={events}
          onSlotClick={(dateISO, hour) => handleOpenCreate(dateISO, hour)}
          onEventClick={handleOpenEdit}
        />

        {/* Create / Edit Event Modal */}
        {modalOpen && modalDraft && (
          <CalendarEventModal
            initialDraft={modalDraft}
            editingId={editingId}
            notes={notes}
            onSave={handleSaveDraft}
            onDelete={deleteEvent}
            onClose={() => setModalOpen(false)}
          />
        )}
      </div>
    </section>
  );
}
