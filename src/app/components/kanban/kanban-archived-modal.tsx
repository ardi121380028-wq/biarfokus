"use client";

import { useMemo, useRef, useState } from "react";
import type { KanbanBoard, KanbanCard } from "@/types/domain";
import { useEscapeKey, useOutsideClick } from "@/lib/hooks/use-dismiss";
import { KanbanConfirmModal } from "./kanban-confirm-modal";

export type ArchivedCardItem = {
  card: KanbanCard;
  listId: string;
  listTitle: string;
};

type KanbanArchivedModalProps = {
  isOpen: boolean;
  onClose: () => void;
  archivedCards: ArchivedCardItem[];
  archivedBoards?: KanbanBoard[];
  onRestoreCard: (listId: string, cardId: string) => void;
  onDeleteCard: (listId: string, cardId: string) => void;
  onRestoreBoard?: (boardId: string) => void;
  onDeleteBoardPermanent?: (boardId: string) => void;
  onOpenCardDetail?: (card: KanbanCard, listId: string) => void;
  readOnly?: boolean;
};

export function KanbanArchivedModal({
  isOpen,
  onClose,
  archivedCards,
  archivedBoards = [],
  onRestoreCard,
  onDeleteCard,
  onRestoreBoard,
  onDeleteBoardPermanent,
  onOpenCardDetail,
  readOnly = false,
}: KanbanArchivedModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"boards" | "cards">(() => {
    return archivedBoards.length > 0 && archivedCards.length === 0 ? "boards" : "cards";
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [cardToDelete, setCardToDelete] = useState<ArchivedCardItem | null>(null);
  const [boardToDelete, setBoardToDelete] = useState<KanbanBoard | null>(null);

  useOutsideClick(modalRef, onClose, isOpen && !cardToDelete && !boardToDelete);
  useEscapeKey(onClose, isOpen && !cardToDelete && !boardToDelete);

  const filteredCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return archivedCards;
    return archivedCards.filter((item) => {
      const matchTitle = item.card.title.toLowerCase().includes(q);
      const matchDesc = (item.card.description || "").toLowerCase().includes(q);
      const matchList = item.listTitle.toLowerCase().includes(q);
      const matchLabel = (item.card.labels || []).some((l) =>
        l.name.toLowerCase().includes(q),
      );
      return matchTitle || matchDesc || matchList || matchLabel;
    });
  }, [archivedCards, searchQuery]);

  const filteredBoards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return archivedBoards;
    return archivedBoards.filter((b) => {
      const matchTitle = b.title.toLowerCase().includes(q);
      const matchDesc = (b.description || "").toLowerCase().includes(q);
      return matchTitle || matchDesc;
    });
  }, [archivedBoards, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="kanban-modal-backdrop" role="dialog" aria-modal="true">
      <div ref={modalRef} className="kanban-board-modal kanban-archived-modal-box">
        {/* Modal Header */}
        <div className="kanban-board-modal-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 26 }}>🗃️</span>
              <h2 style={{ margin: 0 }}>Item &amp; Proyek Terarsip</h2>
            </div>
            <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 13 }}>
              Papan proyek dan kartu yang telah diarsipkan. Kamu dapat memulihkan item ini ke workspace aktif kapan saja.
            </p>
          </div>
          <button
            type="button"
            className="kanban-dialog-close-btn"
            onClick={onClose}
            aria-label="Tutup jendela arsip"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="kanban-board-modal-tabs" style={{ marginBottom: 12 }}>
          <button
            type="button"
            className={`kanban-tab-btn ${activeTab === "cards" ? "active" : ""}`}
            onClick={() => setActiveTab("cards")}
          >
            📋 Kartu Terarsip ({archivedCards.length})
          </button>
          <button
            type="button"
            className={`kanban-tab-btn ${activeTab === "boards" ? "active" : ""}`}
            onClick={() => setActiveTab("boards")}
          >
            🗂️ Papan Proyek Terarsip ({archivedBoards.length})
          </button>
        </div>

        {/* Search Bar & Stats */}
        <div className="kanban-archived-toolbar">
          <div className="kanban-archived-search-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder={activeTab === "cards" ? "Cari kartu terarsip..." : "Cari papan proyek terarsip..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="kanban-archived-search-input"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                className="kanban-clear-search-btn"
                onClick={() => setSearchQuery("")}
                aria-label="Hapus filter"
              >
                ✕
              </button>
            )}
          </div>
          <span className="kanban-archived-count-badge">
            {activeTab === "cards" ? `${archivedCards.length} kartu` : `${archivedBoards.length} papan`}
          </span>
        </div>

        {/* Tab Content 1: Cards */}
        {activeTab === "cards" && (
          <div className="kanban-archived-list-container">
            {archivedCards.length === 0 ? (
              <div className="kanban-archived-empty-state">
                <span className="empty-icon" style={{ fontSize: 48, marginBottom: 10, display: "block" }}>
                  🗃️
                </span>
                <h3>Belum Ada Kartu Terarsip</h3>
                <p>
                  Ketika kamu mengarsipkan tugas atau kartu dari papan ini, kartu akan tersimpan aman di sini dan tidak akan memenuhi kolom aktif.
                </p>
              </div>
            ) : filteredCards.length === 0 ? (
              <div className="kanban-archived-empty-state">
                <span className="empty-icon" style={{ fontSize: 36, marginBottom: 8, display: "block" }}>
                  🔍
                </span>
                <h3>Tidak Ditemukan</h3>
                <p>Tidak ada kartu terarsip yang cocok dengan kata kunci &quot;{searchQuery}&quot;.</p>
              </div>
            ) : (
              <div className="kanban-archived-grid">
                {filteredCards.map((item) => {
                  const totalChecklist = (item.card.checklists || []).reduce(
                    (acc, c) => acc + (c.items ? c.items.length : 0),
                    0,
                  );
                  const completedChecklist = (item.card.checklists || []).reduce(
                    (acc, c) => acc + (c.items ? c.items.filter((i) => i.done).length : 0),
                    0,
                  );

                  return (
                    <div key={item.card.id} className="kanban-archived-card-row">
                      <div className="kanban-archived-card-main">
                        <div className="kanban-archived-card-meta">
                          <span className="kanban-archived-list-pill">
                            📍 {item.listTitle}
                          </span>
                          {item.card.coverEmoji && (
                            <span className="kanban-archived-emoji">
                              {item.card.coverEmoji}
                            </span>
                          )}
                          {(item.card.labels || []).map((lbl) => (
                            <span
                              key={lbl.id}
                              className="kanban-archived-label-pill"
                              style={{
                                backgroundColor: `${lbl.color}25`,
                                color: lbl.color,
                                border: `1px solid ${lbl.color}60`,
                              }}
                            >
                              {lbl.name}
                            </span>
                          ))}
                        </div>

                        <h4
                          className="kanban-archived-card-title"
                          onClick={() => {
                            if (onOpenCardDetail) {
                              onOpenCardDetail(item.card, item.listId);
                            }
                          }}
                          title="Klik untuk membuka detail kartu"
                        >
                          {item.card.title}
                        </h4>

                        {item.card.description && (
                          <p className="kanban-archived-card-desc">
                            {item.card.description}
                          </p>
                        )}

                        <div className="kanban-archived-card-footer">
                          {item.card.dueDate && (
                            <span className="kanban-archived-subpill">
                              🕒 Tenggat: {item.card.dueDate}
                            </span>
                          )}
                          {totalChecklist > 0 && (
                            <span className="kanban-archived-subpill">
                              ☑️ {completedChecklist}/{totalChecklist}
                            </span>
                          )}
                          {(item.card.comments || []).length > 0 && (
                            <span className="kanban-archived-subpill">
                              💬 {item.card.comments.length}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons: Restore or Delete Permanently */}
                      {!readOnly && (
                        <div className="kanban-archived-card-actions">
                          <button
                            type="button"
                            className="kanban-archived-action-btn restore"
                            onClick={() => onRestoreCard(item.listId, item.card.id)}
                            title="Kembalikan kartu ke kolom aktif di papan"
                          >
                            ↩️ Pulihkan ke Papan
                          </button>
                          <button
                            type="button"
                            className="kanban-archived-action-btn delete"
                            onClick={() => setCardToDelete(item)}
                            title="Hapus kartu ini secara permanen"
                          >
                            🗑️ Hapus Permanen
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab Content 2: Archived Boards */}
        {activeTab === "boards" && (
          <div className="kanban-archived-list-container">
            {archivedBoards.length === 0 ? (
              <div className="kanban-archived-empty-state">
                <span className="empty-icon" style={{ fontSize: 48, marginBottom: 10, display: "block" }}>
                  📦
                </span>
                <h3>Belum Ada Papan Proyek Terarsip</h3>
                <p>
                  Untuk mengarsipkan papan proyek, arahkan kursor (hover) pada nama papan di bilah sisi (sidebar) lalu klik ikon arsip 📦.
                </p>
              </div>
            ) : filteredBoards.length === 0 ? (
              <div className="kanban-archived-empty-state">
                <span className="empty-icon" style={{ fontSize: 36, marginBottom: 8, display: "block" }}>
                  🔍
                </span>
                <h3>Tidak Ditemukan</h3>
                <p>Tidak ada papan proyek terarsip yang cocok dengan kata kunci &quot;{searchQuery}&quot;.</p>
              </div>
            ) : (
              <div className="kanban-archived-grid">
                {filteredBoards.map((b) => {
                  const cardCount = (b.lists || []).reduce(
                    (acc, l) => acc + ((l.cards || []).length),
                    0,
                  );
                  return (
                    <div key={b.id} className="kanban-archived-card-row">
                      <div className="kanban-archived-card-main">
                        <div className="kanban-archived-card-meta">
                          <span
                            className="kanban-board-swatch"
                            style={{
                              width: 14,
                              height: 14,
                              borderRadius: 4,
                              background: b.background?.startsWith("#")
                                ? b.background
                                : b.background === "biarfokus-white"
                                ? "#e2e8f0"
                                : "#3b82f6",
                            }}
                          />
                          <span className="kanban-archived-list-pill">
                            📁 {b.lists.length} Kolom
                          </span>
                          <span className="kanban-archived-list-pill">
                            📑 {cardCount} Kartu
                          </span>
                          {b.starred && (
                            <span className="kanban-archived-subpill" style={{ color: "#f59e0b" }}>
                              ⭐ Favorit
                            </span>
                          )}
                        </div>

                        <h4 className="kanban-archived-card-title" style={{ fontSize: 16 }}>
                          {b.title}
                        </h4>

                        {b.description && (
                          <p className="kanban-archived-card-desc">
                            {b.description}
                          </p>
                        )}

                        <div className="kanban-archived-card-footer">
                          {b.archivedAt && (
                            <span className="kanban-archived-subpill">
                              📦 Diarsipkan: {new Date(b.archivedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons for Boards */}
                      {!readOnly && (
                        <div className="kanban-archived-card-actions">
                          <button
                            type="button"
                            className="kanban-archived-action-btn restore"
                            onClick={() => onRestoreBoard?.(b.id)}
                            title="Pulihkan papan ke bilah sisi workspace"
                          >
                            ↩️ Pulihkan Papan
                          </button>
                          <button
                            type="button"
                            className="kanban-archived-action-btn delete"
                            onClick={() => setBoardToDelete(b)}
                            title="Hapus papan ini secara permanen"
                          >
                            🗑️ Hapus Permanen
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal for Permanent Card Deletion */}
      <KanbanConfirmModal
        isOpen={Boolean(cardToDelete)}
        title="Hapus Permanen Kartu?"
        message="Apakah kamu yakin ingin menghapus kartu ini secara permanen? Kartu ini, checklist, serta seluruh komentarnya akan dihapus selamanya dan tidak dapat dikembalikan."
        itemName={cardToDelete?.card.title}
        itemSubtext={`Kolom: ${cardToDelete?.listTitle}`}
        confirmLabel="Ya, Hapus Permanen"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={() => {
          if (cardToDelete) {
            onDeleteCard(cardToDelete.listId, cardToDelete.card.id);
            setCardToDelete(null);
          }
        }}
        onCancel={() => setCardToDelete(null)}
      />

      {/* Confirmation Modal for Permanent Board Deletion */}
      <KanbanConfirmModal
        isOpen={Boolean(boardToDelete)}
        title="Hapus Permanen Papan Proyek?"
        message="Apakah kamu yakin ingin menghapus papan ini secara permanen? Seluruh kolom, kartu, dan data di dalam papan ini akan dihapus selamanya."
        itemName={boardToDelete?.title}
        confirmLabel="Ya, Hapus Papan"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={() => {
          if (boardToDelete) {
            onDeleteBoardPermanent?.(boardToDelete.id);
            setBoardToDelete(null);
          }
        }}
        onCancel={() => setBoardToDelete(null)}
      />
    </div>
  );
}
