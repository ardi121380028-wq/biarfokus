"use client";

import { useRef, useState } from "react";
import type { KanbanBoard } from "@/types/domain";
import { BOARD_BACKGROUNDS, TEMPLATES } from "@/features/kanban/kanban-service";
import { useEscapeKey, useOutsideClick } from "@/lib/hooks/use-dismiss";

type KanbanBoardModalProps = {
  boards: KanbanBoard[];
  activeBoardId: string;
  onSelectBoard: (boardId: string) => void;
  onCreateBoard: (title: string, background?: string, templateKey?: string) => void;
  onDeleteBoard: (boardId: string) => void;
  onClose: () => void;
};

export function KanbanBoardModal({
  boards,
  activeBoardId,
  onSelectBoard,
  onCreateBoard,
  onDeleteBoard,
  onClose,
}: KanbanBoardModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  useOutsideClick(modalRef, onClose);
  useEscapeKey(onClose);

  const [activeTab, setActiveTab] = useState<"boards" | "templates" | "create">("boards");
  const [newBoardTitle, setNewBoardTitle] = useState("");
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
            className="kanban-dialog-close-btn"
            onClick={onClose}
            aria-label="Tutup"
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
          <div className="kanban-boards-grid">
            {boards.map((b) => {
              const bg = BOARD_BACKGROUNDS.find((bgItem) => bgItem.id === b.background) || BOARD_BACKGROUNDS[0];
              const isActive = b.id === activeBoardId;
              const totalCards = b.lists.reduce((acc, l) => acc + l.cards.length, 0);

              return (
                <div
                  key={b.id}
                  className={`kanban-board-card-thumb ${isActive ? "active-board" : ""}`}
                  style={{ background: bg.value }}
                  onClick={() => {
                    onSelectBoard(b.id);
                    onClose();
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="board-card-head">
                    <span className="board-card-title">{b.title}</span>
                    {isActive && <span className="active-badge">Aktif ✓</span>}
                  </div>
                  <div className="board-card-footer">
                    <span>
                      {b.lists.length} kolom · {totalCards} kartu
                    </span>
                    {boards.length > 1 && (
                      <button
                        type="button"
                        className="board-del-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Hapus board "${b.title}"?`)) {
                            onDeleteBoard(b.id);
                          }
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
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600 }}>
              Judul Board
              <input
                type="text"
                placeholder="Misal: GT - Growth, Sprint Q4, Redesign App..."
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                className="kanban-dialog-title-input"
                style={{ fontSize: 15, padding: "8px 12px", borderRadius: 10 }}
                autoFocus
              />
            </label>

            <div>
              <span style={{ display: "block", fontSize: 13, fontWeight: 600, margin: "14px 0 8px" }}>
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
      </div>
    </div>
  );
}
