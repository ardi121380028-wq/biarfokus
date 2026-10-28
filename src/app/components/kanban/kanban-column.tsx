"use client";

import { useRef, useState, type DragEvent } from "react";
import type { KanbanCard, KanbanList } from "@/types/domain";
import { useOutsideClick } from "@/lib/hooks/use-dismiss";
import { KanbanCardItem } from "./kanban-card-item";
import { ConfirmModal } from "@/app/components/ui/confirm-modal";

type KanbanColumnProps = {
  list: KanbanList;
  readOnly?: boolean;
  columnIndex?: number;
  totalColumns?: number;
  onCardClick: (card: KanbanCard, listId: string) => void;
  onSendToFrog?: (card: KanbanCard) => void;
  onAddCard: (listId: string, title: string) => void;
  onUpdateTitle: (listId: string, title: string) => void;
  onDeleteList: (listId: string) => void;
  onDragStartCard: (e: DragEvent<HTMLDivElement>, cardId: string, listId: string, index: number) => void;
  onDragEndCard: (e: DragEvent<HTMLDivElement>) => void;
  onDropCard: (destListId: string, dropIndex: number) => void;
  onDirectMoveCard?: (sourceListId: string, destListId: string, sourceIndex: number, destIndex: number) => void;
  onMoveCardPosition?: (listId: string, cardId: string, direction: "top" | "up" | "down" | "bottom") => void;
  onMoveList?: (sourceIndex: number, destIndex: number) => void;
  onSortPriority?: (listId: string) => void;
  allLists?: { id: string; title: string }[];
};

