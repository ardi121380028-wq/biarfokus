"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import type { CalendarEvent } from "@/types/domain";
import {
  CALENDAR_COLORS,
  buildGoogleCalendarUrl,
  getSmartTimeblockSlot,
  minutesToTime,
  timeToMinutes,
} from "@/features/calendar/calendar-service";
import { useCalendarEvents } from "@/features/calendar/use-calendar-events";
import { useEscapeKey, useOutsideClick } from "@/lib/hooks/use-dismiss";
import { CustomDatePicker, CustomTimePicker } from "./custom-calendar-pickers";

export interface QuickTimeblockModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTitle: string;
  sourceNoteId?: string;
  sourceNoteTitle?: string;
  sourceItemId?: string;
  sourceItemText?: string;
  isFrog?: boolean;
  userId?: string | null;
  onSuccess?: (event: CalendarEvent, openedInGCal?: boolean) => void;
}

const PRESET_DURATIONS = [
  { minutes: 25, label: "25m", sub: "Pomodoro", icon: "🍅" },
  { minutes: 50, label: "50m", sub: "Deep Work", icon: "⚡" },
  { minutes: 90, label: "90m", sub: "Ultra Focus", icon: "🎯" },
  { minutes: 120, label: "2 Jam", sub: "Extended", icon: "⏰" },
];

