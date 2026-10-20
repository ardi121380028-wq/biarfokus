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
              <span className="brand-mark" aria-hidden="true" />
              <span className="kanban-sidebar-brand-name">biarfokus</span>
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
            className="kanban-sidebar-nav-item"
            onClick={() => handleNavigate("stats")}
            title="Statistik Produktivitas"
          >
            <span className="nav-icon">📊</span>
            {!isCollapsed && <span className="nav-label">Statistik</span>}
          </button>
          <button
            type="button"
            className="kanban-sidebar-nav-item"
            onClick={() => handleNavigate("pricing")}
            title="Upgrade Pro"
          >
            <span className="nav-icon">💎</span>
            {!isCollapsed && <span className="nav-label">Upgrade Pro</span>}
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
            <span className="footer-icon">{dark ? "☀" : "☾"}</span>
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
