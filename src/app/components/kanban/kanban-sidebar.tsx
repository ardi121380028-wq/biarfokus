"use client";

import { useState } from "react";
import Link from "next/link";
import type { KanbanBoard } from "@/types/domain";
import { useAppContext } from "@/app/providers/app-provider";
import { ProBadge } from "@/app/components/ui/pro-badge";
import { ConfirmModal } from "@/app/components/ui/confirm-modal";

type KanbanSidebarProps = {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  boards: KanbanBoard[];
  activeBoardId: string;
  onSelectBoard: (boardId: string) => void;
  onCreateBoardModalOpen: () => void;
  onDeleteBoard: (boardId: string) => void;
  onArchiveBoard?: (boardId: string) => void;
  onToggleStarBoard?: (boardId: string) => void;
  onReorderBoards?: (newBoards: KanbanBoard[]) => void;
  onMoveBoard?: (sourceIndex: number, destIndex: number) => void;
  onNavigate: (view: "timer" | "notes" | "calendar" | "kanban" | "habits" | "stats" | "pricing" | "admin") => void;
  onOpenSettings?: () => void;
  onOpenShare?: () => void;
  archivedCount?: number;
  archivedBoardsCount?: number;
  onOpenArchivedModal?: () => void;
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
  onArchiveBoard,
  onToggleStarBoard,
  onReorderBoards,
  onMoveBoard,
  onNavigate,
  onOpenSettings,
  onOpenShare,
  archivedCount,
  archivedBoardsCount,
  onOpenArchivedModal,
  dark,
  onToggleDark,
}: KanbanSidebarProps) {
  const { isPro, user, userRole, setLoginOpen } = useAppContext();
  const [searchBoard, setSearchBoard] = useState("");
  const [deletingBoard, setDeletingBoard] = useState<KanbanBoard | null>(null);
  const [draggingBoardId, setDraggingBoardId] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{ id: string; position: "top" | "bottom" } | null>(null);

  const filteredBoards = boards.filter((b) =>
    b.title.toLowerCase().includes(searchBoard.trim().toLowerCase()),
  );

  const starredBoards = filteredBoards.filter((b) => Boolean(b.starred));
  const regularBoards = filteredBoards.filter((b) => !b.starred);

  function handleDragStart(e: React.DragEvent<HTMLDivElement>, boardId: string) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", boardId);
    setDraggingBoardId(boardId);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>, targetId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggingBoardId === targetId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const isTop = e.clientY - rect.top < rect.height / 2;
    const pos = isTop ? "top" : "bottom";

    if (!dragOverTarget || dragOverTarget.id !== targetId || dragOverTarget.position !== pos) {
      setDragOverTarget({ id: targetId, position: pos });
    }
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    const related = e.relatedTarget as Node | null;
    if (!related || !e.currentTarget.contains(related)) {
      setDragOverTarget(null);
    }
  }

  function handleDragEnd() {
    setDraggingBoardId(null);
    setDragOverTarget(null);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>, targetId: string) {
    e.preventDefault();
    if (!draggingBoardId || draggingBoardId === targetId) {
      setDraggingBoardId(null);
      setDragOverTarget(null);
      return;
    }

    const currentBoards = [...boards];
    const sourceIdx = currentBoards.findIndex((b) => b.id === draggingBoardId);
    const targetIdx = currentBoards.findIndex((b) => b.id === targetId);

    if (sourceIdx === -1 || targetIdx === -1) {
      setDraggingBoardId(null);
      setDragOverTarget(null);
      return;
    }

    const sourceBoard = currentBoards[sourceIdx];
    const targetBoard = currentBoards[targetIdx];

    const targetStarred = Boolean(targetBoard.starred);
    const updatedSource =
      sourceBoard.starred !== targetStarred
        ? { ...sourceBoard, starred: targetStarred }
        : sourceBoard;

    currentBoards.splice(sourceIdx, 1);

    let insertIdx = currentBoards.findIndex((b) => b.id === targetId);
    if (dragOverTarget?.position === "bottom") {
      insertIdx += 1;
    }

    currentBoards.splice(insertIdx, 0, updatedSource);

    if (onReorderBoards) {
      onReorderBoards(currentBoards);
    }

    setDraggingBoardId(null);
    setDragOverTarget(null);
  }

  function handleSectionDrop(e: React.DragEvent<HTMLDivElement>, makeStarred: boolean) {
    e.preventDefault();
    if (!draggingBoardId) return;

    const currentBoards = [...boards];
    const sourceIdx = currentBoards.findIndex((b) => b.id === draggingBoardId);
    if (sourceIdx === -1) return;

    const sourceBoard = currentBoards[sourceIdx];
    const updatedSource = { ...sourceBoard, starred: makeStarred };
    currentBoards.splice(sourceIdx, 1);

    if (makeStarred) {
      currentBoards.unshift(updatedSource);
    } else {
      const firstUnstarredIdx = currentBoards.findIndex((b) => !b.starred);
      if (firstUnstarredIdx === -1) {
        currentBoards.push(updatedSource);
      } else {
        currentBoards.splice(firstUnstarredIdx, 0, updatedSource);
      }
    }

    if (onReorderBoards) {
      onReorderBoards(currentBoards);
    }

    setDraggingBoardId(null);
    setDragOverTarget(null);
  }

  function renderBoardItem(b: KanbanBoard) {
    const isActive = b.id === activeBoardId;
    const isDragging = draggingBoardId === b.id;
    const isDragOverTop = dragOverTarget?.id === b.id && dragOverTarget.position === "top";
    const isDragOverBottom = dragOverTarget?.id === b.id && dragOverTarget.position === "bottom";

    return (
      <div
        key={b.id}
        draggable={!searchBoard.trim()}
        onDragStart={(e) => handleDragStart(e, b.id)}
        onDragOver={(e) => handleDragOver(e, b.id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, b.id)}
        onDragEnd={handleDragEnd}
        className={`kanban-sidebar-board-item ${isActive ? "active" : ""} ${isDragging ? "is-dragging" : ""} ${
          isDragOverTop ? "is-drag-over-top" : ""
        } ${isDragOverBottom ? "is-drag-over-bottom" : ""}`}
        onClick={() => handleSelectBoard(b.id)}
        role="button"
        tabIndex={0}
        title={b.title + (b.starred ? " (⭐ Favorit/Dipin)" : "")}
      >
        {!isCollapsed && !searchBoard.trim() && (
          <span className="kanban-board-drag-handle" title="Tarik untuk geser posisi papan" aria-hidden="true">
            ⋮⋮
          </span>
        )}
        <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
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
          {isCollapsed && b.starred && (
            <span
              style={{
                position: "absolute",
                top: -5,
                right: -5,
                fontSize: 9,
                color: "#f59e0b",
                lineHeight: 1,
                pointerEvents: "none",
              }}
            >
              ★
            </span>
          )}
        </div>
        {!isCollapsed && (
          <>
            <span className="kanban-board-item-title">{b.title}</span>
            {b.isShared && (
              <span className="kanban-board-item-shared" title="Papan Tim">
                👥
              </span>
            )}
            <button
              type="button"
              className={`kanban-board-star-btn ${b.starred ? "is-starred" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                if (onToggleStarBoard) onToggleStarBoard(b.id);
              }}
              title={b.starred ? "Hapus dari Favorit (Lepas pin)" : "Tambah ke Favorit (Pin di atas)"}
              aria-label={b.starred ? "Hapus dari Favorit" : "Tambah ke Favorit"}
            >
              {b.starred ? "★" : "☆"}
            </button>
            <button
              type="button"
              className="kanban-board-archive-mini"
              onClick={(e) => {
                e.stopPropagation();
                if (onArchiveBoard) onArchiveBoard(b.id);
              }}
              title="Arsipkan papan proyek ini"
              aria-label="Arsipkan papan"
            >
              📦
            </button>
            {boards.length > 1 && (
              <button
                type="button"
                className="kanban-board-delete-mini"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeletingBoard(b);
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
  }

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
          {/* If any boards are starred/favorited, display distinct sections */}
          {!isCollapsed && starredBoards.length > 0 ? (
            <>
              <div
                className="kanban-sidebar-subgroup-title"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleSectionDrop(e, true)}
                title="Tarik papan ke sini untuk menandai sebagai favorit"
              >
                <span>⭐ Favorit ({starredBoards.length})</span>
              </div>
              {starredBoards.map((b) => renderBoardItem(b))}

              {regularBoards.length > 0 && (
                <div
                  className="kanban-sidebar-subgroup-title"
                  style={{ marginTop: 10 }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleSectionDrop(e, false)}
                >
                  <span>Papan Proyek ({regularBoards.length})</span>
                </div>
              )}
              {regularBoards.map((b) => renderBoardItem(b))}
            </>
          ) : (
            filteredBoards.map((b) => renderBoardItem(b))
          )}

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

      {/* Item Terarsip (Placed above Bagikan Papan, below Papan Proyek) */}
      {!isCollapsed && onOpenArchivedModal && (
        <div style={{ padding: "0 12px", marginTop: 6, marginBottom: 10 }}>
          <button
            type="button"
            className="kanban-sidebar-board-item kanban-sidebar-archive-btn"
            onClick={onOpenArchivedModal}
            title="Lihat item yang diarsipkan di papan ini"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "9px 12px",
              borderRadius: "10px",
              background: "color-mix(in srgb, var(--ink) 4%, transparent)",
              border: "1px solid color-mix(in srgb, var(--ink) 8%, transparent)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ fontSize: 15 }}>🗃️</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                Item Terarsip
              </span>
            </div>
            {((archivedCount || 0) + (archivedBoardsCount || 0)) > 0 ? (
              <span className="kanban-sidebar-count-badge" style={{ margin: 0 }}>
                {(archivedCount || 0) + (archivedBoardsCount || 0)}
              </span>
            ) : (
              <span style={{ fontSize: 11, color: "var(--muted)" }}>0</span>
            )}
          </button>
        </div>
      )}

      {isCollapsed && onOpenArchivedModal && (
        <div style={{ display: "flex", justifyContent: "center", margin: "6px 0" }}>
          <button
            type="button"
            className="kanban-sidebar-icon-only-btn"
            onClick={onOpenArchivedModal}
            title={`Item Terarsip (${(archivedCount || 0) + (archivedBoardsCount || 0)})`}
            style={{ position: "relative" }}
          >
            🗃️
            {((archivedCount || 0) + (archivedBoardsCount || 0)) > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#0284c7",
                }}
              />
            )}
          </button>
        </div>
      )}

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
        {userRole === "admin" && (
          <Link
            href="/admin"
            className="kanban-sidebar-footer-btn"
            title="Admin Dashboard"
          >
            <span className="footer-icon-wrap" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </span>
            {!isCollapsed && <span>Admin Dashboard</span>}
          </Link>
        )}
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

        <Link
          href="/pengaturan"
          className="kanban-sidebar-footer-btn"
          title="Pengaturan"
        >
          <span className="footer-icon-wrap" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </span>
          {!isCollapsed && <span>Pengaturan</span>}
        </Link>
      </div>

      {/* Confirmation Modal for Board Deletion */}
      <ConfirmModal
        isOpen={Boolean(deletingBoard)}
        title="Hapus Papan Proyek?"
        message="Apakah kamu yakin ingin menghapus papan ini beserta seluruh kolom dan tugas di dalamnya?"
        itemName={deletingBoard?.title}
        confirmLabel="Ya, Hapus Papan"
        cancelLabel="Batal"
        onConfirm={() => {
          if (deletingBoard) {
            onDeleteBoard(deletingBoard.id);
            setDeletingBoard(null);
          }
        }}
        onCancel={() => setDeletingBoard(null)}
      />
    </aside>
  );
}
