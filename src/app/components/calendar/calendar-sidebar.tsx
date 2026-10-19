"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  getMonthGrid,
  isSameDay,
} from "@/features/calendar/calendar-service";

type CalendarSidebarProps = {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onCreateClick: () => void;
  anchorDate: Date;
  onSelectDate: (d: Date) => void;
  categoryFilters: {
    event: boolean;
    task: boolean;
    recurring: boolean;
  };
  onToggleCategoryFilter: (category: "event" | "task" | "recurring") => void;
  onNavigate?: (view: "timer" | "notes" | "calendar" | "kanban" | "stats" | "pricing" | "admin") => void;
  onOpenSettings?: () => void;
  dark?: boolean;
  onToggleDark?: () => void;
};

export function CalendarSidebar({
  isCollapsed,
  onToggleCollapse,
  onCreateClick,
  anchorDate,
  onSelectDate,
  categoryFilters,
  onToggleCategoryFilter,
  onNavigate,
  onOpenSettings,
  dark,
  onToggleDark,
}: CalendarSidebarProps) {
  // Local month anchor for the mini calendar so user can browse months freely
  const [miniMonthAnchor, setMiniMonthAnchor] = useState<Date>(() => new Date(anchorDate));

  // Sync mini calendar when anchorDate month changes
  const miniGrid = useMemo(() => getMonthGrid(miniMonthAnchor, true), [miniMonthAnchor]);

  const miniMonthTitle = useMemo(() => {
    return miniMonthAnchor.toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
    });
  }, [miniMonthAnchor]);

  const today = new Date();

  return (
    <aside
      className={`cal-workspace-sidebar ${isCollapsed ? "is-collapsed" : ""}`}
      aria-label="Sidebar Kalender"
    >
      {/* Sidebar Top / Brand */}
      <div className="cal-sidebar-top">
        {!isCollapsed ? (
          <div className="cal-sidebar-brand-row">
            <button
              type="button"
              className="cal-sidebar-brand-btn"
              onClick={() => onNavigate?.("timer")}
              title="Kembali ke Timer Fokus"
            >
              <span className="brand-mark" aria-hidden="true" />
              <span className="cal-sidebar-brand-name">biarfokus</span>
              <span className="cal-sidebar-badge">Kalender</span>
            </button>
            <button
              type="button"
              className="cal-sidebar-toggle-btn"
              onClick={onToggleCollapse}
              aria-label="Tutup sidebar"
              title="Tutup sidebar"
            >
              ‹
            </button>
          </div>
        ) : (
          <div className="cal-sidebar-collapsed-header">
            <button
              type="button"
              className="cal-sidebar-toggle-btn collapsed"
              onClick={onToggleCollapse}
              aria-label="Buka sidebar"
              title="Buka sidebar"
            >
              ›
            </button>
            <span className="brand-mark small" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Prominent + Create / + Buat Jadwal Button */}
      <div className="cal-sidebar-action-wrap">
        <button
          type="button"
          className="cal-sidebar-create-btn"
          onClick={onCreateClick}
          title="Buat Jadwal Time-Blocking Baru"
        >
          <span className="cal-create-plus-icon">+</span>
          {!isCollapsed && <span className="cal-create-label">Buat Jadwal</span>}
        </button>
      </div>

      {/* Mini Month Calendar Picker */}
      {!isCollapsed && (
        <div className="cal-mini-month-widget">
          <div className="cal-mini-month-header">
            <span className="cal-mini-month-title">{miniMonthTitle}</span>
            <div className="cal-mini-nav-btns">
              <button
                type="button"
                className="cal-mini-arrow-btn"
                onClick={() => setMiniMonthAnchor((prev) => addMonths(prev, -1))}
                aria-label="Bulan sebelumnya"
                title="Bulan sebelumnya"
              >
                ‹
              </button>
              <button
                type="button"
                className="cal-mini-arrow-btn"
                onClick={() => setMiniMonthAnchor((prev) => addMonths(prev, 1))}
                aria-label="Bulan berikutnya"
                title="Bulan berikutnya"
              >
                ›
              </button>
            </div>
          </div>

          <div className="cal-mini-weekdays-row">
            {["M", "S", "S", "R", "K", "J", "S"].map((dayName, idx) => (
              <span key={idx} className="cal-mini-weekday-cell">
                {dayName}
              </span>
            ))}
          </div>

          <div className="cal-mini-days-grid">
            {miniGrid.map((day, idx) => {
              const isSelected = isSameDay(day, anchorDate);
              const isToday = isSameDay(day, today);
              const isOutsideMonth = day.getMonth() !== miniMonthAnchor.getMonth();

              return (
                <button
                  key={idx}
                  type="button"
                  className={`cal-mini-day-cell ${isSelected ? "selected" : ""} ${
                    isToday ? "today" : ""
                  } ${isOutsideMonth ? "outside" : ""}`}
                  onClick={() => {
                    onSelectDate(day);
                    setMiniMonthAnchor(day);
                  }}
                  title={day.toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Kalender Saya / Category Filters */}
      {!isCollapsed && (
        <div className="cal-sidebar-section">
          <span className="cal-sidebar-section-title">Kalender Saya</span>
          <div className="cal-category-filters-list">
            <label className="cal-filter-checkbox-item">
              <input
                type="checkbox"
                checked={categoryFilters.event}
                onChange={() => onToggleCategoryFilter("event")}
                className="cal-checkbox-input"
              />
              <span className="cal-filter-dot" style={{ backgroundColor: "#039be5" }} />
              <span className="cal-filter-label">Acara / Blok Fokus</span>
            </label>

            <label className="cal-filter-checkbox-item">
              <input
                type="checkbox"
                checked={categoryFilters.task}
                onChange={() => onToggleCategoryFilter("task")}
                className="cal-checkbox-input"
              />
              <span className="cal-filter-dot" style={{ backgroundColor: "#33b679" }} />
              <span className="cal-filter-label">Tugas / To-do</span>
            </label>

            <label className="cal-filter-checkbox-item">
              <input
                type="checkbox"
                checked={categoryFilters.recurring}
                onChange={() => onToggleCategoryFilter("recurring")}
                className="cal-checkbox-input"
              />
              <span className="cal-filter-dot" style={{ backgroundColor: "#8e24aa" }} />
              <span className="cal-filter-label">Jadwal Berulang 🔁</span>
            </label>
          </div>
        </div>
      )}

      {/* Navigation to other modules */}
      <div className="cal-sidebar-section">
        {!isCollapsed && <span className="cal-sidebar-section-title">Aplikasi</span>}
        <nav className="cal-sidebar-nav">
          <button
            type="button"
            className="cal-sidebar-nav-item"
            onClick={() => onNavigate?.("timer")}
            title="Timer Pomodoro"
          >
            <span className="nav-icon">⏱️</span>
            {!isCollapsed && <span className="nav-label">Timer Fokus</span>}
          </button>
          <button
            type="button"
            className="cal-sidebar-nav-item"
            onClick={() => onNavigate?.("notes")}
            title="Catatan & Todo"
          >
            <span className="nav-icon">📝</span>
            {!isCollapsed && <span className="nav-label">Catatan</span>}
          </button>
          <button
            type="button"
            className="cal-sidebar-nav-item"
            onClick={() => onNavigate?.("kanban")}
            title="Project Kanban"
          >
            <span className="nav-icon">📋</span>
            {!isCollapsed && <span className="nav-label">Project Kanban</span>}
          </button>
          <button
            type="button"
            className="cal-sidebar-nav-item"
            onClick={() => onNavigate?.("stats")}
            title="Statistik Fokus"
          >
            <span className="nav-icon">📊</span>
            {!isCollapsed && <span className="nav-label">Statistik</span>}
          </button>
          <button
            type="button"
            className="cal-sidebar-nav-item"
            onClick={() => onNavigate?.("pricing")}
            title="BiarFokus Pro"
          >
            <span className="nav-icon">💎</span>
            {!isCollapsed && <span className="nav-label">BiarFokus Pro</span>}
          </button>
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="cal-sidebar-footer">
        {onToggleDark && (
          <button
            type="button"
            className="cal-sidebar-footer-btn"
            onClick={onToggleDark}
            title={dark ? "Mode Terang" : "Mode Gelap"}
          >
            <span className="footer-icon">{dark ? "☀" : "☾"}</span>
            {!isCollapsed && <span>{dark ? "Mode Terang" : "Mode Gelap"}</span>}
          </button>
        )}
        {onOpenSettings && (
          <button
            type="button"
            className="cal-sidebar-footer-btn"
            onClick={onOpenSettings}
            title="Pengaturan Kalender"
          >
            <span className="footer-icon">⚙</span>
            {!isCollapsed && <span>Pengaturan</span>}
          </button>
        )}
      </div>
    </aside>
  );
}
