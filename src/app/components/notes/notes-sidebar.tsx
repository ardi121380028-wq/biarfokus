"use client";

import { useState } from "react";

type NotesSidebarProps = {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onCreateClick?: () => void;
  totalCount: number;
  pinnedCount: number;
  checklistCount: number;
  textCount: number;
  typeFilter: "all" | "pinned" | "checklist" | "text";
  onSelectTypeFilter: (type: "all" | "pinned" | "checklist" | "text") => void;
  labels: string[];
  activeLabel: string | null;
  onSelectLabel: (label: string | null) => void;
  getLabelCount: (label: string) => number;
  onCreateLabel: (name: string) => void;
  onNavigate?: (view: "timer" | "notes" | "calendar" | "kanban" | "stats" | "pricing" | "admin") => void;
  onOpenSettings?: () => void;
  dark?: boolean;
  onToggleDark?: () => void;
};

export function NotesSidebar({
  isCollapsed,
  onToggleCollapse,
  onCreateClick,
  totalCount,
  pinnedCount,
  checklistCount,
  textCount,
  typeFilter,
  onSelectTypeFilter,
  labels,
  activeLabel,
  onSelectLabel,
  getLabelCount,
  onCreateLabel,
  onNavigate,
  onOpenSettings,
  dark,
  onToggleDark,
}: NotesSidebarProps) {
  const [newLabelInput, setNewLabelInput] = useState("");
  const [showAddLabel, setShowAddLabel] = useState(false);

  function handleAddLabelSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clean = newLabelInput.trim();
    if (clean) {
      onCreateLabel(clean);
      setNewLabelInput("");
      setShowAddLabel(false);
    }
  }

  return (
    <aside
      className={`kanban-workspace-sidebar ${isCollapsed ? "is-collapsed" : ""}`}
      aria-label="Sidebar Catatan & Todo"
    >
      {/* Sidebar Top / Brand - Identical to Kanban & Calendar */}
      <div className="kanban-sidebar-top">
        {!isCollapsed ? (
          <div className="kanban-sidebar-brand-row">
            <button
              type="button"
              className="kanban-sidebar-brand-btn"
              onClick={() => onNavigate?.("timer")}
              title="Kembali ke Timer Fokus"
            >
              <span className="brand-mark" aria-hidden="true" />
              <span className="kanban-sidebar-brand-name">biarfokus</span>
              <span className="kanban-sidebar-badge">Catatan</span>
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

      {/* Primary Action Button: + Catatan Baru */}
      <div className="cal-sidebar-create-wrap">
        <button
          type="button"
          className="cal-sidebar-create-btn"
          onClick={onCreateClick}
          title="Tulis Catatan / To-do Baru"
        >
          <span className="cal-create-icon">➕</span>
          {!isCollapsed && <span>Catatan Baru</span>}
        </button>
      </div>

      {/* Main Navigation to other BiarFokus modules (Active on Catatan & Todo) */}
      <div className="kanban-sidebar-section">
        {!isCollapsed && <span className="kanban-sidebar-section-title">Aplikasi</span>}
        <nav className="kanban-sidebar-nav">
          <button
            type="button"
            className="kanban-sidebar-nav-item"
            onClick={() => onNavigate?.("timer")}
            title="Timer Pomodoro"
          >
            <span className="nav-icon">⏱️</span>
            {!isCollapsed && <span className="nav-label">Timer Fokus</span>}
          </button>
          <button
            type="button"
            className="kanban-sidebar-nav-item active"
            title="Catatan & Todo (Aktif)"
          >
            <span className="nav-icon">📝</span>
            {!isCollapsed && <span className="nav-label">Catatan &amp; Todo</span>}
          </button>
          <button
            type="button"
            className="kanban-sidebar-nav-item"
            onClick={() => onNavigate?.("calendar")}
            title="Kalender Jadwal"
          >
            <span className="nav-icon">📅</span>
            {!isCollapsed && <span className="nav-label">Kalender</span>}
          </button>
          <button
            type="button"
            className="kanban-sidebar-nav-item"
            onClick={() => onNavigate?.("kanban")}
            title="Project Kanban"
          >
            <span className="nav-icon">📋</span>
            {!isCollapsed && <span className="nav-label">Project Kanban</span>}
          </button>
          <button
            type="button"
            className="kanban-sidebar-nav-item"
            onClick={() => onNavigate?.("stats")}
            title="Statistik Produktivitas"
          >
            <span className="nav-icon">📊</span>
            {!isCollapsed && <span className="nav-label">Statistik</span>}
          </button>
          <button
            type="button"
            className="kanban-sidebar-nav-item"
            onClick={() => onNavigate?.("pricing")}
            title="Upgrade Pro"
          >
            <span className="nav-icon">💎</span>
            {!isCollapsed && <span className="nav-label">Upgrade Pro</span>}
          </button>
        </nav>
      </div>

      {/* View & Type Filters Section */}
      <div className="kanban-sidebar-section">
        {!isCollapsed && <span className="kanban-sidebar-section-title">Tampilan</span>}
        <div className="notes-sidebar-filter-list">
          <button
            type="button"
            className={`notes-sidebar-filter-item ${typeFilter === "all" && activeLabel === null ? "active" : ""}`}
            onClick={() => {
              onSelectTypeFilter("all");
              onSelectLabel(null);
            }}
            title="Semua Catatan"
          >
            <span className="filter-icon">📑</span>
            {!isCollapsed && (
              <>
                <span className="filter-title">Semua Catatan</span>
                <span className="filter-count">{totalCount}</span>
              </>
            )}
          </button>

          <button
            type="button"
            className={`notes-sidebar-filter-item ${typeFilter === "pinned" ? "active" : ""}`}
            onClick={() => onSelectTypeFilter("pinned")}
            title="Catatan Disematkan"
          >
            <span className="filter-icon">📌</span>
            {!isCollapsed && (
              <>
                <span className="filter-title">Disematkan</span>
                <span className="filter-count">{pinnedCount}</span>
              </>
            )}
          </button>

          <button
            type="button"
            className={`notes-sidebar-filter-item ${typeFilter === "checklist" ? "active" : ""}`}
            onClick={() => onSelectTypeFilter("checklist")}
            title="Daftar Tugas (Checklist)"
          >
            <span className="filter-icon">☑️</span>
            {!isCollapsed && (
              <>
                <span className="filter-title">To-Do List</span>
                <span className="filter-count">{checklistCount}</span>
              </>
            )}
          </button>

          <button
            type="button"
            className={`notes-sidebar-filter-item ${typeFilter === "text" ? "active" : ""}`}
            onClick={() => onSelectTypeFilter("text")}
            title="Catatan Teks"
          >
            <span className="filter-icon">📄</span>
            {!isCollapsed && (
              <>
                <span className="filter-title">Catatan Teks</span>
                <span className="filter-count">{textCount}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Label Catalogue Section */}
      <div className="kanban-sidebar-section notes-sidebar-labels-section">
        <div className="kanban-section-header-row">
          {!isCollapsed && <span className="kanban-sidebar-section-title">Label</span>}
          {!isCollapsed && !showAddLabel && (
            <button
              type="button"
              className="notes-sidebar-add-label-btn"
              onClick={() => setShowAddLabel(true)}
              title="Tambah Label Baru"
            >
              +
            </button>
          )}
        </div>

        {!isCollapsed && showAddLabel && (
          <form onSubmit={handleAddLabelSubmit} className="notes-sidebar-new-label-form">
            <input
              type="text"
              placeholder="Nama label..."
              value={newLabelInput}
              onChange={(e) => setNewLabelInput(e.target.value)}
              className="notes-sidebar-label-input"
              autoFocus
            />
            <div className="notes-sidebar-label-actions">
              <button type="submit" className="kanban-primary-btn" style={{ padding: "3px 8px", fontSize: 11 }}>
                Simpan
              </button>
              <button
                type="button"
                className="kanban-secondary-btn"
                onClick={() => setShowAddLabel(false)}
                style={{ padding: "3px 8px", fontSize: 11 }}
              >
                Batal
              </button>
            </div>
          </form>
        )}

        <div className="notes-sidebar-filter-list">
          {labels.map((lbl) => {
            const count = getLabelCount(lbl);
            const isSelected = activeLabel === lbl;
            return (
              <button
                key={lbl}
                type="button"
                className={`notes-sidebar-filter-item ${isSelected ? "active" : ""}`}
                onClick={() => onSelectLabel(isSelected ? null : lbl)}
                title={`Filter label ${lbl}`}
              >
                <span className="filter-icon">🏷️</span>
                {!isCollapsed && (
                  <>
                    <span className="filter-title">{lbl}</span>
                    <span className="filter-count">{count}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sidebar Footer - Identical to Kanban & Calendar */}
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
            title="Pengaturan"
          >
            <span className="footer-icon">⚙</span>
            {!isCollapsed && <span>Pengaturan</span>}
          </button>
        )}
      </div>
    </aside>
  );
}
