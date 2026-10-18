"use client";

import type { CalendarViewMode } from "@/features/calendar/calendar-service";

type CalendarHeaderProps = {
  periodLabel: string;
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onToday: () => void;
  onPrevPeriod: () => void;
  onNextPeriod: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onCreateClick: () => void;
};

export function CalendarHeader({
  periodLabel,
  viewMode,
  onViewModeChange,
  onToday,
  onPrevPeriod,
  onNextPeriod,
  onPrevMonth,
  onNextMonth,
  onCreateClick,
}: CalendarHeaderProps) {
  const isWeek = viewMode === "week";

  return (
    <header className="cal-header">
      <div className="cal-title-group">
        <div className="cal-branding">
          <span className="cal-icon-date">{new Date().getDate()}</span>
          <div className="cal-header-text">
            <h2>Kalender Time Blocking</h2>
            <span className="cal-subtext">{periodLabel}</span>
          </div>
        </div>

        {/* Pagination & Navigation Toolbar */}
        <div className="cal-nav-buttons">
          <button
            type="button"
            className="cal-nav-btn today"
            onClick={onToday}
            title="Kembali ke hari ini"
          >
            Hari Ini
          </button>

          {/* Month pagination */}
          <button
            type="button"
            className="cal-nav-btn"
            onClick={onPrevMonth}
            title="Lompat 1 Bulan Sebelumnya"
          >
            « Bulan Lalu
          </button>

          {/* Period (Week / Day) pagination */}
          <button
            type="button"
            className="cal-nav-btn"
            onClick={onPrevPeriod}
            title={isWeek ? "7 Hari Sebelumnya" : "Hari Sebelumnya"}
          >
            ‹ {isWeek ? "7 Hari" : "Kemarin"}
          </button>

          <button
            type="button"
            className="cal-nav-btn"
            onClick={onNextPeriod}
            title={isWeek ? "7 Hari Selanjutnya" : "Hari Selanjutnya"}
          >
            {isWeek ? "7 Hari" : "Besok"} ›
          </button>

          <button
            type="button"
            className="cal-nav-btn"
            onClick={onNextMonth}
            title="Lompat 1 Bulan Selanjutnya"
          >
            Bulan Depan »
          </button>
        </div>
      </div>

      <div className="cal-actions-right">
        <div className="cal-view-modes">
          <button
            type="button"
            className={viewMode === "week" ? "cal-mode-btn active" : "cal-mode-btn"}
            onClick={() => onViewModeChange("week")}
          >
            7 Hari
          </button>
          <button
            type="button"
            className={viewMode === "day" ? "cal-mode-btn active" : "cal-mode-btn"}
            onClick={() => onViewModeChange("day")}
          >
            1 Hari
          </button>
        </div>

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
