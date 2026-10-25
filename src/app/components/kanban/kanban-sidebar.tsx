"use client";

import { useState } from "react";
import Link from "next/link";
import type { KanbanBoard } from "@/types/domain";
import { useAppContext } from "@/app/providers/app-provider";
import { ProBadge } from "@/app/components/ui/pro-badge";

type KanbanSidebarProps = {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  boards: KanbanBoard[];
  activeBoardId: string;
  onSelectBoard: (boardId: string) => void;
  onCreateBoardModalOpen: () => void;
  onDeleteBoard: (boardId: string) => void;
  onNavigate: (view: "timer" | "notes" | "calendar" | "kanban" | "habits" | "stats" | "pricing" | "admin") => void;
  onOpenSettings?: () => void;
  onOpenShare?: () => void;
  dark?: boolean;
  onToggleDark?: () => void;
};

export function KanbanSidebar({
  isCollapsed,
  onToggleCollapse,
  boards,
  activeBoardId,
  onSelectBoard,
  onCreateBoardModalOpen,
  onDeleteBoard,
  onNavigate,
  onOpenSettings,
  onOpenShare,
  dark,
  onToggleDark,
}: KanbanSidebarProps) {
  const { isPro, user, setLoginOpen } = useAppContext();
  const [searchBoard, setSearchBoard] = useState("");

  const filteredBoards = boards.filter((b) =>
    b.title.toLowerCase().includes(searchBoard.trim().toLowerCase()),
  );

  function handleNavigate(view: "timer" | "notes" | "calendar" | "kanban" | "habits" | "stats" | "pricing" | "admin") {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      if (!isCollapsed) onToggleCollapse();
    }
    if ((view === "notes" || view === "calendar" || view === "habits") && !user) {
      setLoginOpen(true);
      return;
    }
    onNavigate(view);
  }

  function handleSelectBoard(boardId: string) {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      if (!isCollapsed) onToggleCollapse();
    }
    onSelectBoard(boardId);
  }

  return (
    <aside
      className={`kanban-workspace-sidebar ${isCollapsed ? "is-collapsed" : ""}`}
      aria-label="Sidebar Papan Proyek"
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
              <span className="kanban-sidebar-badge">Kanban</span>
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

      {/* Main Navigation to other BiarFokus modules */}
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
            className="kanban-sidebar-nav-item active"
            title="Project Kanban (Aktif)"
          >
            <span className="nav-icon">📋</span>
            {!isCollapsed && <span className="nav-label">Project Kanban</span>}
          </button>
          <button
            type="button"
            className="kanban-sidebar-nav-item"
            onClick={() => handleNavigate("habits")}
            title="Pelacak Kebiasaan"
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

      {/* Boards List Section */}
      <div className="kanban-sidebar-section boards-section">
        {!isCollapsed ? (
          <div className="kanban-sidebar-section-header">
            <span className="kanban-sidebar-section-title">
              Papan Proyek ({boards.length})
            </span>
            <button
              type="button"
              className="kanban-sidebar-add-board-btn"
              onClick={onCreateBoardModalOpen}
              title="Buat Papan Proyek Baru"
            >
              + Baru
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="kanban-sidebar-icon-only-btn"
            onClick={onCreateBoardModalOpen}
            title="Buat Papan Proyek Baru"
          >
            +
          </button>
        )}

        {!isCollapsed && boards.length > 3 && (
          <div className="kanban-sidebar-search-box">
            <input
              type="text"
              placeholder="Cari papan..."
              value={searchBoard}
              onChange={(e) => setSearchBoard(e.target.value)}
              className="kanban-sidebar-search-input"
            />
          </div>
        )}

        <div className="kanban-sidebar-boards-list">
          {filteredBoards.map((b) => {
            const isActive = b.id === activeBoardId;
            return (
              <div
                key={b.id}
                className={`kanban-sidebar-board-item ${isActive ? "active" : ""}`}
                onClick={() => handleSelectBoard(b.id)}
                role="button"
                tabIndex={0}
                title={b.title}
              >
                <span
                  className="kanban-board-swatch"
                  style={{
                    background:
                      b.background?.startsWith("#")
                        ? b.background
                        : b.background === "biarfokus-white"
                        ? "#e2e8f0"
                        : "#3b82f6",
                  }}
                />
                {!isCollapsed && (
                  <>
                    <span className="kanban-board-item-title">{b.title}</span>
                    {b.isShared && (
                      <span className="kanban-board-item-shared" title="Papan Tim">
                        👥
                      </span>
                    )}
                    {boards.length > 1 && (
                      <button
                        type="button"
                        className="kanban-board-delete-mini"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Hapus papan "${b.title}"?`)) {
                            onDeleteBoard(b.id);
                          }
                        }}
                        title="Hapus papan"
                      >
                        ✕
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}

          {filteredBoards.length === 0 && !isCollapsed && (
            <div className="kanban-empty-sidebar-boards">
              <p>Belum ada papan proyek.</p>
              <button
                type="button"
                className="kanban-sidebar-create-empty-btn"
                onClick={onCreateBoardModalOpen}
              >
                + Buat Papan Baru
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Share / Team Shortcut Card */}
      {!isCollapsed && onOpenShare && (
        <div className="kanban-sidebar-invite-card">
          <div className="invite-card-head">
            <span className="invite-icon">🤝</span>
            <div>
              <strong>Kolaborasi Tim</strong>
              <p>Undang teman untuk berbagi kartu proyek.</p>
            </div>
          </div>
          <button
            type="button"
            className="kanban-sidebar-share-action-btn"
            onClick={onOpenShare}
          >
            👥 Bagikan Papan
          </button>
        </div>
      )}

      {/* Sidebar Footer Controls */}
      {/* Sidebar Footer Controls */}
      <div className="kanban-sidebar-footer">
        <Link
          href="/fitur"
          className="kanban-sidebar-footer-btn"
          title="Fitur & Panduan"
        >
          <span className="footer-icon-wrap" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </span>
          {!isCollapsed && <span>Fitur &amp; Panduan</span>}
        </Link>

        {onOpenSettings && (
          <button
            type="button"
            className="kanban-sidebar-footer-btn"
            onClick={onOpenSettings}
            title="Pengaturan BiarFokus"
          >
            <span className="footer-icon-wrap" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </span>
            {!isCollapsed && <span>Pengaturan</span>}
          </button>
        )}
      </div>
    </aside>
  );
}
