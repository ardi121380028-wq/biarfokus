"use client";

import { useMemo, useState } from "react";
import type { CalendarViewMode } from "@/features/calendar/calendar-service";
import { getWeekNumber } from "@/features/calendar/calendar-service";
import { CustomSelect } from "./custom-calendar-pickers";

type CalendarHeaderProps = {
  anchorDate: Date;
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
  onCreateClick: () => void;
  onNavigateToNotes?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
};

export function CalendarHeader({
  anchorDate,
  viewMode,
  onViewModeChange,
  onToday,
  onPrev,
  onNext,
  onCreateClick,
  onNavigateToNotes,
  searchQuery,
  onSearchChange,
}: CalendarHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  const weekNumber = useMemo(() => getWeekNumber(anchorDate, true), [anchorDate]);

  // Title formatted to match Google Calendar
  const titleText = useMemo(() => {
    if (viewMode === "year") {
      return String(anchorDate.getFullYear());
    }
    if (viewMode === "month" || viewMode === "week") {
      return anchorDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
    // Day view
    return anchorDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [anchorDate, viewMode]);

  return (
    <header className="cal-header">
      {/* Left controls: Today, <, >, Title, Week badge */}
      <div className="cal-title-group">
        <button
          type="button"
          className="cal-today-pill-btn"
          onClick={onToday}
          title="Kembali ke hari ini"
        >
          Today
        </button>

        <div className="cal-arrow-nav">
          <button
            type="button"
            className="cal-arrow-btn"
            onClick={onPrev}
            aria-label="Sebelumnya"
            title="Sebelumnya"
          >
            ‹
          </button>
          <button
            type="button"
            className="cal-arrow-btn"
            onClick={onNext}
            aria-label="Selanjutnya"
            title="Selanjutnya"
          >
            ›
          </button>
        </div>

        <div className="cal-title-with-badge">
          <h2 className="cal-main-heading">{titleText}</h2>
          {viewMode === "week" && (
            <span className="cal-week-pill-badge" title={`Minggu ke-${weekNumber}`}>
              Week {weekNumber}
            </span>
          )}
        </div>
      </div>

      {/* Right controls: Search, View Mode Select, Toggle Icon, Create Button */}
      <div className="cal-actions-right">
        {/* Search button / input */}
        {searchOpen ? (
          <div className="cal-search-inline">
            <span className="cal-search-icon">🔍</span>
            <input
              type="text"
              autoFocus
              placeholder="Cari jadwal..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="cal-search-input"
            />
            <button
              type="button"
              className="cal-search-close"
              onClick={() => {
                onSearchChange("");
                setSearchOpen(false);
              }}
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="cal-icon-btn"
            onClick={() => setSearchOpen(true)}
            title="Cari jadwal"
            aria-label="Cari jadwal"
          >
            🔍
          </button>
        )}

        {/* View Mode Dropdown (Day, Week, Month, Year) */}
        <div className="cal-view-selector-wrapper">
          <CustomSelect
            value={viewMode}
            onChange={(val) => onViewModeChange(val as CalendarViewMode)}
            options={[
              { value: "day", label: "Hari" },
              { value: "week", label: "Minggu" },
              { value: "month", label: "Bulan" },
              { value: "year", label: "Tahun" },
            ]}
          />
        </div>

        {/* Quick Tab to Notes / Checklist */}
        {onNavigateToNotes && (
          <div className="cal-tab-switcher">
            <button
              type="button"
              className="cal-tab-btn active"
              title="Tampilan Kalender"
              aria-label="Tampilan Kalender"
            >
              📅
            </button>
            <button
              type="button"
              className="cal-tab-btn"
              onClick={onNavigateToNotes}
              title="Buka Catatan & Todo List"
              aria-label="Buka Catatan & Todo List"
            >
              ☑️
            </button>
          </div>
        )}

        {/* Create Event Button */}
        <button
          type="button"
          className="cal-create-event-btn"
          onClick={onCreateClick}
        >
          ＋ Buat Jadwal
        </button>
      </div>
    </header>
  );
}
