"use client";

import { useMemo, useState } from "react";
import type { CalendarEvent } from "@/types/domain";
import {
  addDays,
  addMonths,
  addYears,
  DEFAULT_EVENT_COLOR,
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
import { CalendarMonthView } from "./calendar-month-view";
import { CalendarYearView } from "./calendar-year-view";
import { CalendarEventModal } from "./calendar-event-modal";

type CalendarViewProps = {
  userId?: string | null;
  onNavigateToNotes?: () => void;
};

export function CalendarView({ userId, onNavigateToNotes }: CalendarViewProps) {
  const { events, addEvent, updateEvent, deleteEvent } = useCalendarEvents(userId);
  const { notes } = useKeepNotes(userId);

  const [anchorDate, setAnchorDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("week");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [modalDraft, setModalDraft] = useState<EventDraft | null>(null);

  // Filtered events
  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return events;
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.linkedNoteTitle && e.linkedNoteTitle.toLowerCase().includes(q)),
    );
  }, [events, searchQuery]);

  // Visible days for Day/Week
  const visibleDays = useMemo(
    () => getVisibleDays(anchorDate, viewMode, true),
    [anchorDate, viewMode],
  );

  /* Navigation */
  function handleToday() {
    setAnchorDate(new Date());
  }

  function handlePrev() {
    setAnchorDate((prev) => {
      if (viewMode === "year") return addYears(prev, -1);
      if (viewMode === "month") return addMonths(prev, -1);
      if (viewMode === "week") return addDays(prev, -7);
      return addDays(prev, -1);
    });
  }

  function handleNext() {
    setAnchorDate((prev) => {
      if (viewMode === "year") return addYears(prev, 1);
      if (viewMode === "month") return addMonths(prev, 1);
      if (viewMode === "week") return addDays(prev, 7);
      return addDays(prev, 1);
    });
  }

  /* Date selection from Month or Year view */
  function handleSelectDate(date: Date) {
    setAnchorDate(date);
    setViewMode("day");
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
    <section className="inner-page calendar-page-view">
      <CalendarHeader
        anchorDate={anchorDate}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onToday={handleToday}
        onPrev={handlePrev}
        onNext={handleNext}
        onCreateClick={() => handleOpenCreate()}
        onNavigateToNotes={onNavigateToNotes}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Empty notice banner if no events have been created yet */}
      {events.length === 0 && (
        <div className="cal-empty-notice">
          <span>
            📅 <strong>Kalender masih kosong.</strong> Klik pada petak jam mana saja atau tekan{" "}
            <strong>+ Buat Jadwal</strong> untuk mulai time-blocking dan menghubungkan to-do list aktif kamu.
          </span>
          {onNavigateToNotes && (
            <button type="button" onClick={onNavigateToNotes}>
              Lihat Catatan →
            </button>
          )}
        </div>
      )}

      {/* Main View Mode Content */}
      {(viewMode === "day" || viewMode === "week") && (
        <CalendarGrid
          days={visibleDays}
          events={filteredEvents}
          onSlotClick={(dateISO, hour) => handleOpenCreate(dateISO, hour)}
          onEventClick={handleOpenEdit}
          onUpdateEvent={updateEvent}
        />
      )}

      {viewMode === "month" && (
        <CalendarMonthView
          anchorDate={anchorDate}
          events={filteredEvents}
          onSelectDate={handleSelectDate}
          onSlotClick={(dateISO, hour) => handleOpenCreate(dateISO, hour)}
          onEventClick={handleOpenEdit}
        />
      )}

      {viewMode === "year" && (
        <CalendarYearView
          anchorDate={anchorDate}
          events={filteredEvents}
          onSelectDate={handleSelectDate}
        />
      )}

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
    </section>
  );
}
