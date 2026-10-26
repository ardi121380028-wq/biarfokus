"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useEscapeKey, useOutsideClick } from "@/lib/hooks/use-dismiss";
import { toISODate } from "@/features/calendar/calendar-service";

/* ========================================================================== */
/* 1. CustomSelect (Replaces boxy native <select>)                            */
/* ========================================================================== */

export type CustomSelectOption = {
  value: string;
  label: string;
  icon?: string;
  sublabel?: string;
};

type CustomSelectProps = {
  value: string;
  options: CustomSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export function CustomSelect({
  value,
  options,
  onChange,
  placeholder = "-- Pilih --",
  className = "",
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEscapeKey(() => setIsOpen(false), isOpen);
  useOutsideClick(containerRef, () => setIsOpen(false), isOpen);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value) || null,
    [options, value]
  );

  return (
    <div
      ref={containerRef}
      className={`modern-select-container ${isOpen ? "is-open" : ""} ${className}`}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className="modern-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="modern-select-label-wrap">
          {selectedOption?.icon && (
            <span className="modern-select-icon">{selectedOption.icon}</span>
          )}
          <span className="modern-select-text">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.sublabel && (
            <span className="modern-select-sublabel">({selectedOption.sublabel})</span>
          )}
        </span>
        <span className={`modern-select-chevron ${isOpen ? "rotate" : ""}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="modern-select-dropdown" role="listbox">
          {options.length === 0 ? (
            <div className="modern-select-empty">Tidak ada pilihan</div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={opt.value}
                  className={`modern-select-option ${isSelected ? "selected" : ""}`}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={0}
                >
                  <div className="option-label-group">
                    {opt.icon && <span className="option-icon">{opt.icon}</span>}
                    <span className="option-title">{opt.label}</span>
                    {opt.sublabel && (
                      <span className="option-sublabel">{opt.sublabel}</span>
                    )}
                  </div>
                  {isSelected && (
                    <span className="option-check-mark">✓</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

/* ========================================================================== */
/* 2. CustomDatePicker (Replaces boxy native Chromium datepicker)             */
/* ========================================================================== */

const MONTH_NAMES_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const SHORT_DAYS_ID = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

type CustomDatePickerProps = {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  minDate?: string;
  className?: string;
};

export function CustomDatePicker({
  value,
  onChange,
  minDate,
  className = "",
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEscapeKey(() => setIsOpen(false), isOpen);
  useOutsideClick(containerRef, () => setIsOpen(false), isOpen);

  // Parse current selected date
  const parsedDate = useMemo(() => {
    if (!value) return new Date();
    const parts = value.split("-").map(Number);
    if (parts.length === 3) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date();
  }, [value]);

  const [viewYear, setViewYear] = useState(parsedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsedDate.getMonth());

  // Sync view when opened
  useEffect(() => {
    if (isOpen) {
      setViewYear(parsedDate.getFullYear());
      setViewMonth(parsedDate.getMonth());
    }
  }, [isOpen, parsedDate]);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  // Generate calendar days for viewMonth and viewYear
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Monday-indexed day of week: 0 = Monday, 6 = Sunday
    let startDayIdx = firstDay.getDay() - 1;
    if (startDayIdx < 0) startDayIdx = 6;

    const days: Array<{
      dateISO: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isDisabled: boolean;
      isToday: boolean;
      isSelected: boolean;
    }> = [];

    const todayISO = toISODate(new Date());

    // Previous month padding
    const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startDayIdx - 1; i >= 0; i--) {
      const prevDate = new Date(viewYear, viewMonth - 1, prevMonthLastDay - i);
      const iso = toISODate(prevDate);
      days.push({
        dateISO: iso,
        dayNumber: prevMonthLastDay - i,
        isCurrentMonth: false,
        isDisabled: Boolean(minDate && iso < minDate),
        isToday: iso === todayISO,
        isSelected: iso === value,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const curDate = new Date(viewYear, viewMonth, d);
      const iso = toISODate(curDate);
      days.push({
        dateISO: iso,
        dayNumber: d,
        isCurrentMonth: true,
        isDisabled: Boolean(minDate && iso < minDate),
        isToday: iso === todayISO,
        isSelected: iso === value,
      });
    }

    // Next month padding to fill complete grid of weeks
    const remaining = 35 - days.length > 0 ? 35 - days.length : 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(viewYear, viewMonth + 1, d);
      const iso = toISODate(nextDate);
      days.push({
        dateISO: iso,
        dayNumber: d,
        isCurrentMonth: false,
        isDisabled: Boolean(minDate && iso < minDate),
        isToday: iso === todayISO,
        isSelected: iso === value,
      });
    }

    return days;
  }, [viewYear, viewMonth, minDate, value]);

  // Formatted trigger text e.g. "Sen, 26 Okt 2026"
  const formattedTriggerDate = useMemo(() => {
    if (!value) return "Pilih Tanggal";
    const d = parsedDate;
    const dayName = SHORT_DAYS_ID[d.getDay() === 0 ? 6 : d.getDay() - 1];
    const monthName = MONTH_NAMES_ID[d.getMonth()].slice(0, 3);
    return `${dayName}, ${d.getDate()} ${monthName} ${d.getFullYear()}`;
  }, [value, parsedDate]);

  function handleSelectDate(iso: string) {
    onChange(iso);
    setIsOpen(false);
  }

  function selectToday() {
    handleSelectDate(toISODate(new Date()));
  }

  function selectTomorrow() {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    handleSelectDate(toISODate(t));
  }

  return (
    <div ref={containerRef} className={`modern-datepicker-container ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="modern-picker-trigger"
        aria-label="Pilih tanggal"
      >
        <span className="modern-picker-icon">📅</span>
        <span className="modern-picker-val">{formattedTriggerDate}</span>
        <span className="modern-picker-arrow">▾</span>
      </button>

      {isOpen && (
        <div className="modern-datepicker-popover">
          {/* Header Month / Year controls */}
          <div className="datepicker-header">
            <button
              type="button"
              onClick={prevMonth}
              className="datepicker-nav-btn"
              title="Bulan sebelumnya"
            >
              ‹
            </button>
            <span className="datepicker-month-title">
              {MONTH_NAMES_ID[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="datepicker-nav-btn"
              title="Bulan berikutnya"
            >
              ›
            </button>
          </div>

          {/* Weekday columns */}
          <div className="datepicker-weekdays-row">
            {SHORT_DAYS_ID.map((day) => (
              <span key={day} className="datepicker-weekday-col">
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="datepicker-days-grid">
            {calendarDays.map((d) => (
              <button
                key={d.dateISO}
                type="button"
                disabled={d.isDisabled}
                onClick={() => handleSelectDate(d.dateISO)}
                className={`datepicker-day-cell ${
                  !d.isCurrentMonth ? "other-month" : ""
                } ${d.isToday ? "is-today" : ""} ${
                  d.isSelected ? "is-selected" : ""
                }`}
              >
                {d.dayNumber}
              </button>
            ))}
          </div>

          {/* Footer Shortcuts */}
          <div className="datepicker-footer-shortcuts">
            <button
              type="button"
              onClick={selectToday}
              className="datepicker-shortcut-btn"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={selectTomorrow}
              className="datepicker-shortcut-btn"
            >
              Besok
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ========================================================================== */
/* 3. CustomTimePicker (Replaces boxy native Chromium timepicker)             */
/* ========================================================================== */

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

type CustomTimePickerProps = {
  value: string; // HH:MM
  onChange: (value: string) => void;
  className?: string;
};

export function CustomTimePicker({
  value,
  onChange,
  className = "",
}: CustomTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEscapeKey(() => setIsOpen(false), isOpen);
  useOutsideClick(containerRef, () => setIsOpen(false), isOpen);

  const [currentHour, currentMinute] = useMemo(() => {
    if (!value || !value.includes(":")) return ["09", "00"];
    const [h, m] = value.split(":");
    return [h.padStart(2, "0"), m.padStart(2, "0")];
  }, [value]);

  function handleSelectHour(h: string) {
    onChange(`${h}:${currentMinute}`);
  }

  function handleSelectMinute(m: string) {
    onChange(`${currentHour}:${m}`);
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className={`modern-timepicker-container ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="modern-picker-trigger time-trigger"
        aria-label="Pilih jam"
      >
        <span className="modern-picker-icon">🕒</span>
        <span className="modern-picker-val">{value || "09:00"}</span>
        <span className="modern-picker-arrow">▾</span>
      </button>

      {isOpen && (
        <div className="modern-timepicker-popover">
          <div className="timepicker-header">
            <span className="timepicker-preview">
              {currentHour}:{currentMinute}
            </span>
            <span className="timepicker-hint">Pilih Jam &amp; Menit</span>
          </div>

          <div className="timepicker-columns">
            {/* Hours Column */}
            <div className="timepicker-col">
              <span className="timepicker-col-title">Jam</span>
              <div className="timepicker-scroll-list">
                {HOURS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => handleSelectHour(h)}
                    className={`timepicker-num-pill ${
                      h === currentHour ? "is-selected" : ""
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes Column */}
            <div className="timepicker-col">
              <span className="timepicker-col-title">Menit</span>
              <div className="timepicker-scroll-list">
                {MINUTES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleSelectMinute(m)}
                    className={`timepicker-num-pill ${
                      m === currentMinute ? "is-selected" : ""
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="timepicker-presets-row">
            <button
              type="button"
              onClick={() => {
                onChange("09:00");
                setIsOpen(false);
              }}
              className="timepicker-preset-btn"
            >
              09:00
            </button>
            <button
              type="button"
              onClick={() => {
                onChange("13:00");
                setIsOpen(false);
              }}
              className="timepicker-preset-btn"
            >
              13:00
            </button>
            <button
              type="button"
              onClick={() => {
                onChange("17:00");
                setIsOpen(false);
              }}
              className="timepicker-preset-btn"
            >
              17:00
            </button>
            <button
              type="button"
              onClick={() => {
                onChange("20:00");
                setIsOpen(false);
              }}
              className="timepicker-preset-btn"
            >
              20:00
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
