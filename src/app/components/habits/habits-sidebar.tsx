"use client";

import { useMemo } from "react";
import type { Habit, HabitFilter } from "@/features/habits/habit-types";
import { useAppContext } from "@/app/providers/app-provider";

export type HabitViewMode = "checklist" | "matrix" | "heatmap";

interface HabitsSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  habits: Habit[];
  activeFilter: HabitFilter;
  onSelectFilter: (filter: HabitFilter) => void;
  activeView: HabitViewMode;
  onSelectView: (view: HabitViewMode) => void;
  onOpenCreateModal: () => void;
  onNavigate?: (view: "timer" | "notes" | "calendar" | "kanban" | "habits" | "stats" | "pricing" | "admin") => void;
}

export function HabitsSidebar({
  isCollapsed,
  onToggleCollapse,
  habits,
  activeFilter,
  onSelectFilter,
  activeView,
  onSelectView,
  onOpenCreateModal,
  onNavigate,
}: HabitsSidebarProps) {
  const { isPro, user, setLoginOpen } = useAppContext();

  function handleNavigate(view: "timer" | "notes" | "calendar" | "kanban" | "habits" | "stats" | "pricing" | "admin") {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      if (!isCollapsed) onToggleCollapse();
    }
    if ((view === "notes" || view === "calendar") && !user) {
      setLoginOpen(true);
      return;
    }
    onNavigate?.(view);
  }

  // Count habits per routine
  const counts = useMemo(() => {
    const total = habits.length;
    let morning = 0;
    let afternoon = 0;
    let evening = 0;
    let anytime = 0;

    habits.forEach((h) => {
      if (h.routineTime === "morning") morning++;
      else if (h.routineTime === "afternoon") afternoon++;
      else if (h.routineTime === "evening") evening++;
      else if (h.routineTime === "anytime") anytime++;
    });

    return { total, morning, afternoon, evening, anytime };
  }, [habits]);

  // Today progress
  const todayProgress = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const total = habits.length;
    const completed = habits.filter((h) => h.completedDates.includes(today)).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  }, [habits]);

  return (
    <aside
      className={`kanban-workspace-sidebar ${isCollapsed ? "is-collapsed" : ""}`}
      aria-label="Sidebar Pelacak Kebiasaan"
    >
      {/* Sidebar Header */}
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
              <span className="kanban-sidebar-badge habits-badge-accent">Kebiasaan</span>
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

      {/* Main Apps Navigation */}
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
            className="kanban-sidebar-nav-item"
            onClick={() => handleNavigate("calendar")}
            title="Kalender Jadwal"
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
            className="kanban-sidebar-nav-item active"
            title="Pelacak Kebiasaan (Aktif)"
          >
            <span className="nav-icon">⚡</span>
            {!isCollapsed && <span className="nav-label">Kebiasaan</span>}
          </button>
          {!user && (
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
          )}
        </nav>
      </div>

      <div className="kanban-sidebar-divider" />

      {/* Action Button: + Kebiasaan Baru */}
      <div className="cal-sidebar-create-wrap">
        <button
          type="button"
          className="cal-sidebar-create-btn"
          onClick={onOpenCreateModal}
          title="Bangun Kebiasaan Baru"
        >
          <span className="create-btn-icon">+</span>
          {!isCollapsed && <span className="create-btn-label">Kebiasaan Baru</span>}
        </button>
      </div>

      {/* View Mode Switcher */}
      <div className="kanban-sidebar-section">
        {!isCollapsed && <span className="kanban-sidebar-section-title">Tampilan</span>}
        <div className="habits-sidebar-view-list">
          <button
            type="button"
            className={`notes-sidebar-filter-item ${activeView === "checklist" ? "active" : ""}`}
            onClick={() => onSelectView("checklist")}
            title="Ceklis Harian (Checklist cepat per rutinitas)"
          >
            <span className="filter-icon">✅</span>
            {!isCollapsed && <span className="filter-title">Ceklis Harian</span>}
          </button>
          <button
            type="button"
            className={`notes-sidebar-filter-item ${activeView === "matrix" ? "active" : ""}`}
            onClick={() => onSelectView("matrix")}
            title="Matriks Mingguan (Tabel ceklis 7 hari)"
          >
            <span className="filter-icon">📅</span>
            {!isCollapsed && <span className="filter-title">Matriks Mingguan</span>}
          </button>
          <button
            type="button"
            className={`notes-sidebar-filter-item ${activeView === "heatmap" ? "active" : ""}`}
            onClick={() => onSelectView("heatmap")}
            title="Peta Konsistensi (Heatmap 90 hari & statistik)"
          >
            <span className="filter-icon">📊</span>
            {!isCollapsed && <span className="filter-title">Peta Konsistensi</span>}
          </button>
        </div>
      </div>

      <div className="kanban-sidebar-divider" />

      {/* Routine Filters */}
      <div className="kanban-sidebar-section">
        {!isCollapsed && <span className="kanban-sidebar-section-title">Rutinitas Harian</span>}
        <div className="habits-sidebar-routine-list">
          <button
            type="button"
            className={`notes-sidebar-filter-item ${activeFilter === "all" ? "active" : ""}`}
            onClick={() => onSelectFilter("all")}
            title="Semua Rutinitas"
          >
            <span className="filter-icon">⚡</span>
            {!isCollapsed && (
              <>
                <span className="filter-title">Semua Rutinitas</span>
                <span className="filter-count">{counts.total}</span>
              </>
            )}
          </button>
          <button
            type="button"
            className={`notes-sidebar-filter-item ${activeFilter === "morning" ? "active" : ""}`}
            onClick={() => onSelectFilter("morning")}
            title="Rutinitas Pagi"
          >
            <span className="filter-icon">🌅</span>
            {!isCollapsed && (
              <>
                <span className="filter-title">Pagi</span>
                <span className="filter-count">{counts.morning}</span>
              </>
            )}
          </button>
          <button
            type="button"
            className={`notes-sidebar-filter-item ${activeFilter === "afternoon" ? "active" : ""}`}
            onClick={() => onSelectFilter("afternoon")}
            title="Rutinitas Siang"
          >
            <span className="filter-icon">☀️</span>
            {!isCollapsed && (
              <>
                <span className="filter-title">Siang</span>
                <span className="filter-count">{counts.afternoon}</span>
              </>
            )}
          </button>
          <button
            type="button"
            className={`notes-sidebar-filter-item ${activeFilter === "evening" ? "active" : ""}`}
            onClick={() => onSelectFilter("evening")}
            title="Rutinitas Malam"
          >
            <span className="filter-icon">🌙</span>
            {!isCollapsed && (
              <>
                <span className="filter-title">Malam</span>
                <span className="filter-count">{counts.evening}</span>
              </>
            )}
          </button>
          <button
            type="button"
            className={`notes-sidebar-filter-item ${activeFilter === "anytime" ? "active" : ""}`}
            onClick={() => onSelectFilter("anytime")}
            title="Kapan Saja"
          >
            <span className="filter-icon">🎯</span>
            {!isCollapsed && (
              <>
                <span className="filter-title">Kapan Saja</span>
                <span className="filter-count">{counts.anytime}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Daily Progress Widget (Bottom of Sidebar) */}
      {!isCollapsed && (
        <div className="habits-sidebar-progress-widget">
          <div className="habits-progress-widget-top">
            <span className="progress-widget-title">Disiplin Hari Ini</span>
            <span className="progress-widget-stat">
              {todayProgress.completed}/{todayProgress.total} ({todayProgress.percent}%)
            </span>
          </div>
          <div className="habits-progress-widget-track">
            <div
              className="habits-progress-widget-fill"
              style={{ width: `${todayProgress.percent}%` }}
            />
          </div>
          <p className="habits-progress-widget-tip">
            {todayProgress.percent === 100 && todayProgress.total > 0
              ? "🎉 Luar biasa! Semua kebiasaan hari ini tuntas."
              : "Konsisten 1% lebih baik setiap hari."}
          </p>
        </div>
      )}
    </aside>
  );
}
