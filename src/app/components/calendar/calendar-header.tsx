"use client";

import type { CalendarViewMode } from "@/features/calendar/calendar-service";
import styles from "./calendar.module.css";

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
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <div className={styles.branding}>
          <span className={styles.dateIcon}>{new Date().getDate()}</span>
          <div className={styles.titleArea}>
            <h2 className={styles.title}>Kalender Time Blocking</h2>
            <span className={styles.periodLabel}>{periodLabel}</span>
          </div>
        </div>

        {/* Pagination & Navigation Toolbar */}
        <div className={styles.navToolbar}>
          <button
            type="button"
            className={styles.todayBtn}
            onClick={onToday}
            title="Kembali ke hari ini"
          >
            Hari Ini
          </button>

          {/* Month pagination */}
          <button
            type="button"
            className={styles.paginationBtn}
            onClick={onPrevMonth}
            title="Lompat 1 Bulan Sebelumnya"
          >
            « Bulan Lalu
          </button>

          {/* Period (Week / Day) pagination */}
          <button
            type="button"
            className={styles.paginationBtn}
            onClick={onPrevPeriod}
            title={isWeek ? "7 Hari Sebelumnya" : "Hari Sebelumnya"}
          >
            ‹ {isWeek ? "7 Hari" : "Kemarin"}
          </button>

          <button
            type="button"
            className={styles.paginationBtn}
            onClick={onNextPeriod}
            title={isWeek ? "7 Hari Selanjutnya" : "Hari Selanjutnya"}
          >
            {isWeek ? "7 Hari" : "Besok"} ›
          </button>

          <button
            type="button"
            className={styles.paginationBtn}
            onClick={onNextMonth}
            title="Lompat 1 Bulan Selanjutnya"
          >
            Bulan Depan »
          </button>
        </div>
      </div>

      <div className={styles.headerRight}>
        <div className={styles.viewSwitcher}>
          <button
            type="button"
            className={
              viewMode === "week"
                ? `${styles.viewModeBtn} ${styles.viewModeBtnActive}`
                : styles.viewModeBtn
            }
            onClick={() => onViewModeChange("week")}
          >
            7 Hari
          </button>
          <button
            type="button"
            className={
              viewMode === "day"
                ? `${styles.viewModeBtn} ${styles.viewModeBtnActive}`
                : styles.viewModeBtn
            }
            onClick={() => onViewModeChange("day")}
          >
            1 Hari
          </button>
        </div>

        <button
          type="button"
          className={styles.createBtn}
          onClick={onCreateClick}
        >
          ＋ Buat Jadwal
        </button>
      </div>
    </header>
  );
}
