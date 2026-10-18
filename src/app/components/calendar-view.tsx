"use client";

import { useEffect, useMemo, useState } from "react";
import type { CalendarEvent, KeepNote } from "@/types/domain";
import {
  CALENDAR_COLORS,
  calculateEventPosition,
  formatDateToISO,
  formatReadableDate,
  getCurrentTimeIndicatorPosition,
  getEventsForDate,
  GRID_END_HOUR,
  GRID_START_HOUR,
  HOUR_HEIGHT_PX,
  loadCalendarEvents,
  saveCalendarEvents,
  timeToMinutes,
} from "@/features/calendar/calendar-service";
import { loadKeepNotes } from "@/features/notes/notes-service";

type CalendarViewProps = {
  userId?: string | null;
  onNavigateToNotes?: () => void;
};

export function CalendarView({ userId, onNavigateToNotes }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<"day" | "3day" | "week">("day");
  const [events, setEvents] = useState<CalendarEvent[]>(() => loadCalendarEvents(userId));
  const [notes, setNotes] = useState<KeepNote[]>(() => loadKeepNotes(userId));
  const [currentTimeIndicator, setCurrentTimeIndicator] = useState<number | null>(null);

  // Modal create/edit state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState(formatDateToISO(new Date()));
  const [eventStartTime, setEventStartTime] = useState("09:00");
  const [eventEndTime, setEventEndTime] = useState("10:00");
  const [eventColor, setEventColor] = useState(CALENDAR_COLORS[0].hex);
  const [eventCategory, setEventCategory] = useState<"event" | "task">("event");
  const [eventDescription, setEventDescription] = useState("");
  const [linkedNoteId, setLinkedNoteId] = useState<string>("");

  useEffect(() => {
    setEvents(loadCalendarEvents(userId));
    setNotes(loadKeepNotes(userId));
  }, [userId]);

  // Update live current time indicator every minute
  useEffect(() => {
    function updateIndicator() {
      const pos = getCurrentTimeIndicatorPosition(new Date());
      setCurrentTimeIndicator(pos);
    }
    updateIndicator();
    const interval = setInterval(updateIndicator, 30000);
    return () => clearInterval(interval);
  }, []);

  function persistEvents(updated: CalendarEvent[]) {
    setEvents(updated);
    saveCalendarEvents(updated, userId);
  }

  // Days to display based on viewMode
  const displayedDates = useMemo(() => {
    const list: Date[] = [];
    const base = new Date(selectedDate);
    base.setHours(0, 0, 0, 0);

    if (viewMode === "day") {
      list.push(base);
    } else if (viewMode === "3day") {
      for (let i = 0; i < 3; i++) {
        const d = new Date(base);
        d.setDate(base.getDate() + i);
        list.push(d);
      }
    } else {
      // Week: Monday to Sunday of current week
      const currentDay = base.getDay();
      const distanceToMonday = (currentDay + 6) % 7;
      const monday = new Date(base);
      monday.setDate(base.getDate() - distanceToMonday);

      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        list.push(d);
      }
    }
    return list;
  }, [selectedDate, viewMode]);

  function handlePrev() {
    const next = new Date(selectedDate);
    const step = viewMode === "week" ? 7 : viewMode === "3day" ? 3 : 1;
    next.setDate(next.getDate() - step);
    setSelectedDate(next);
  }

  function handleNext() {
    const next = new Date(selectedDate);
    const step = viewMode === "week" ? 7 : viewMode === "3day" ? 3 : 1;
    next.setDate(next.getDate() + step);
    setSelectedDate(next);
  }

  function handleToday() {
    setSelectedDate(new Date());
  }

  function openCreateModal(defaultDateStr?: string, defaultHour = 9) {
    setEditingEventId(null);
    setEventTitle("");
    const targetDate = defaultDateStr || formatDateToISO(selectedDate);
    setEventDate(targetDate);
    const startStr = `${String(defaultHour).padStart(2, "0")}:00`;
    const endHour = Math.min(23, defaultHour + 1);
    const endStr = `${String(endHour).padStart(2, "0")}:00`;
    setEventStartTime(startStr);
    setEventEndTime(endStr);
    setEventColor(CALENDAR_COLORS[0].hex);
    setEventCategory("event");
    setEventDescription("");
    setLinkedNoteId("");
    setModalOpen(true);
  }

  function openEditModal(event: CalendarEvent) {
    setEditingEventId(event.id);
    setEventTitle(event.title);
    setEventDate(event.date);
    setEventStartTime(event.startTime);
    setEventEndTime(event.endTime);
    setEventColor(event.color);
    setEventCategory(event.category || "event");
    setEventDescription(event.description || "");
    setLinkedNoteId(event.linkedNoteId || "");
    setModalOpen(true);
  }

  function handleSaveEvent() {
    if (!eventTitle.trim()) return;

    let linkedTitle: string | undefined = undefined;
    if (linkedNoteId) {
      const match = notes.find((n) => n.id === linkedNoteId);
      if (match) linkedTitle = match.title;
    }

    if (editingEventId) {
      const updated = events.map((ev) =>
        ev.id === editingEventId
          ? {
              ...ev,
              title: eventTitle.trim(),
              date: eventDate,
              startTime: eventStartTime,
              endTime: eventEndTime,
              color: eventColor,
              category: eventCategory,
              description: eventDescription.trim() || undefined,
              linkedNoteId: linkedNoteId || undefined,
              linkedNoteTitle: linkedTitle,
            }
          : ev
      );
      persistEvents(updated);
    } else {
      const newEv: CalendarEvent = {
        id: `event_${Date.now()}`,
        title: eventTitle.trim(),
        date: eventDate,
        startTime: eventStartTime,
        endTime: eventEndTime,
        color: eventColor,
        category: eventCategory,
        description: eventDescription.trim() || undefined,
        linkedNoteId: linkedNoteId || undefined,
        linkedNoteTitle: linkedTitle,
      };
      persistEvents([...events, newEv]);
    }
    setModalOpen(false);
  }

  function handleDeleteEvent(id: string) {
    persistEvents(events.filter((e) => e.id !== id));
    setModalOpen(false);
  }

  // Hours array for vertical axis (06:00 to 23:00)
  const hoursList = useMemo(() => {
    const list: number[] = [];
    for (let h = GRID_START_HOUR; h <= GRID_END_HOUR; h++) {
      list.push(h);
    }
    return list;
  }, []);

  const totalGridHeight = (GRID_END_HOUR - GRID_START_HOUR + 1) * HOUR_HEIGHT_PX;

  // Check if today matches a rendered date column
  const todayISO = formatDateToISO(new Date());

  // Connected note details for preview inside modal
  const selectedLinkedNote = useMemo(() => {
    if (!linkedNoteId) return null;
    return notes.find((n) => n.id === linkedNoteId) || null;
  }, [linkedNoteId, notes]);

  return (
    <section className="inner-page calendar-page-view">
      {/* Calendar Topbar */}
      <header className="cal-header">
        <div className="cal-title-group">
          <div className="cal-branding">
            <span className="cal-icon-date">
              {new Date().getDate()}
            </span>
            <div className="cal-header-text">
              <h2>Kalender Time Blocking</h2>
              <span className="cal-subtext">
                {formatReadableDate(selectedDate)}
              </span>
            </div>
          </div>

          <div className="cal-nav-buttons">
            <button type="button" className="cal-nav-btn today" onClick={handleToday}>
              Hari Ini
            </button>
            <button
              type="button"
              className="cal-nav-btn icon"
              onClick={handlePrev}
              aria-label="Sebelumnya"
              title="Hari Sebelumnya"
            >
              ‹
            </button>
            <button
              type="button"
              className="cal-nav-btn icon"
              onClick={handleNext}
              aria-label="Selanjutnya"
              title="Hari Berikutnya"
            >
              ›
            </button>
          </div>
        </div>

        <div className="cal-actions-right">
          {/* View switcher */}
          <div className="cal-view-modes">
            <button
              type="button"
              className={viewMode === "day" ? "cal-mode-btn active" : "cal-mode-btn"}
              onClick={() => setViewMode("day")}
            >
              1 Hari
            </button>
            <button
              type="button"
              className={viewMode === "3day" ? "cal-mode-btn active" : "cal-mode-btn"}
              onClick={() => setViewMode("3day")}
            >
              3 Hari
            </button>
            <button
              type="button"
              className={viewMode === "week" ? "cal-mode-btn active" : "cal-mode-btn"}
              onClick={() => setViewMode("week")}
            >
              Minggu
            </button>
          </div>

          <button
            type="button"
            className="cal-create-event-btn"
            onClick={() => openCreateModal()}
          >
            ＋ Buat Jadwal
          </button>
        </div>
      </header>

      {/* Main Calendar Grid */}
      <div className="cal-grid-wrapper">
        <div className="cal-main-scroll">
          {/* Top Dates Header Bar */}
          <div className="cal-date-columns-header">
            <div className="cal-time-axis-spacer" />
            <div className="cal-columns-row">
              {displayedDates.map((colDate) => {
                const colISO = formatDateToISO(colDate);
                const isToday = colISO === todayISO;
                return (
                  <div
                    key={colISO}
                    className={isToday ? "cal-day-header is-today" : "cal-day-header"}
                  >
                    <span className="cal-day-name">
                      {colDate.toLocaleDateString("id-ID", { weekday: "short" })}
                    </span>
                    <span className="cal-day-number">{colDate.getDate()}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time Grid Area */}
          <div className="cal-grid-body" style={{ height: totalGridHeight }}>
            {/* Left Hour Labels */}
            <div className="cal-time-axis">
              {hoursList.map((hour) => (
                <div
                  key={hour}
                  className="cal-time-label"
                  style={{ height: HOUR_HEIGHT_PX }}
                >
                  <span>{String(hour).padStart(2, "0")}:00</span>
                </div>
              ))}
            </div>

            {/* Columns for each displayed day */}
            <div className="cal-columns-body">
              {displayedDates.map((colDate) => {
                const colISO = formatDateToISO(colDate);
                const isToday = colISO === todayISO;
                const colEvents = getEventsForDate(events, colISO);

                return (
                  <div
                    key={colISO}
                    className={isToday ? "cal-column is-today" : "cal-column"}
                    style={{ height: totalGridHeight }}
                  >
                    {/* Hour dividing lines & click targets */}
                    {hoursList.map((hour) => (
                      <div
                        key={hour}
                        className="cal-hour-cell"
                        style={{ height: HOUR_HEIGHT_PX }}
                        onClick={() => openCreateModal(colISO, hour)}
                        title={`Klik untuk buat jadwal pukul ${hour}:00`}
                      />
                    ))}

                    {/* Current time red indicator line */}
                    {isToday && currentTimeIndicator !== null && (
                      <div
                        className="cal-current-time-indicator"
                        style={{ top: currentTimeIndicator }}
                      >
                        <span className="cal-current-time-dot" />
                        <span className="cal-current-time-line" />
                      </div>
                    )}

                    {/* Event Time Blocks */}
                    {colEvents.map((event) => {
                      const { top, height } = calculateEventPosition(
                        event.startTime,
                        event.endTime,
                        GRID_START_HOUR,
                        HOUR_HEIGHT_PX
                      );

                      return (
                        <div
                          key={event.id}
                          className="cal-event-block"
                          style={{
                            top,
                            height,
                            backgroundColor: event.color,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(event);
                          }}
                        >
                          <div className="cal-event-content">
                            <strong className="cal-event-title">{event.title}</strong>
                            <span className="cal-event-time">
                              {event.startTime} - {event.endTime}
                            </span>
                            {event.linkedNoteTitle && (
                              <span className="cal-event-linked-badge" title="Terhubung dengan Catatan">
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

      {/* Create / Edit Event Modal (Matching Google Calendar modal) */}
      {modalOpen && (
        <div className="modal-backdrop cal-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div
            className="cal-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Form Jadwal"
          >
            <div className="cal-modal-top-bar">
              <span className="cal-modal-handle">═</span>
              <button
                type="button"
                className="cal-modal-close"
                onClick={() => setModalOpen(false)}
                aria-label="Tutup modal"
              >
                ✕
              </button>
            </div>

            {/* Title Input with underline border */}
            <div className="cal-input-title-wrapper">
              <input
                type="text"
                placeholder="Tambahkan judul blok waktu / acara..."
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="cal-title-input"
                autoFocus
              />
            </div>

            {/* Category Switcher: Acara (Event) vs Tugas (Task) */}
            <div className="cal-category-tabs">
              <button
                type="button"
                className={eventCategory === "event" ? "cal-cat-tab active" : "cal-cat-tab"}
                onClick={() => setEventCategory("event")}
              >
                Acara / Blok Fokus
              </button>
              <button
                type="button"
                className={eventCategory === "task" ? "cal-cat-tab active" : "cal-cat-tab"}
                onClick={() => setEventCategory("task")}
              >
                Tugas / Todo
              </button>
            </div>

            {/* Date & Time pickers */}
            <div className="cal-time-pickers-row">
              <span className="cal-field-icon">🕒</span>
              <div className="cal-field-content">
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="cal-date-picker"
                />
                <div className="cal-range-times">
                  <input
                    type="time"
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    className="cal-time-picker"
                  />
                  <span>—</span>
                  <input
                    type="time"
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    className="cal-time-picker"
                  />
                </div>
              </div>
            </div>

            {/* Linked Note / Todo List Section (Crucial user request!) */}
            <div className="cal-linked-note-row">
              <span className="cal-field-icon">📝</span>
              <div className="cal-field-content">
                <label className="cal-field-label">Hubungkan ke Catatan / Todo:</label>
                <select
                  value={linkedNoteId}
                  onChange={(e) => setLinkedNoteId(e.target.value)}
                  className="cal-select-note"
                >
                  <option value="">-- Tidak Terhubung / Mandiri --</option>
                  {notes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.type === "checklist" ? "☑️ " : "📝 "}
                      {n.title || "Tanpa Judul"} ({n.labels?.join(", ") || "Umum"})
                    </option>
                  ))}
                </select>

                {/* Preview of connected note if checklist */}
                {selectedLinkedNote && (
                  <div className="cal-linked-preview-box">
                    <div className="preview-header">
                      <strong>Terhubung: {selectedLinkedNote.title}</strong>
                      {onNavigateToNotes && (
                        <button
                          type="button"
                          className="preview-link-btn"
                          onClick={() => {
                            setModalOpen(false);
                            onNavigateToNotes();
                          }}
                        >
                          Buka di Catatan →
                        </button>
                      )}
                    </div>
                    {selectedLinkedNote.type === "checklist" && selectedLinkedNote.items ? (
                      <div className="preview-items-list">
                        {selectedLinkedNote.items.slice(0, 4).map((it) => (
                          <div key={it.id} className="preview-item">
                            <span>{it.done ? "✓" : "○"}</span>
                            <span className={it.done ? "preview-done" : ""}>{it.text}</span>
                          </div>
                        ))}
                        {selectedLinkedNote.items.length > 4 && (
                          <small className="preview-more">
                            +{selectedLinkedNote.items.length - 4} item lainnya...
                          </small>
                        )}
                      </div>
                    ) : (
                      <p className="preview-text-snippet">
                        {selectedLinkedNote.content?.slice(0, 120)}...
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Description textarea */}
            <div className="cal-desc-row">
              <span className="cal-field-icon">≡</span>
              <div className="cal-field-content">
                <textarea
                  placeholder="Tambahkan deskripsi atau catatan agenda..."
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  rows={2}
                  className="cal-desc-input"
                />
              </div>
            </div>

            {/* Color Swatches */}
            <div className="cal-color-row">
              <span className="cal-field-icon">🎨</span>
              <div className="cal-field-content">
                <div className="cal-color-palette">
                  {CALENDAR_COLORS.map((col) => (
                    <button
                      key={col.name}
                      type="button"
                      title={col.name}
                      style={{ backgroundColor: col.hex }}
                      className={eventColor === col.hex ? "cal-color-swatch selected" : "cal-color-swatch"}
                      onClick={() => setEventColor(col.hex)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="cal-modal-actions-bar">
              {editingEventId ? (
                <button
                  type="button"
                  className="cal-delete-btn"
                  onClick={() => handleDeleteEvent(editingEventId)}
                >
                  🗑️ Hapus Jadwal
                </button>
              ) : (
                <div />
              )}

              <div className="cal-action-btns-right">
                <button
                  type="button"
                  className="cal-btn-cancel"
                  onClick={() => setModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="cal-btn-save"
                  disabled={!eventTitle.trim()}
                  onClick={handleSaveEvent}
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
