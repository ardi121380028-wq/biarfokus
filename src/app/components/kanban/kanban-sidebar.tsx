"use client";

import { useState } from "react";
import type { KanbanBoard } from "@/types/domain";
import { useAppContext } from "@/app/providers/app-provider";

type KanbanSidebarProps = {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  boards: KanbanBoard[];
  activeBoardId: string;
  onSelectBoard: (boardId: string) => void;
  onCreateBoardModalOpen: () => void;
  onDeleteBoard: (boardId: string) => void;
  onNavigate: (view: "timer" | "notes" | "calendar" | "kanban" | "stats" | "pricing" | "admin") => void;
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
  const { isPro } = useAppContext();
  const [searchBoard, setSearchBoard] = useState("");

  const filteredBoards = boards.filter((b) =>
    b.title.toLowerCase().includes(searchBoard.trim().toLowerCase()),
  );

  function handleNavigate(view: "timer" | "notes" | "calendar" | "kanban" | "stats" | "pricing" | "admin") {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      if (!isCollapsed) onToggleCollapse();
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
            className={`kanban-sidebar-nav-item ${isPro ? "sidebar-pro-active-btn" : "sidebar-upgrade-pro-btn"}`}
            onClick={() => handleNavigate("pricing")}
            title={isPro ? "Akun BiarFokus Pro Aktif (Akses Tanpa Batas)" : "Upgrade Pro (Akses Penuh)"}
          >
            <span className="nav-icon">{isPro ? "👑" : "💎"}</span>
            {!isCollapsed && (
              <>
                <span className="nav-label">{isPro ? "BiarFokus Pro" : "Upgrade Pro"}</span>
                <span className={`pro-sparkle-pill ${isPro ? "active-pro" : ""}`}>
                  {isPro ? "AKTIF ⭐" : "PRO ✨"}
                </span>
              </>
            )}
          </button>
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
      <div className="kanban-sidebar-footer">
        {onToggleDark && (
          <button
            type="button"
            className="kanban-sidebar-footer-btn"
            onClick={onToggleDark}
            title={dark ? "Beralih ke mode terang" : "Beralih ke mode gelap"}
          >
            <span className="footer-icon-wrap" aria-hidden="true">
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
            title="Pengaturan BiarFokus"
          >
            <span>⚙</span>
            {!isCollapsed && <span>Pengaturan</span>}
          </button>
        )}
      </div>
    </aside>
  );
}
