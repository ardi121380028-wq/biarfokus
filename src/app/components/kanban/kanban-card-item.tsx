"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { createPortal } from "react-dom";
import type { KanbanCard } from "@/types/domain";
import { useEscapeKey } from "@/lib/hooks/use-dismiss";

type KanbanCardItemProps = {
  card: KanbanCard;
  listId: string;
  index: number;
  totalCards?: number;
  readOnly?: boolean;
  onClick: (card: KanbanCard, listId: string) => void;
  onSendToFrog?: (card: KanbanCard) => void;
  onDragStart: (e: DragEvent<HTMLDivElement>, cardId: string, listId: string, index: number) => void;
  onDragEnd: (e: DragEvent<HTMLDivElement>) => void;
  onDirectMoveCard?: (sourceListId: string, destListId: string, sourceIndex: number, destIndex: number) => void;
  onMoveCardPosition?: (listId: string, cardId: string, direction: "top" | "up" | "down" | "bottom") => void;
  onDragOverCard?: (e: React.DragEvent<HTMLDivElement>, cardId: string, listId: string, index: number, isUpperHalf: boolean) => void;
  onDragLeaveCard?: (e: React.DragEvent<HTMLDivElement>, cardId: string) => void;
  onDropOnCard?: (e: React.DragEvent<HTMLDivElement>, listId: string, cardIndex: number, insertBefore: boolean) => void;
  isDropTargetBefore?: boolean;
  isDropTargetAfter?: boolean;
  allLists?: { id: string; title: string }[];
};

