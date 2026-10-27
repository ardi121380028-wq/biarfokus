"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import type { CalendarEvent } from "@/types/domain";
import {
  CALENDAR_COLORS,
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
  onSuccess?: (event: CalendarEvent) => void;
}

export interface DurationPreset {
  focusMinutes: number;
  breakMinutes: number;
  label: string;
  sub: string;
  icon: string;
}

const PRESET_DURATIONS: DurationPreset[] = [
  { focusMinutes: 25, breakMinutes: 5, label: "25m", sub: "Pomodoro", icon: "🍅" },
  { focusMinutes: 50, breakMinutes: 10, label: "50m", sub: "Deep Work", icon: "⚡" },
  { focusMinutes: 90, breakMinutes: 15, label: "90m", sub: "Ultra Focus", icon: "🎯" },
  { focusMinutes: 120, breakMinutes: 20, label: "2 Jam", sub: "Extended", icon: "⏰" },
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
  const [selectedFocus, setSelectedFocus] = useState<number>(50);
  const [selectedBreak, setSelectedBreak] = useState<number>(10);
  const [includeBreak, setIncludeBreak] = useState<boolean>(true);
  const [date, setDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("10:00");
  const [color, setColor] = useState<string>(isFrog ? "#0b8043" : "#039be5");
  const [customNote, setCustomNote] = useState<string>("");

  // Initialize slots when opened
  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      // Default to 50m focus + 10m break (1 hour total block)
      const slot = getSmartTimeblockSlot(50, 10, true);
      setDate(slot.date);
      setStartTime(slot.startTime);
      setEndTime(slot.endTime);
      setSelectedFocus(50);
      setSelectedBreak(10);
      setIncludeBreak(true);
      setColor(isFrog ? "#0b8043" : "#039be5");
      setCustomNote("");
    }
  }, [isOpen, initialTitle, isFrog]);

  // Adjust end time when duration pill is clicked
  const handleSelectDuration = (preset: DurationPreset) => {
    setSelectedFocus(preset.focusMinutes);
    setSelectedBreak(preset.breakMinutes);
    const effectiveBreak = includeBreak ? preset.breakMinutes : 0;
    const totalMinutes = preset.focusMinutes + effectiveBreak;
    const startMins = timeToMinutes(startTime);
    const endMins = Math.min(startMins + totalMinutes, 23 * 60 + 59);
    setEndTime(minutesToTime(endMins));
  };

  // Toggle break calculation on/off
  const handleToggleBreak = (checked: boolean) => {
    setIncludeBreak(checked);
    const effectiveBreak = checked ? selectedBreak : 0;
    const totalMinutes = selectedFocus + effectiveBreak;
    const startMins = timeToMinutes(startTime);
    const endMins = Math.min(startMins + totalMinutes, 23 * 60 + 59);
    setEndTime(minutesToTime(endMins));
  };

  // Adjust duration if start or end time manually modified
  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    const effectiveBreak = includeBreak ? selectedBreak : 0;
    const totalMinutes = selectedFocus + effectiveBreak;
    const startMins = timeToMinutes(newStart);
    const endMins = Math.min(startMins + totalMinutes, 23 * 60 + 59);
    setEndTime(minutesToTime(endMins));
  };

  const handleEndTimeChange = (newEnd: string) => {
    setEndTime(newEnd);
    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(newEnd);
    if (endMins > startMins) {
      const diff = endMins - startMins;
      setSelectedFocus(diff);
      setSelectedBreak(0);
      setIncludeBreak(false);
    }
  };

  const currentTotalDuration = useMemo(() => {
    const s = timeToMinutes(startTime);
    const e = timeToMinutes(endTime);
    return e > s ? e - s : selectedFocus + (includeBreak ? selectedBreak : 0);
  }, [startTime, endTime, selectedFocus, selectedBreak, includeBreak]);

  const formattedDescription = useMemo(() => {
    const parts: string[] = [];
    if (includeBreak && selectedBreak > 0) {
      parts.push(`⏱️ Sesi ${selectedFocus}m fokus + ${selectedBreak}m istirahat (Total ${selectedFocus + selectedBreak} menit)`);
    } else {
      parts.push(`⏱️ Sesi Fokus: ${selectedFocus} menit`);
    }
    if (customNote.trim()) parts.push(customNote.trim());
    if (isFrog) parts.push("🐸 Tugas Prioritas Tertinggi (Eat That Frog)");
    if (sourceNoteTitle) parts.push(`📝 Dari Catatan: ${sourceNoteTitle}`);
    if (sourceItemText && sourceItemText !== initialTitle) parts.push(`🎯 Sub-task: ${sourceItemText}`);
    return parts.join("\n\n");
  }, [selectedFocus, selectedBreak, includeBreak, customNote, isFrog, sourceNoteTitle, sourceItemText, initialTitle]);

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

    onSuccess?.(created);
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
            <div className="quick-timeblock-field-header">
              <span className="cal-field-label">Pilih Durasi Fokus:</span>
              <span className="quick-timeblock-break-hint">
                {includeBreak ? `+${selectedBreak}m istirahat aktif` : "Tanpa istirahat"}
              </span>
            </div>
            <div className="quick-timeblock-duration-grid">
              {PRESET_DURATIONS.map((preset) => {
                const isActive = selectedFocus === preset.focusMinutes;
                return (
                  <button
                    key={preset.focusMinutes}
                    type="button"
                    className={`quick-duration-pill ${isActive ? "active" : ""}`}
                    onClick={() => handleSelectDuration(preset)}
                  >
                    <span className="dur-icon">{preset.icon}</span>
                    <span className="dur-label">{preset.label}</span>
                    <span className="dur-sub">{preset.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Break / Rest Recovery Toggle Card */}
          <div className="quick-timeblock-break-card">
            <div className="quick-timeblock-break-top">
              <label className="quick-timeblock-break-checkbox-label">
                <input
                  type="checkbox"
                  id="quick-tb-include-break"
                  checked={includeBreak}
                  onChange={(e) => handleToggleBreak(e.target.checked)}
                />
                <span className="break-checkbox-text">
                  Hitung waktu istirahat pemulihan (<strong>+{selectedBreak} menit</strong>)
                </span>
              </label>
              <span className={`break-badge-status ${includeBreak ? "included" : "excluded"}`}>
                {includeBreak ? "☕ Ada Jeda" : "⚡ Fokus Saja"}
              </span>
            </div>
            <div className="quick-timeblock-break-calc">
              {includeBreak ? (
                <span>
                  🔥 <strong>{selectedFocus}m fokus</strong> + ☕ <strong>{selectedBreak}m istirahat</strong> = Total blok <strong>{selectedFocus + selectedBreak} menit</strong> {selectedFocus + selectedBreak === 60 ? "(1 Jam penuh)" : ""}
                </span>
              ) : (
                <span>Blok waktu kalender hanya fokus murni <strong>{selectedFocus} menit</strong> (tanpa jeda pemulihan).</span>
              )}
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
                <span className="cal-duration-badge" title={`Total durasi blok kalender: ${currentTotalDuration} menit`}>
                  ({currentTotalDuration} menit{includeBreak && selectedBreak > 0 ? `: ${selectedFocus}m + ${selectedBreak}m istirahat` : ""})
                </span>
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

          <button
            type="button"
            className="cal-btn-save quick-timeblock-btn-save"
            onClick={handleScheduleBiarFokus}
            disabled={!title.trim()}
          >
            <span>📅</span>
            <span>Jadwalkan ke Kalender</span>
          </button>
        </footer>
      </div>
    </div>
  );
}
