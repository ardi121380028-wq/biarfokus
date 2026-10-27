"use client";

import { useEffect, useRef, useState } from "react";
import type { KanbanBoard } from "@/types/domain";
import { BOARD_BACKGROUNDS, TEMPLATES } from "@/features/kanban/kanban-service";
import { useEscapeKey, useOutsideClick } from "@/lib/hooks/use-dismiss";
import { ConfirmModal } from "@/app/components/ui/confirm-modal";

type KanbanBoardModalProps = {
  boards: KanbanBoard[];
  activeBoardId: string;
  onSelectBoard: (boardId: string) => void;
  onCreateBoard: (title: string, background?: string, templateKey?: string) => void;
  onDeleteBoard: (boardId: string) => void;
  onClose: () => void;
  isGuest?: boolean;
  onRequireLogin?: () => void;
  onRefreshBoards?: () => void;
};

export function KanbanBoardModal({
  boards,
  activeBoardId,
  onSelectBoard,
  onCreateBoard,
  onDeleteBoard,
  onClose,
  isGuest = false,
  onRequireLogin,
  onRefreshBoards,
}: KanbanBoardModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  useOutsideClick(modalRef, onClose);
  useEscapeKey(onClose);

  const [activeTab, setActiveTab] = useState<"boards" | "templates" | "create">(() => {
    return boards.length === 0 ? "create" : "boards";
  });
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [boardToDelete, setBoardToDelete] = useState<KanbanBoard | null>(null);
  useEffect(() => {
    onRefreshBoards?.();
  }, [onRefreshBoards]);
  const [selectedBg, setSelectedBg] = useState("wave-blue");

  function handleCreateCustomBoard() {
    const title = newBoardTitle.trim() || "Board Baru";
    onCreateBoard(title, selectedBg);
    setNewBoardTitle("");
    onClose();
  }

  function handleUseTemplate(templateKey: string, defaultName: string) {
    onCreateBoard(defaultName, selectedBg, templateKey);
    onClose();
  }

  return (
    <div className="kanban-modal-backdrop" role="presentation">
      <div
        ref={modalRef}
        className="kanban-board-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kanban-boards-title"
      >
        {/* Header */}
        <div className="kanban-board-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>🗂️</span>
            <div>
              <h2 id="kanban-boards-title">Workspace &amp; Boards</h2>
              <p>Kelola papan proyek Kanban dan gunakan template best practice.</p>
            </div>
          </div>
          <button
            type="button"
            className="kanban-board-modal-close-btn"
            onClick={onClose}
            aria-label="Tutup Workspace & Boards"
            title="Tutup (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="kanban-board-modal-tabs">
          <button
            type="button"
            className={`kanban-tab-btn ${activeTab === "boards" ? "active" : ""}`}
            onClick={() => setActiveTab("boards")}
          >
            Semua Boards ({boards.length})
          </button>
          <button
            type="button"
            className={`kanban-tab-btn ${activeTab === "templates" ? "active" : ""}`}
            onClick={() => setActiveTab("templates")}
          >
            ✨ Template Populer
          </button>
          <button
            type="button"
            className={`kanban-tab-btn ${activeTab === "create" ? "active" : ""}`}
            onClick={() => setActiveTab("create")}
          >
            + Buat Board Baru
          </button>
        </div>

        {/* Tab 1: Existing Boards (Screenshot 4) */}
        {activeTab === "boards" && (
          <>
            {isGuest && (
              <div className="kanban-guest-sync-notice">
                <div>
                  <strong>📱 Mode Tamu Lokal</strong>
                  <div>Papan ini hanya tersimpan di perangkat ini. Masuk dengan akun kamu agar otomatis tersinkron ke desktop/laptop.</div>
                </div>
                {onRequireLogin && (
                  <button
                    type="button"
                    className="kanban-guest-sync-btn"
                    onClick={() => {
                      onClose();
                      onRequireLogin();
                    }}
                  >
                    Masuk Akun
                  </button>
                )}
              </div>
            )}
            {boards.length === 0 ? (
            <div className="kanban-empty-boards-modal-state">
              <p>Belum ada board yang tersimpan.</p>
              <button
                type="button"
                className="kanban-primary-btn"
                onClick={() => setActiveTab("create")}
              >
                + Buat Board Pertama
              </button>
            </div>
          ) : (
            <div className="kanban-boards-grid">
              {boards.map((b) => {
              const bg = BOARD_BACKGROUNDS.find((bgItem) => bgItem.id === b.background) || BOARD_BACKGROUNDS[0];
              const cleanBoardId = b.id.replace(/^["']|["']$/g, "");
              const cleanActiveId = activeBoardId.replace(/^["']|["']$/g, "");
              const isActive = cleanBoardId === cleanActiveId;
              const lists = Array.isArray(b.lists) ? b.lists : [];
              const totalCards = lists.reduce((acc, l) => acc + (Array.isArray(l.cards) ? l.cards.length : 0), 0);
              const isLight = Boolean(bg.isLight || bg.textColor === "#0f172a" || bg.textColor === "#111111");

              return (
                <div
                  key={b.id}
                  className={`kanban-board-card-thumb ${isActive ? "active-board" : ""} ${isLight ? "light-board-card" : ""}`}
                  style={{
                    background: bg.value,
                    color: isLight ? "#0f172a" : "#ffffff",
                  }}
                  onClick={() => {
                    onSelectBoard(b.id);
                    onClose();
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="board-card-head">
                    <span className="board-card-title" style={{ color: isLight ? "#0f172a" : "#ffffff" }}>{b.title}</span>
                    {isActive && <span className="active-badge">Aktif ✓</span>}
                  </div>
                  <div className="board-card-footer" style={{ color: isLight ? "#475569" : "rgba(255,255,255,0.85)" }}>
                    <span>
                      {b.lists.length} kolom · {totalCards} kartu
                    </span>
                    {boards.length > 1 && (
                      <button
                        type="button"
                        className="board-del-btn"
                        style={{
                          background: isLight ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.45)",
                          color: isLight ? "#0f172a" : "#ffffff",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setBoardToDelete(b);
                        }}
                        title="Hapus board"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Quick Add Card */}
            <div
              className="kanban-board-card-thumb add-new-thumb"
              onClick={() => setActiveTab("create")}
              role="button"
              tabIndex={0}
            >
              <span>+ Buat Board Baru</span>
            </div>
          </div>
          )}

          {/* Bottom Footer Dismiss for Mobile/Desktop */}
          <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="kanban-secondary-btn"
              onClick={onClose}
              style={{ padding: "8px 20px", fontSize: 13, borderRadius: 12 }}
            >
              Tutup
            </button>
          </div>
          </>
        )}

        {/* Tab 2: Templates Library (Screenshot 4) */}
        {activeTab === "templates" && (
          <div className="kanban-templates-list">
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--muted)" }}>
              Pilih template terstruktur untuk langsung memulai alur kerja tim atau proyek fokus:
            </p>
            <div className="kanban-templates-grid">
              {TEMPLATES.map((tmpl) => (
                <div key={tmpl.key} className="kanban-template-card">
                  <div className="tmpl-icon">{tmpl.icon}</div>
                  <div className="tmpl-info">
                    <h4>{tmpl.name}</h4>
                    <p>{tmpl.description}</p>
                  </div>
                  <button
                    type="button"
                    className="kanban-primary-btn"
                    onClick={() => handleUseTemplate(tmpl.key, tmpl.name)}
                  >
                    Gunakan Template
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Create Board */}
        {activeTab === "create" && (
          <div className="kanban-create-board-form">
            <label className="kanban-create-board-label">
              Judul Board
              <input
                type="text"
                placeholder="Misal: GT - Growth, Sprint Q4, Redesign App..."
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                className="kanban-create-board-input"
                autoFocus
              />
            </label>

            <div>
              <span className="kanban-create-board-subheading">
                Pilih Wallpaper &amp; Tema Background
              </span>
              <div className="kanban-bg-grid">
                {BOARD_BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    className={`kanban-bg-option ${selectedBg === bg.id ? "selected" : ""}`}
                    style={{ background: bg.value }}
                    onClick={() => setSelectedBg(bg.id)}
                  >
                    <span style={{ color: bg.textColor, fontSize: 12, fontWeight: 700 }}>
                      {bg.name} {selectedBg === bg.id ? "✓" : ""}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button
                type="button"
                className="kanban-secondary-btn"
                onClick={() => setActiveTab("boards")}
              >
                Batal
              </button>
              <button
                type="button"
                className="kanban-primary-btn"
                onClick={handleCreateCustomBoard}
                disabled={!newBoardTitle.trim()}
              >
                Buat Board
              </button>
            </div>
          </div>
        )}

        <ConfirmModal
          isOpen={Boolean(boardToDelete)}
          title="Hapus Board?"
          message={`Board "${boardToDelete?.title}" beserta seluruh kolom dan kartu di dalamnya akan dihapus secara permanen.`}
          itemName={boardToDelete?.title}
          itemSubtext={
            boardToDelete
              ? `${boardToDelete.lists.length} kolom · ${boardToDelete.lists.reduce((acc, l) => acc + l.cards.length, 0)} kartu`
              : undefined
          }
          confirmLabel="Ya, Hapus Board"
          cancelLabel="Batal"
          variant="danger"
          onConfirm={() => {
            if (boardToDelete) {
              onDeleteBoard(boardToDelete.id);
              setBoardToDelete(null);
            }
          }}
          onCancel={() => setBoardToDelete(null)}
        />
      </div>
    </div>
  );
}
