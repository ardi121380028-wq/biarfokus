"use client";

import { useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { CalendarEvent, UserRole } from "@/types/domain";
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
import { useKanban } from "@/features/kanban/use-kanban";
import { CalendarSidebar } from "./calendar-sidebar";
import { CalendarTopbar } from "./calendar-topbar";
import { CalendarGrid } from "./calendar-grid";
import { CalendarMonthView } from "./calendar-month-view";
import { CalendarYearView } from "./calendar-year-view";
import { CalendarEventModal } from "./calendar-event-modal";

type CalendarViewProps = {
  userId?: string | null;
  user?: User | null;
  userName?: string;
  userAvatar?: string | null;
  userRole?: UserRole;
  dark?: boolean;
  onToggleDark?: () => void;
  onOpenSettings?: () => void;
  onOpenProfile?: () => void;
  onNavigate?: (view: "timer" | "notes" | "calendar" | "kanban" | "stats" | "pricing" | "admin") => void;
  onNavigateToNotes?: () => void;
  onRequireLogin?: () => void;
};

export function CalendarView({
  userId,
  userName,
  userAvatar,
  dark,
  onToggleDark,
  onOpenSettings,
  onOpenProfile,
  onNavigate,
  onNavigateToNotes,
  onRequireLogin,
}: CalendarViewProps) {
  const { events, addEvent, updateEvent, deleteEvent } = useCalendarEvents(userId);
  const { notes } = useKeepNotes(userId);
  const { boards } = useKanban(userId);

  // Collapsible Sidebar state (persisted)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("biarfokus.calendar.sidebar_collapsed");
        if (stored !== null) return stored === "true";
        return window.innerWidth < 1024;
      } catch {}
    }
    return false;
  });

  function toggleSidebar() {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("biarfokus.calendar.sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  }

  // Category filters in sidebar
  const [categoryFilters, setCategoryFilters] = useState<{
    event: boolean;
    task: boolean;
    recurring: boolean;
  }>({
    event: true,
    task: true,
    recurring: true,
  });

  function toggleCategoryFilter(cat: "event" | "task" | "recurring") {
    setCategoryFilters((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  }

  const [anchorDate, setAnchorDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("week");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [modalDraft, setModalDraft] = useState<EventDraft | null>(null);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const isRecurring =
        Boolean(e.recurrence && e.recurrence.frequency !== "none") || Boolean(e.isRecurringOccurrence);

      if (isRecurring && !categoryFilters.recurring) return false;
      if (!isRecurring && e.category === "task" && !categoryFilters.task) return false;
      if (!isRecurring && e.category !== "task" && !categoryFilters.event) return false;

      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;

      return (
        e.title.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.linkedNoteTitle && e.linkedNoteTitle.toLowerCase().includes(q)) ||
        (e.linkedItemText && e.linkedItemText.toLowerCase().includes(q))
      );
    });
  }, [events, categoryFilters, searchQuery]);

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

  /* Date selection from Sidebar Mini Calendar, Month or Year view */
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
      recurrence: undefined,
    });
    setModalOpen(true);
  }

  function handleOpenEdit(event: CalendarEvent) {
    // If user clicked a virtual recurring occurrence, edit the original master event
    const masterEvent = event.originalEventId
      ? events.find((e) => e.id === event.originalEventId) || event
      : event;

    setEditingId(masterEvent.id);
    setModalDraft({
      title: masterEvent.title,
      date: masterEvent.date,
      startTime: masterEvent.startTime,
      endTime: masterEvent.endTime,
      color: masterEvent.color,
      category: masterEvent.category || "event",
      description: masterEvent.description,
      linkedNoteId: masterEvent.linkedNoteId,
      linkedNoteTitle: masterEvent.linkedNoteTitle,
      linkedItemId: masterEvent.linkedItemId,
      linkedItemText: masterEvent.linkedItemText,
      linkedKanbanCardId: masterEvent.linkedKanbanCardId,
      linkedKanbanBoardId: masterEvent.linkedKanbanBoardId,
      linkedKanbanBoardTitle: masterEvent.linkedKanbanBoardTitle,
      recurrence: masterEvent.recurrence,
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
    <div className="cal-app-workspace">
      {/* Collapsible Left Sidebar */}
      <CalendarSidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        onCreateClick={() => handleOpenCreate()}
        anchorDate={anchorDate}
        onSelectDate={handleSelectDate}
        categoryFilters={categoryFilters}
        onToggleCategoryFilter={toggleCategoryFilter}
        onNavigate={onNavigate}
        onOpenSettings={onOpenSettings}
        dark={dark}
        onToggleDark={onToggleDark}
      />

      {/* Main Workspace Layout */}
      <div className="cal-workspace-main">
        {/* Workspace Topbar */}
        <CalendarTopbar
          anchorDate={anchorDate}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onToday={handleToday}
          onPrev={handlePrev}
          onNext={handleNext}
          onToggleSidebar={toggleSidebar}
          isSidebarCollapsed={sidebarCollapsed}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          dark={dark}
          onToggleDark={onToggleDark}
          onOpenSettings={onOpenSettings}
          onOpenProfile={onOpenProfile}
          userName={userName}
          userAvatar={userAvatar}
          onRequireLogin={onRequireLogin}
          onNavigate={onNavigate}
        />

        {/* Content Canvas */}
        <main className="cal-workspace-content">
          {events.length === 0 && (
            <div className="cal-empty-notice">
              <span>
                📅 <strong>Kalender masih kosong.</strong> Klik petak jam mana saja atau tekan{" "}
                <strong>+ Buat Jadwal</strong> di sidebar untuk mulai time-blocking dan jadwal berulang.
              </span>
              {onNavigateToNotes && (
                <button type="button" onClick={onNavigateToNotes}>
                  Lihat Catatan →
                </button>
              )}
            </div>
          )}

          {/* Day & Week View */}
          {(viewMode === "day" || viewMode === "week") && (
            <CalendarGrid
              days={visibleDays}
              events={filteredEvents}
              onSlotClick={(dateISO, hour) => handleOpenCreate(dateISO, hour)}
              onEventClick={handleOpenEdit}
              onUpdateEvent={(updated) => {
                const targetId = updated.originalEventId || updated.id;
                updateEvent({ ...updated, id: targetId });
              }}
            />
          )}

          {/* Month View */}
          {viewMode === "month" && (
            <CalendarMonthView
              anchorDate={anchorDate}
              events={filteredEvents}
              onSelectDate={handleSelectDate}
              onSlotClick={(dateISO, hour) => handleOpenCreate(dateISO, hour)}
              onEventClick={handleOpenEdit}
            />
          )}

          {/* Year View */}
          {viewMode === "year" && (
            <CalendarYearView
              anchorDate={anchorDate}
              events={filteredEvents}
              onSelectDate={handleSelectDate}
            />
          )}
        </main>
      </div>

      {/* Create / Edit Event Modal */}
      {modalOpen && modalDraft && (
        <CalendarEventModal
          initialDraft={modalDraft}
          editingId={editingId}
          notes={notes}
          boards={boards}
          onSave={handleSaveDraft}
          onDelete={(id) => {
            deleteEvent(id);
            setModalOpen(false);
          }}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