export function KanbanCardItem({
  card,
  listId,
  index,
  totalCards,
  readOnly = false,
  onClick,
  onSendToFrog,
  onDragStart,
  onDragEnd,
  onDirectMoveCard,
  onMoveCardPosition,
  onDragOverCard,
  onDragLeaveCard,
  onDropOnCard,
  isDropTargetBefore = false,
  isDropTargetAfter = false,
  allLists,
}: KanbanCardItemProps) {
  const [mounted, setMounted] = useState(false);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const [touchDragging, setTouchDragging] = useState(false);
  const [touchOffset, setTouchOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchMovedSignificantly = useRef(false);
  const [isHtml5Dragging, setIsHtml5Dragging] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  useEscapeKey(() => setShowMoveMenu(false), showMoveMenu);

  useEffect(() => {
    setMounted(true);
  }, []);

  function handlePointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    if (readOnly) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    touchStartPos.current = { x: e.clientX, y: e.clientY };
    touchMovedSignificantly.current = false;
  }

  function handlePointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (readOnly || !touchStartPos.current) return;
    const dx = e.clientX - touchStartPos.current.x;
    const dy = e.clientY - touchStartPos.current.y;

    if (!touchMovedSignificantly.current) {
      if (Math.hypot(dx, dy) > 8) {
        touchMovedSignificantly.current = true;
        setTouchDragging(true);
      }
    }

    if (touchMovedSignificantly.current) {
      setTouchOffset({ x: dx, y: dy });
      const elemBelow = document.elementFromPoint(e.clientX, e.clientY);
      const colBelow = elemBelow?.closest("[data-list-id]") as HTMLElement | null;
      document.querySelectorAll(".kanban-column-container.touch-target-col").forEach((el) => {
        if (el !== colBelow) el.classList.remove("touch-target-col");
      });
      if (colBelow) {
        colBelow.classList.add("touch-target-col");
      }
    }
  }

  function handlePointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    if (readOnly) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    document.querySelectorAll(".kanban-column-container.touch-target-col").forEach((el) => {
      el.classList.remove("touch-target-col");
    });

    if (touchMovedSignificantly.current && touchStartPos.current) {
      const elemBelow = document.elementFromPoint(e.clientX, e.clientY);
      const colBelow = elemBelow?.closest("[data-list-id]") as HTMLElement | null;
      const targetListId = colBelow?.getAttribute("data-list-id");
      const cardBelow = elemBelow?.closest("[data-card-id]") as HTMLElement | null;

      if (targetListId && onDirectMoveCard) {
        let destIdx = 9999;
        if (cardBelow) {
          const rawIdx = cardBelow.getAttribute("data-card-index");
          if (rawIdx !== null) {
            const cardRect = cardBelow.getBoundingClientRect();
            const isUpper = e.clientY < cardRect.top + cardRect.height / 2;
            const parsed = parseInt(rawIdx, 10);
            destIdx = isUpper ? parsed : parsed + 1;
          }
        }
        onDirectMoveCard(listId, targetListId, index, destIdx);
      }
    }

    touchStartPos.current = null;
    setTouchDragging(false);
    setTouchOffset({ x: 0, y: 0 });
  }

  function handleClick() {
    if (touchMovedSignificantly.current) {
      touchMovedSignificantly.current = false;
      return;
    }
    onClick(card, listId);
  }

  // Compute checklist stats defensively
  const checklists = Array.isArray(card.checklists) ? card.checklists : [];
  const totalItems = checklists.reduce((acc, c) => acc + (Array.isArray(c?.items) ? c.items.length : 0), 0);
  const doneItems = checklists.reduce((acc, c) => acc + (Array.isArray(c?.items) ? c.items.filter((i) => i.done).length : 0), 0);

  // Compute date range & due date state
  let dueDateClass = "kanban-badge-due";
  let dueDateLabel = "";
  if (card.dueDate || card.startDate) {
    if (card.startDate && card.dueDate) {
      try {
        const start = new Date(card.startDate);
        const due = new Date(card.dueDate);
        const startYear = start.getFullYear();
        const dueYear = due.getFullYear();
        const startStr = start.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: startYear !== dueYear ? "numeric" : undefined,
        });
        const dueStr = due.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        dueDateLabel = `${startStr} – ${dueStr}`;
      } catch {
        dueDateLabel = `${card.startDate} – ${card.dueDate}`;
      }
    } else if (card.dueDate) {
      try {
        const due = new Date(card.dueDate);
        dueDateLabel = due.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      } catch {
        dueDateLabel = card.dueDate;
      }
    } else if (card.startDate) {
      try {
        const start = new Date(card.startDate);
        dueDateLabel = `Mulai ${start.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}`;
      } catch {
        dueDateLabel = `Mulai ${card.startDate}`;
      }
    }

    if (card.dueCompleted) {
      dueDateClass += " completed";
    } else if (card.dueDate) {
      try {
        const due = new Date(card.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        due.setHours(0, 0, 0, 0);
        if (due < today) {
          dueDateClass += " overdue";
        } else if (due.getTime() === today.getTime()) {
          dueDateClass += " today";
        }
      } catch {}
    }
  }

  return (
    <div
      className={`kanban-card-item ${readOnly ? "is-readonly" : ""} ${isHtml5Dragging ? "is-dragging" : ""} ${touchDragging ? "is-touch-dragging" : ""} ${isDropTargetBefore ? "drop-target-before" : ""} ${isDropTargetAfter ? "drop-target-after" : ""}`}
      data-card-id={card.id}
      data-card-index={index}
      style={
        touchDragging
          ? {
              transform: `translate3d(${touchOffset.x}px, ${touchOffset.y}px, 0)`,
              zIndex: 99999,
              pointerEvents: "none",
            }
          : undefined
      }
      draggable={!readOnly}
      onDragStart={(e) => {
        if (!readOnly) {
          setIsHtml5Dragging(true);
          onDragStart(e, card.id, listId, index);
        }
      }}
      onDragEnd={(e) => {
        setIsHtml5Dragging(false);
        onDragEnd(e);
      }}
      onDragOver={(e) => {
        if (readOnly) return;
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "move";
        const rect = e.currentTarget.getBoundingClientRect();
        const isUpperHalf = e.clientY < rect.top + rect.height / 2;
        onDragOverCard?.(e, card.id, listId, index, isUpperHalf);
      }}
      onDragLeave={(e) => {
        if (readOnly) return;
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        onDragLeaveCard?.(e, card.id);
      }}
      onDrop={(e) => {
        if (readOnly) return;
        e.preventDefault();
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        const isUpperHalf = e.clientY < rect.top + rect.height / 2;
        onDropOnCard?.(e, listId, index, isUpperHalf);
      }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`Kartu: ${card.title}`}
    >
      {/* Cover Color or Emoji: Vibrant solid cover when color is selected */}
      {card.coverColor && !card.coverEmoji && (
        <div
          className="kanban-card-cover-bar"
          style={{
            background: card.coverColor,
            height: "28px",
            borderRadius: "16px 16px 0 0",
            margin: "-12px -14px 10px",
          }}
        />
      )}
      {card.coverEmoji && (
        <div
          className="kanban-card-cover-emoji"
          style={
            card.coverColor
              ? {
                  background: card.coverColor,
                  borderBottomColor: `color-mix(in srgb, ${card.coverColor} 60%, transparent)`,
                }
              : undefined
          }
        >
          <span className="cover-emoji-icon">{card.coverEmoji}</span>
        </div>
      )}

      {/* Label Pills */}
      {card.labels && card.labels.length > 0 && (
        <div className="kanban-card-labels">
          {card.labels.map((lbl) => (
            <span
              key={lbl.id}
              className="kanban-label-pill"
              style={{ backgroundColor: lbl.color }}
              title={lbl.name}
            >
              {lbl.name}
            </span>
          ))}
        </div>
      )}

      {/* Card Title */}
      <h4 className="kanban-card-title">{card.title}</h4>

      {/* Badges and Assignees Footer Row */}
      <div className="kanban-card-footer">
        <div className="kanban-card-badges">
          {/* Description indicator */}
          {card.description && (
            <span className="kanban-badge" title="Memiliki deskripsi">
              ≡
            </span>
          )}

          {/* Checklist progress */}
          {totalItems > 0 && (
            <span
              className={`kanban-badge ${doneItems === totalItems ? "kanban-badge-done" : ""}`}
              title={`${doneItems}/${totalItems} butir checklist selesai`}
            >
              ☑ {doneItems}/{totalItems}
            </span>
          )}

          {/* Date Range / Due Date */}
          {dueDateLabel && (
            <span className={dueDateClass} title={`Tenggat: ${dueDateLabel}`}>
              🕒 {dueDateLabel}
            </span>
          )}

          {/* Comments count */}
          {card.comments && card.comments.length > 0 && (
            <span className="kanban-badge" title={`${card.comments.length} komentar`}>
              💬 {card.comments.length}
            </span>
          )}
        </div>

        {/* Right side: PIC Avatars & Frog button */}
        <div className="kanban-card-footer-right">
          {card.assignees && card.assignees.length > 0 && (
            <div className="kanban-card-pics">
              {card.assignees.slice(0, 3).map((a) =>
                a.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={a.id}
                    src={a.avatarUrl}
                    alt={a.name}
                    className="kanban-card-pic-avatar"
                    title={a.name}
                  />
                ) : (
                  <span
                    key={a.id}
                    className="kanban-card-pic-initial"
                    title={a.name}
                  >
                    {a.name.slice(0, 2).toUpperCase()}
                  </span>
                )
              )}
              {card.assignees.length > 3 && (
                <span className="kanban-card-pic-more">+{card.assignees.length - 3}</span>
              )}
            </div>
          )}

          {/* Quick Send to Eat Your Frog button */}
          {onSendToFrog && (
            <button
              type="button"
              className="kanban-card-frog-btn"
              onClick={(e) => {
                e.stopPropagation();
                onSendToFrog(card);
              }}
              title="Kirim ke Eat Your Frog (Target Fokus)"
              aria-label="Kirim ke Eat Your Frog"
            >
              🐸
            </button>
          )}

          {/* Mobile Move Actions (Quick column dropdown & Touch drag grip) - Hidden on Desktop */}
          {!readOnly && allLists && allLists.length > 1 && (
            <div className="kanban-card-mobile-actions lg:hidden" onClick={(e) => e.stopPropagation()}>
              <div>
                <button
                  type="button"
                  className={`kanban-card-move-trigger ${showMoveMenu ? "active" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMoveMenu(!showMoveMenu);
                  }}
                  title="Pindahkan kartu ke kolom lain atau urutkan prioritas"
                >
                  ⇄ Pindah
                </button>
              </div>

              {/* Touch Drag Grip */}
              <button
                type="button"
                className="kanban-card-drag-handle"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                title="Tahan dan geser untuk memindahkan kartu ke posisi mana pun"
                aria-label="Geser kartu"
              >
                ⠿
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Move Action Modal / Bottom Sheet */}
      {showMoveMenu && mounted && allLists && allLists.length > 1 && createPortal(
        <div
          className="kanban-mobile-move-backdrop"
          role="presentation"
          onClick={(e) => {
            e.stopPropagation();
            setShowMoveMenu(false);
          }}
        >
          <div
            className="kanban-mobile-move-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`move-title-${card.id}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="kanban-mobile-move-grabber" />

            <div className="kanban-mobile-move-header">
              <div className="kanban-mobile-move-header-text">
                <h3 id={`move-title-${card.id}`} className="kanban-mobile-move-title">
                  Pindahkan & Urutkan Kartu
                </h3>
                <p className="kanban-mobile-move-subtitle" title={card.title}>
                  {card.title}
                </p>
              </div>
              <button
                type="button"
                className="kanban-mobile-move-close"
                onClick={() => setShowMoveMenu(false)}
                aria-label="Tutup menu pindah kartu"
              >
                ✕
              </button>
            </div>

            {/* Quick Priority Reorder in this Column */}
            {onMoveCardPosition && (
              <div className="kanban-mobile-move-list" style={{ marginBottom: 12 }}>
                <span className="kanban-mobile-move-label">URUTKAN PRIORITAS DI KOLOM INI</span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 6 }}>
                  <button
                    type="button"
                    className="kanban-mobile-move-option"
                    disabled={index === 0}
                    onClick={() => {
                      setShowMoveMenu(false);
                      onMoveCardPosition(listId, card.id, "top");
                    }}
                    style={{ justifyContent: "center", fontSize: 12, padding: "8px 10px" }}
                  >
                    <span>⬆️ Paling Atas (Prioritas Utama)</span>
                  </button>
                  <button
                    type="button"
                    className="kanban-mobile-move-option"
                    disabled={index === 0}
                    onClick={() => {
                      setShowMoveMenu(false);
                      onMoveCardPosition(listId, card.id, "up");
                    }}
                    style={{ justifyContent: "center", fontSize: 12, padding: "8px 10px" }}
                  >
                    <span>▲ Geser ke Atas</span>
                  </button>
                  <button
                    type="button"
                    className="kanban-mobile-move-option"
                    disabled={index >= effectiveTotal - 1}
                    onClick={() => {
                      setShowMoveMenu(false);
                      onMoveCardPosition(listId, card.id, "down");
                    }}
                    style={{ justifyContent: "center", fontSize: 12, padding: "8px 10px" }}
                  >
                    <span>▼ Geser ke Bawah</span>
                  </button>
                  <button
                    type="button"
                    className="kanban-mobile-move-option"
                    disabled={index >= effectiveTotal - 1}
                    onClick={() => {
                      setShowMoveMenu(false);
                      onMoveCardPosition(listId, card.id, "bottom");
                    }}
                    style={{ justifyContent: "center", fontSize: 12, padding: "8px 10px" }}
                  >
                    <span>⬇️ Paling Bawah</span>
                  </button>
                </div>
              </div>
            )}

            <div className="kanban-mobile-move-list">
              <span className="kanban-mobile-move-label">PILIH KOLOM TUJUAN</span>
              {allLists.map((col) => {
                const isCurrent = col.id === listId;
                return (
                  <button
                    key={col.id}
                    type="button"
                    className={`kanban-mobile-move-option ${isCurrent ? "is-current" : ""}`}
                    disabled={isCurrent}
                    onClick={() => {
                      setShowMoveMenu(false);
                      if (!isCurrent && onDirectMoveCard) {
                        onDirectMoveCard(listId, col.id, index, 9999);
                      }
                    }}
                  >
                    <div className="kanban-mobile-move-option-info">
                      <span className="kanban-mobile-move-option-icon">
                        {isCurrent ? "📍" : "📋"}
                      </span>
                      <span className="kanban-mobile-move-option-title">{col.title}</span>
                    </div>
                    {isCurrent ? (
                      <span className="kanban-mobile-move-badge-current">Kolom Saat Ini</span>
                    ) : (
                      <span className="kanban-mobile-move-arrow">→</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="kanban-mobile-move-footer">
              <button
                type="button"
                className="kanban-mobile-move-cancel-btn"
                onClick={() => setShowMoveMenu(false)}
              >
                Batal
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