export function KanbanColumn({
  list,
  readOnly = false,
  columnIndex = 0,
  totalColumns = 1,
  onCardClick,
  onSendToFrog,
  onAddCard,
  onUpdateTitle,
  onDeleteList,
  onDragStartCard,
  onDragEndCard,
  onDropCard,
  onDirectMoveCard,
  onMoveCardPosition,
  onMoveList,
  onSortPriority,
  allLists,
}: KanbanColumnProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(list.title);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragOverCardInfo, setDragOverCardInfo] = useState<{
    cardId: string;
    index: number;
    before: boolean;
  } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(menuRef, () => setMenuOpen(false), menuOpen);

  const cards = Array.isArray(list.cards) ? list.cards.filter((c) => !c.archived) : [];

  function handleTitleBlur() {
    const trimmed = title.trim();
    if (trimmed && trimmed !== list.title) {
      onUpdateTitle(list.id, trimmed);
    } else {
      setTitle(list.title);
    }
    setIsEditingTitle(false);
  }

  function handleCreateCard() {
    const trimmed = newCardTitle.trim();
    if (!trimmed) return;
    onAddCard(list.id, trimmed);
    setNewCardTitle("");
    setIsAddingCard(false);
  }

  function handleQuickTip() {
    const tips = [
      "Review analitik mingguan",
      "Draft copywriting hero landing page",
      "Kirim invoice ke klien",
      "Follow-up calon partner B2B",
      "Audit performa loading website",
    ];
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    setNewCardTitle(randomTip);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    if (readOnly) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!isDragOver) setIsDragOver(true);

    if (cards.length > 0) {
      const firstCardEl = e.currentTarget.querySelector("[data-card-id]");
      if (firstCardEl) {
        const firstRect = firstCardEl.getBoundingClientRect();
        if (e.clientY < firstRect.top + 8) {
          setDragOverCardInfo({ cardId: cards[0].id, index: 0, before: true });
        }
      }
    }
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
    setDragOverCardInfo(null);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    if (readOnly) return;
    e.preventDefault();
    setIsDragOver(false);
    if (dragOverCardInfo) {
      const dropIndex = dragOverCardInfo.before ? dragOverCardInfo.index : dragOverCardInfo.index + 1;
      setDragOverCardInfo(null);
      onDropCard(list.id, dropIndex);
      return;
    }

    if (cards.length > 0) {
      const firstCardEl = e.currentTarget.querySelector("[data-card-id]");
      if (firstCardEl) {
        const firstRect = firstCardEl.getBoundingClientRect();
        if (e.clientY <= firstRect.top + 10) {
          setDragOverCardInfo(null);
          onDropCard(list.id, 0);
          return;
        }
      }
    }

    setDragOverCardInfo(null);
    onDropCard(list.id, cards.length);
  }

  function handleDragOverCard(
    e: DragEvent<HTMLDivElement>,
    cardId: string,
    _listId: string,
    index: number,
    isUpperHalf: boolean,
  ) {
    if (readOnly) return;
    setDragOverCardInfo({ cardId, index, before: isUpperHalf });
    if (!isDragOver) setIsDragOver(true);
  }

  function handleDragLeaveCard(e: DragEvent<HTMLDivElement>, cardId: string) {
    if (readOnly) return;
    if (e.currentTarget && e.relatedTarget && e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setDragOverCardInfo((curr) => (curr?.cardId === cardId ? null : curr));
  }

  function handleDropOnCard(
    e: DragEvent<HTMLDivElement>,
    targetListId: string,
    cardIndex: number,
    insertBefore: boolean,
  ) {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragOverCardInfo(null);
    const dropIndex = insertBefore ? cardIndex : cardIndex + 1;
    onDropCard(targetListId, dropIndex);
  }

  return (
    <div
      className={`kanban-column-container ${isDragOver ? "drag-over" : ""} ${readOnly ? "is-readonly" : ""}`}
      data-list-id={list.id}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className="kanban-column-header">
        <div className="kanban-column-title-box">
          {!readOnly && isEditingTitle ? (
            <input
              type="text"
              className="kanban-column-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleBlur();
                if (e.key === "Escape") {
                  setTitle(list.title);
                  setIsEditingTitle(false);
                }
              }}
              autoFocus
            />
          ) : (
            <h3
              className="kanban-column-title"
              onClick={() => {
                if (!readOnly) {
                  setTitle(list.title);
                  setIsEditingTitle(true);
                }
              }}
              title={readOnly ? list.title : "Klik untuk mengubah nama kolom"}
            >
              {list.title}
            </h3>
          )}
          <span className="kanban-column-count">{cards.length}</span>
        </div>

        {/* Column Options Menu */}
        {!readOnly && (
          <div className="kanban-column-menu-wrapper" ref={menuRef}>
            <button
              type="button"
              className="kanban-column-menu-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu kolom"
            >
              ⋯
            </button>
            {menuOpen && (
              <div className="kanban-column-popover" role="menu">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCard(true);
                    setMenuOpen(false);
                  }}
                >
                  + Tambah Kartu
                </button>
                {onSortPriority && cards.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      onSortPriority(list.id);
                      setMenuOpen(false);
                    }}
                    title="Urutkan kartu berlabel High Priority / Urgent / Frog ke paling atas"
                  >
                    ⚡ Urutkan Prioritas Tertinggi ke Atas
                  </button>
                )}
                {onMoveList && columnIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      onMoveList(columnIndex, columnIndex - 1);
                      setMenuOpen(false);
                    }}
                  >
                    ◀️ Geser Kolom ke Kiri
                  </button>
                )}
                {onMoveList && columnIndex < totalColumns - 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      onMoveList(columnIndex, columnIndex + 1);
                      setMenuOpen(false);
                    }}
                  >
                    ▶️ Geser Kolom ke Kanan
                  </button>
                )}
                <button
                  type="button"
                  className="danger-text"
                  onClick={() => {
                    setMenuOpen(false);
                    setShowDeleteConfirm(true);
                  }}
                >
                  Hapus Kolom
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cards List Container */}
      <div className="kanban-cards-scroll-area">
        {cards.map((card, idx) => (
          <KanbanCardItem
            key={card.id}
            card={card}
            listId={list.id}
            index={idx}
            totalCards={cards.length}
            readOnly={readOnly}
            onClick={onCardClick}
            onSendToFrog={onSendToFrog}
            onDragStart={onDragStartCard}
            onDragEnd={onDragEndCard}
            onDirectMoveCard={onDirectMoveCard}
            onMoveCardPosition={onMoveCardPosition}
            onDragOverCard={handleDragOverCard}
            onDragLeaveCard={handleDragLeaveCard}
            onDropOnCard={handleDropOnCard}
            isDropTargetBefore={dragOverCardInfo?.cardId === card.id && dragOverCardInfo.before}
            isDropTargetAfter={dragOverCardInfo?.cardId === card.id && !dragOverCardInfo.before}
            allLists={allLists}
          />
        ))}

        {/* Inline Card Composer (Only for Editors/Owners) */}
        {!readOnly && (
          isAddingCard ? (
            <div className="kanban-add-card-composer">
              <textarea
                className="kanban-composer-textarea"
                placeholder="Enter a title or paste a link..."
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleCreateCard();
                  }
                  if (e.key === "Escape") {
                    setIsAddingCard(false);
                    setNewCardTitle("");
                  }
                }}
                rows={2}
                autoFocus
              />
              <div className="kanban-composer-actions">
                <button
                  type="button"
                  className="kanban-composer-add-btn"
                  onClick={handleCreateCard}
                  disabled={!newCardTitle.trim()}
                >
                  Add card
                </button>
                <button
                  type="button"
                  className="kanban-composer-tip-btn"
                  onClick={handleQuickTip}
                  title="Isi contoh otomatis"
                >
                  💡 Tip
                </button>
                <button
                  type="button"
                  className="kanban-composer-cancel-btn"
                  onClick={() => {
                    setIsAddingCard(false);
                    setNewCardTitle("");
                  }}
                  aria-label="Batal"
                >
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="kanban-add-card-prompt-btn"
              onClick={() => setIsAddingCard(true)}
            >
              + Add a card
            </button>
          )
        )}
      </div>

      {/* Confirmation Modal for Column Deletion */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Hapus Kolom?"
        message="Apakah kamu yakin ingin menghapus kolom ini beserta seluruh kartu di dalamnya?"
        itemName={list.title}
        itemSubtext={`Berisi ${list.cards.length} kartu`}
        confirmLabel="Ya, Hapus Kolom"
        cancelLabel="Batal"
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDeleteList(list.id);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
