"use client";

import { useRouter } from "next/navigation";
import type { ActiveCalendarReminder } from "@/features/calendar/use-calendar-reminders";

interface CalendarReminderToastProps {
  reminder: ActiveCalendarReminder | null;
  onDismiss: () => void;
}

export function CalendarReminderToast({
  reminder,
  onDismiss,
}: CalendarReminderToastProps) {
  const router = useRouter();

  if (!reminder) return null;

  const { event, milestone, diffMinutes } = reminder;
  const isStart = milestone === "start";

  const handleOpenCalendar = () => {
    onDismiss();
    router.push("/kalender");
  };

  return (
    <div
      className="calendar-reminder-toast"
      role="alert"
      aria-live="polite"
    >
      <div className="cal-reminder-accent" style={{ backgroundColor: event.color || "#039be5" }} />
      <div className="cal-reminder-content">
        <div className="cal-reminder-header">
          <span className={`cal-reminder-badge ${isStart ? "badge-start" : "badge-upcoming"}`}>
            {isStart ? "🔔 Dimulai Sekarang" : `⏳ ${diffMinutes} Menit Lagi`}
          </span>
          <button
            type="button"
            className="cal-reminder-close"
            onClick={onDismiss}
            aria-label="Tutup pengingat jadwal"
          >
            ✕
          </button>
        </div>

        <h4 className="cal-reminder-title">{event.title}</h4>

        <div className="cal-reminder-time">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>
            {event.startTime} – {event.endTime}
          </span>
          {event.linkedKanbanBoardTitle && (
            <span className="cal-reminder-board-tag">
              📋 {event.linkedKanbanBoardTitle}
            </span>
          )}
        </div>

        {event.description && (
          <p className="cal-reminder-desc">{event.description}</p>
        )}

        <div className="cal-reminder-actions">
          <button
            type="button"
            className="cal-reminder-open-btn"
            onClick={handleOpenCalendar}
          >
            Buka Kalender
          </button>
          <button
            type="button"
            className="cal-reminder-dismiss-btn"
            onClick={onDismiss}
          >
            Nanti Saja
          </button>
        </div>
      </div>
    </div>
  );
}
