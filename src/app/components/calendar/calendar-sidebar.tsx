"use client";

import { useEffect, useMemo, useState } from "react";
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
  // Mini calendar month navigation
  const [miniMonthAnchor, setMiniMonthAnchor] = useState<Date>(() => new Date(anchorDate));

  useEffect(() => {
    setMiniMonthAnchor(new Date(anchorDate));
  }, [anchorDate]);

  const miniGrid = useMemo(() => getMonthGrid(miniMonthAnchor, true), [miniMonthAnchor]);

  const miniMonthTitle = useMemo(() => {
    return miniMonthAnchor.toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
    });
  }, [miniMonthAnchor]);

  const today = new Date();

  function handleNavigate(view: "timer" | "notes" | "calendar" | "kanban" | "stats" | "pricing" | "admin") {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      if (!isCollapsed) onToggleCollapse();
    }
    onNavigate?.(view);
  }

  function handleSelectDate(d: Date) {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      if (!isCollapsed) onToggleCollapse();
    }
    onSelectDate(d);
  }

  return (
    <aside
      className={`kanban-workspace-sidebar ${isCollapsed ? "is-collapsed" : ""}`}
      aria-label="Sidebar Kalender"
    >
      {/* Sidebar Top / Brand - Identical to Kanban */}
      <div className="kanban-sidebar-top">
        {!isCollapsed ? (
          <div className="kanban-sidebar-brand-row">
            <button
              type="button"
              className="kanban-sidebar-brand-btn"
              onClick={() => handleNavigate("timer")}
              title="Kembali ke Timer Fokus"
            >
              <img
                src="/biarfokus-logo-light.png"
                alt="biarfokus"
                className="sidebar-brand-logo-img light-only"
              />
              <img
                src="/biarfokus-logo-dark.png"
                alt="biarfokus"
                className="sidebar-brand-logo-img dark-only"
              />
              <span className="kanban-sidebar-badge">Kalender</span>
            </button>
            <button
              type="button"
              className="kanban-sidebar-toggle-btn"
              onClick={onToggleCollapse}
              aria-label="Tutup sidebar"
              title="Tutup sidebar"
            >
              ‹
            </button>
          </div>
        ) : (
          <div className="kanban-sidebar-collapsed-header">
            <button
              type="button"
              className="kanban-sidebar-toggle-btn collapsed"
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

      {/* Main Navigation to other BiarFokus modules (Active on Kalender) */}
      <div className="kanban-sidebar-section">
        {!isCollapsed && <span className="kanban-sidebar-section-title">Aplikasi</span>}
        <nav className="kanban-sidebar-nav">
          <button
            type="button"
            className="kanban-sidebar-nav-item"
            onClick={() => handleNavigate("timer")}
            title="Timer Pomodoro"
          >
            <span className="nav-icon">⏱️</span>
            {!isCollapsed && <span className="nav-label">Timer Fokus</span>}
          </button>
          <button
            type="button"
            className="kanban-sidebar-nav-item"
            onClick={() => handleNavigate("notes")}
            title="Catatan & Todo"
          >
            <span className="nav-icon">📝</span>
            {!isCollapsed && <span className="nav-label">Catatan &amp; Todo</span>}
          </button>
          <button
            type="button"
            className="kanban-sidebar-nav-item active"
            title="Kalender Jadwal (Aktif)"
          >
            <span className="nav-icon">📅</span>
            {!isCollapsed && <span className="nav-label">Kalender</span>}
          </button>
          <button
            type="button"
            className="kanban-sidebar-nav-item"
            onClick={() => handleNavigate("kanban")}
            title="Project Kanban"
          >
            <span className="nav-icon">📋</span>
            {!isCollapsed && <span className="nav-label">Project Kanban</span>}
          </button>
          <button
            type="button"
            className="kanban-sidebar-nav-item sidebar-upgrade-pro-btn"
            onClick={() => handleNavigate("pricing")}
            title="Upgrade Pro (Akses Penuh)"
          >
            <span className="nav-icon">💎</span>
            {!isCollapsed && (
              <>
                <span className="nav-label">Upgrade Pro</span>
                <span className="pro-sparkle-pill">PRO ✨</span>
              </>
            )}
          </button>
        </nav>
      </div>

      <div className="kanban-sidebar-divider" />

      {/* Primary Action Button: + Buat Jadwal */}
      <div className="cal-sidebar-create-wrap">
        <button
          type="button"
          className="cal-sidebar-create-btn"
          onClick={() => {
            if (typeof window !== "undefined" && window.innerWidth < 1024) {
              onToggleCollapse();
            }
            onCreateClick();
          }}
          title="Buat Jadwal Baru"
        >
          <span className="cal-create-icon">➕</span>
          {!isCollapsed && <span>Buat Jadwal</span>}
        </button>
      </div>

      {/* Mini Month Calendar */}
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
            {["M", "S", "S", "R", "K", "J", "S"].map((lbl, idx) => (
              <span key={idx} className="cal-mini-weekday-cell">
                {lbl}
              </span>
            ))}
          </div>

          <div className="cal-mini-days-grid">
            {miniGrid.map((day, idx) => {
              const isCurrentMonth = day.getMonth() === miniMonthAnchor.getMonth();
              const isSelected = isSameDay(day, anchorDate);
              const isTodayDate = isSameDay(day, today);

              return (
                <button
                  key={idx}
                  type="button"
                  className={`cal-mini-day-cell ${isSelected ? "selected" : ""} ${
                    isTodayDate ? "today" : ""
                  } ${!isCurrentMonth ? "outside" : ""}`}
                  onClick={() => {
                    handleSelectDate(day);
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

      {/* Schedule Categories Filter */}
      <div className="kanban-sidebar-section cal-categories-section">
        {!isCollapsed && <span className="kanban-sidebar-section-title">Kategori Jadwal</span>}
        {!isCollapsed && (
          <div className="cal-categories-list">
            <label className={`cal-filter-checkbox-item ${categoryFilters.event ? "is-active" : ""}`}>
              <div className="cal-filter-check-wrap">
                <input
                  type="checkbox"
                  checked={categoryFilters.event}
                  onChange={() => onToggleCategoryFilter("event")}
                  className="cal-checkbox-input"
                />
                <span className="cal-filter-custom-check" aria-hidden="true">✓</span>
              </div>
              <span className="cal-filter-dot" style={{ backgroundColor: "#039be5" }} />
              <span className="cal-filter-label">Acara / Blok Fokus</span>
            </label>

            <label className={`cal-filter-checkbox-item ${categoryFilters.task ? "is-active" : ""}`}>
              <div className="cal-filter-check-wrap">
                <input
                  type="checkbox"
                  checked={categoryFilters.task}
                  onChange={() => onToggleCategoryFilter("task")}
                  className="cal-checkbox-input"
                />
                <span className="cal-filter-custom-check" aria-hidden="true">✓</span>
              </div>
              <span className="cal-filter-dot" style={{ backgroundColor: "#33b679" }} />
              <span className="cal-filter-label">Tugas / To-do</span>
            </label>

            <label className={`cal-filter-checkbox-item ${categoryFilters.recurring ? "is-active" : ""}`}>
              <div className="cal-filter-check-wrap">
                <input
                  type="checkbox"
                  checked={categoryFilters.recurring}
                  onChange={() => onToggleCategoryFilter("recurring")}
                  className="cal-checkbox-input"
                />
                <span className="cal-filter-custom-check" aria-hidden="true">✓</span>
              </div>
              <span className="cal-filter-dot" style={{ backgroundColor: "#8e24aa" }} />
              <span className="cal-filter-label">
                <span>Jadwal Berulang</span>
                <span className="cal-filter-recurring-tag">Rutin</span>
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Sidebar Footer - Identical to Kanban */}
      <div className="kanban-sidebar-footer">
        {onToggleDark && (
          <button
            type="button"
            className="kanban-sidebar-footer-btn"
            onClick={onToggleDark}
            title={dark ? "Mode Terang" : "Mode Gelap"}
          >
            <span className="footer-icon" aria-hidden="true">
              {dark ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </span>
            {!isCollapsed && <span>{dark ? "Mode Terang" : "Mode Gelap"}</span>}
          </button>
        )}
        {onOpenSettings && (
          <button
            type="button"
            className="kanban-sidebar-footer-btn"
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
