"use client";

import { useState } from "react";
import { useAppContext } from "@/app/providers/app-provider";
import { ProBadge } from "@/app/components/ui/pro-badge";

type NotesSidebarProps = {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  totalCount: number;
  pinnedCount: number;
  checklistCount: number;
  textCount: number;
  archivedCount?: number;
  typeFilter: "all" | "pinned" | "checklist" | "text" | "archive";
  onSelectTypeFilter: (type: "all" | "pinned" | "checklist" | "text" | "archive") => void;
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
  totalCount,
  pinnedCount,
  checklistCount,
  textCount,
  archivedCount = 0,
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
  const { isPro } = useAppContext();
  const [newLabelInput, setNewLabelInput] = useState("");
  const [showAddLabel, setShowAddLabel] = useState(false);

  function handleNavigate(view: "timer" | "notes" | "calendar" | "kanban" | "stats" | "pricing" | "admin") {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      if (!isCollapsed) onToggleCollapse();
    }
    onNavigate?.(view);
  }

  function handleSelectType(type: "all" | "pinned" | "checklist" | "text" | "archive") {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      if (!isCollapsed) onToggleCollapse();
    }
    onSelectTypeFilter(type);
  }

  function handleSelectTag(label: string | null) {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      if (!isCollapsed) onToggleCollapse();
    }
    onSelectLabel(label);
  }

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

      {/* Main Navigation to other BiarFokus modules (Active on Catatan & Todo) */}
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
            className="kanban-sidebar-nav-item active"
            title="Catatan & Todo (Aktif)"
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
            className={`kanban-sidebar-nav-item ${isPro ? "sidebar-pro-active-btn" : "sidebar-upgrade-pro-btn"}`}
            onClick={() => handleNavigate("pricing")}
            title={isPro ? "Akun BiarFokus Pro Aktif (Akses Tanpa Batas)" : "Upgrade Pro (Akses Penuh)"}
          >
            <span className="nav-icon">{isPro ? "👑" : "💎"}</span>
            {!isCollapsed && (
              <>
                <span className="nav-label">{isPro ? "BiarFokus Pro" : "Upgrade Pro"}</span>
                {isPro ? (
                  <ProBadge size="sm" />
                ) : (
                  <span className="pro-sparkle-pill">PRO ✨</span>
                )}
              </>
            )}
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
              handleSelectType("all");
              handleSelectTag(null);
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
            onClick={() => handleSelectType("pinned")}
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
            onClick={() => handleSelectType("checklist")}
            title="Daftar Tugas (Checklist)"
          >
            <span className="filter-icon">☑️</span>
            {!isCollapsed && (
              <>
                <span className="filter-title">Daftar Checklist</span>
                <span className="filter-count">{checklistCount}</span>
              </>
            )}
          </button>

          <button
            type="button"
            className={`notes-sidebar-filter-item ${typeFilter === "text" ? "active" : ""}`}
            onClick={() => handleSelectType("text")}
            title="Catatan Teks"
          >
            <span className="filter-icon">📄</span>
            {!isCollapsed && (
              <>
                <span className="filter-title">Catatan Utama</span>
                <span className="filter-count">{textCount}</span>
              </>
            )}
          </button>

          <button
            type="button"
            className={`notes-sidebar-filter-item ${typeFilter === "archive" ? "active" : ""}`}
            onClick={() => handleSelectType("archive")}
            title="Arsip Catatan"
          >
            <span className="filter-icon">📦</span>
            {!isCollapsed && (
              <>
                <span className="filter-title">Arsip</span>
                <span className="filter-count">{archivedCount ?? 0}</span>
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
                onClick={() => handleSelectTag(isSelected ? null : lbl)}
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