export function QuickTimeblockModal({
  isOpen,
  onClose,
  initialTitle,
  sourceNoteId,
  sourceNoteTitle,
  sourceItemId,
  sourceItemText,
  isFrog = false,
  userId,
  onSuccess,
}: QuickTimeblockModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  useOutsideClick(modalRef, onClose, isOpen);
  useEscapeKey(onClose, isOpen);

  const { addEvent } = useCalendarEvents(userId);

  // Form states
  const [title, setTitle] = useState(initialTitle);
  const [selectedDuration, setSelectedDuration] = useState<number>(50);
  const [date, setDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("09:50");
  const [color, setColor] = useState<string>(isFrog ? "#0b8043" : "#039be5");
  const [customNote, setCustomNote] = useState<string>("");

  // Initialize slots when opened
  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      const slot = getSmartTimeblockSlot(50);
      setDate(slot.date);
      setStartTime(slot.startTime);
      setEndTime(slot.endTime);
      setSelectedDuration(50);
      setColor(isFrog ? "#0b8043" : "#039be5");
      setCustomNote("");
    }
  }, [isOpen, initialTitle, isFrog]);

  // Adjust end time when duration pill is clicked
  const handleSelectDuration = (minutes: number) => {
    setSelectedDuration(minutes);
    const startMins = timeToMinutes(startTime);
    const endMins = Math.min(startMins + minutes, 23 * 60 + 59);
    setEndTime(minutesToTime(endMins));
  };

  // Adjust duration if start or end time manually modified
  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    const startMins = timeToMinutes(newStart);
    const endMins = Math.min(startMins + selectedDuration, 23 * 60 + 59);
    setEndTime(minutesToTime(endMins));
  };

  const handleEndTimeChange = (newEnd: string) => {
    setEndTime(newEnd);
    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(newEnd);
    if (endMins > startMins) {
      setSelectedDuration(endMins - startMins);
    }
  };

  const formattedDescription = useMemo(() => {
    const parts: string[] = [];
    if (customNote.trim()) parts.push(customNote.trim());
    if (isFrog) parts.push("🐸 Tugas Prioritas Tertinggi (Eat That Frog)");
    if (sourceNoteTitle) parts.push(`📝 Dari Catatan: ${sourceNoteTitle}`);
    if (sourceItemText && sourceItemText !== initialTitle) parts.push(`🎯 Sub-task: ${sourceItemText}`);
    return parts.join("\n\n");
  }, [customNote, isFrog, sourceNoteTitle, sourceItemText, initialTitle]);

  const handleScheduleBiarFokus = () => {
    const finalTitle = title.trim() || initialTitle || "Sesi Timeblock Fokus";
    const created = addEvent({
      title: finalTitle,
      date,
      startTime,
      endTime,
      color,
      category: "task",
      description: formattedDescription,
      linkedNoteId: sourceNoteId,
      linkedNoteTitle: sourceNoteTitle,
      linkedItemId: sourceItemId,
      linkedItemText: sourceItemText,
    });

    onSuccess?.(created, false);
    onClose();
  };

  const handleScheduleGoogleCalendar = () => {
    const finalTitle = title.trim() || initialTitle || "Sesi Timeblock Fokus";
    // Also save into BiarFokus so user has it in both places
    const created = addEvent({
      title: finalTitle,
      date,
      startTime,
      endTime,
      color,
      category: "task",
      description: formattedDescription,
      linkedNoteId: sourceNoteId,
      linkedNoteTitle: sourceNoteTitle,
      linkedItemId: sourceItemId,
      linkedItemText: sourceItemText,
    });

    // Generate Google Calendar Link
    const gcalUrl = buildGoogleCalendarUrl({
      title: finalTitle,
      description: formattedDescription,
      date,
      startTime,
      endTime,
    });

    if (typeof window !== "undefined") {
      window.open(gcalUrl, "_blank", "noopener,noreferrer");
    }

    onSuccess?.(created, true);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="cal-modal-backdrop" role="dialog" aria-modal="true">
      <div ref={modalRef} className="quick-timeblock-modal-dialog">
        {/* Header */}
        <header className="quick-timeblock-header">
          <div className="quick-timeblock-title-row">
            <span className="quick-timeblock-icon">{isFrog ? "🐸" : "📅"}</span>
            <div>
              <h3>{isFrog ? "Timeblock Eat Your Frog" : "Timeblock Tugas ke Kalender"}</h3>
              <p>Jadwalkan sesi fokus terlindungi untuk mengeksekusi tugas ini tanpa distraksi.</p>
            </div>
          </div>
          <button
            type="button"
            className="cal-close-btn"
            onClick={onClose}
            aria-label="Tutup dialog"
          >
            ✕
          </button>
        </header>

        {/* Modal Body */}
        <div className="quick-timeblock-body">
          {/* Frog / Note Badge */}
          {(isFrog || sourceNoteTitle) && (
            <div className="quick-timeblock-badge-bar">
              {isFrog && (
                <span className="quick-timeblock-pill frog">
                  🐸 Frog Task Hari Ini
                </span>
              )}
              {sourceNoteTitle && (
                <span className="quick-timeblock-pill note" title={`Terhubung dengan catatan ${sourceNoteTitle}`}>
                  📝 {sourceNoteTitle}
                  {sourceItemText && sourceItemText !== initialTitle ? ` · ${sourceItemText}` : ""}
                </span>
              )}
            </div>
          )}

          {/* Title Input */}
          <div className="quick-timeblock-field">
            <label htmlFor="quick-tb-title" className="cal-field-label">
              Judul Sesi Timeblock:
            </label>
            <input
              id="quick-tb-title"
              type="text"
              className="quick-timeblock-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Apa yang akan kamu selesaikan dalam sesi ini?"
              autoFocus
            />
          </div>

          {/* Duration Presets */}
          <div className="quick-timeblock-field">
            <span className="cal-field-label">Pilih Durasi Fokus:</span>
            <div className="quick-timeblock-duration-grid">
              {PRESET_DURATIONS.map((preset) => {
                const isActive = selectedDuration === preset.minutes;
                return (
                  <button
                    key={preset.minutes}
                    type="button"
                    className={`quick-duration-pill ${isActive ? "active" : ""}`}
                    onClick={() => handleSelectDuration(preset.minutes)}
                  >
                    <span className="dur-icon">{preset.icon}</span>
                    <span className="dur-label">{preset.label}</span>
                    <span className="dur-sub">{preset.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Time Range Row */}
          <div className="quick-timeblock-field">
            <span className="cal-field-label">Waktu Eksekusi:</span>
            <div className="quick-timeblock-time-row">
              <div className="quick-timeblock-date-wrap">
                <CustomDatePicker
                  value={date}
                  onChange={(d) => setDate(d)}
                />
              </div>

              <div className="quick-timeblock-times-wrap">
                <CustomTimePicker
                  value={startTime}
                  onChange={handleStartTimeChange}
                />
                <span className="quick-timeblock-dash">—</span>
                <CustomTimePicker
                  value={endTime}
                  onChange={handleEndTimeChange}
                />
                <span className="cal-duration-badge">({selectedDuration} menit)</span>
              </div>
            </div>
          </div>

          {/* Color Palette Row */}
          <div className="quick-timeblock-field">
            <span className="cal-field-label">Label Warna:</span>
            <div className="cal-color-palette">
              {CALENDAR_COLORS.map((col) => (
                <button
                  key={col.name}
                  type="button"
                  title={col.name}
                  style={{ backgroundColor: col.hex }}
                  className={
                    color === col.hex
                      ? "cal-color-swatch selected"
                      : "cal-color-swatch"
                  }
                  onClick={() => setColor(col.hex)}
                />
              ))}
            </div>
          </div>

          {/* Custom Note/Details */}
          <div className="quick-timeblock-field">
            <label htmlFor="quick-tb-note" className="cal-field-label">
              Catatan Sesi (Opsional):
            </label>
            <textarea
              id="quick-tb-note"
              rows={2}
              className="quick-timeblock-textarea"
              placeholder="Contoh: Selesaikan sub-task bab 1, matikan notifikasi HP..."
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <footer className="quick-timeblock-footer">
          <button
            type="button"
            className="cal-btn-cancel"
            onClick={onClose}
          >
            Batal
          </button>

          <div className="quick-timeblock-submit-group">
            <button
              type="button"
              className="quick-timeblock-btn-gcal"
              onClick={handleScheduleGoogleCalendar}
              title="Buka & Tambahkan langsung ke Google Calendar di tab baru"
            >
              <span>🌐</span>
              <span>Buka di Google Calendar</span>
            </button>

            <button
              type="button"
              className="cal-btn-save quick-timeblock-btn-save"
              onClick={handleScheduleBiarFokus}
              disabled={!title.trim()}
            >
              <span>📅</span>
              <span>Simpan di Kalender</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
