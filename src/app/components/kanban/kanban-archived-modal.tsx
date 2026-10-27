"use client";

import { useMemo, useRef, useState } from "react";
import type { KanbanCard } from "@/types/domain";
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
  onRestoreCard: (listId: string, cardId: string) => void;
  onDeleteCard: (listId: string, cardId: string) => void;
  onOpenCardDetail?: (card: KanbanCard, listId: string) => void;
  readOnly?: boolean;
};

export function KanbanArchivedModal({
  isOpen,
  onClose,
  archivedCards,
  onRestoreCard,
  onDeleteCard,
  onOpenCardDetail,
  readOnly = false,
}: KanbanArchivedModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cardToDelete, setCardToDelete] = useState<ArchivedCardItem | null>(null);

  useOutsideClick(modalRef, onClose, isOpen && !cardToDelete);
  useEscapeKey(onClose, isOpen && !cardToDelete);

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

  if (!isOpen) return null;

  return (
    <div className="kanban-modal-backdrop" role="dialog" aria-modal="true">
      <div ref={modalRef} className="kanban-board-modal kanban-archived-modal-box">
        {/* Modal Header */}
        <div className="kanban-board-modal-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 26 }}>🗃️</span>
              <h2 style={{ margin: 0 }}>Item Terarsip</h2>
            </div>
            <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 13 }}>
              Kartu yang diarsipkan dari papan proyek ini. Kartu dapat dipulihkan kembali ke kolomnya kapan saja.
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

        {/* Search Bar & Stats */}
        <div className="kanban-archived-toolbar">
          <div className="kanban-archived-search-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Cari kartu terarsip..."
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
            {archivedCards.length} kartu diarsipkan
          </span>
        </div>

        {/* Cards List or Empty State */}
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
      </div>

      {/* Confirmation Modal for Permanent Deletion */}
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
    </div>
  );
}
