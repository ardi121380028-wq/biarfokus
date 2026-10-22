"use client";

import { useState } from "react";
import type { KanbanBoard } from "@/types/domain";

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
              <span className="brand-mark" aria-hidden="true" />
              <span className="kanban-sidebar-brand-name">biarfokus</span>
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
            onClick={() => handleNavigate("pricing")}
            title="Upgrade Pro"
          >
            <span className="nav-icon">💎</span>
            {!isCollapsed && <span className="nav-label">Upgrade Pro</span>}
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
            <span>{dark ? "☀" : "☾"}</span>
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
