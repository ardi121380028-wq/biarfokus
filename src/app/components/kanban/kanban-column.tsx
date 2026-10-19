"use client";

import { useState, type DragEvent } from "react";
import type { KanbanCard, KanbanList } from "@/types/domain";
import { KanbanCardItem } from "./kanban-card-item";

type KanbanColumnProps = {
  list: KanbanList;
  onCardClick: (card: KanbanCard, listId: string) => void;
  onSendToFrog?: (card: KanbanCard) => void;
  onAddCard: (listId: string, title: string) => void;
  onUpdateTitle: (listId: string, title: string) => void;
  onDeleteList: (listId: string) => void;
  onDragStartCard: (e: DragEvent<HTMLDivElement>, cardId: string, listId: string, index: number) => void;
  onDragEndCard: (e: DragEvent<HTMLDivElement>) => void;
  onDropCard: (destListId: string, dropIndex: number) => void;
};

export function KanbanColumn({
  list,
  onCardClick,
  onSendToFrog,
  onAddCard,
  onUpdateTitle,
  onDeleteList,
  onDragStartCard,
  onDragEndCard,
  onDropCard,
}: KanbanColumnProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(list.title);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
    e.preventDefault();
    if (!isDragOver) setIsDragOver(true);
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    onDropCard(list.id, list.cards.length);
  }

  return (
    <div
      className={`kanban-column-container ${isDragOver ? "drag-over" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className="kanban-column-header">
        <div className="kanban-column-title-box">
          {isEditingTitle ? (
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
              onClick={() => setIsEditingTitle(true)}
              title="Klik untuk mengubah nama kolom"
            >
              {list.title}
            </h3>
          )}
          <span className="kanban-column-count">{list.cards.length}</span>
        </div>

        {/* Column Options Menu */}
        <div className="kanban-column-menu-wrapper">
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
              <button
                type="button"
                className="danger-text"
                onClick={() => {
                  setMenuOpen(false);
                  if (confirm(`Hapus kolom "${list.title}" dan seluruh kartunya?`)) {
                    onDeleteList(list.id);
                  }
                }}
              >
                Hapus Kolom
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cards List Container */}
      <div className="kanban-cards-scroll-area">
        {list.cards.map((card, idx) => (
          <KanbanCardItem
            key={card.id}
            card={card}
            listId={list.id}
            index={idx}
            onClick={onCardClick}
            onSendToFrog={onSendToFrog}
            onDragStart={onDragStartCard}
            onDragEnd={onDragEndCard}
          />
        ))}

        {/* Inline Card Composer (Screenshot 2) */}
        {isAddingCard ? (
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
        )}
      </div>
    </div>
  );
}
