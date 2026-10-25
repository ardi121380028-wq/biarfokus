"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { createPortal } from "react-dom";
import type { KanbanCard } from "@/types/domain";
import { useEscapeKey } from "@/lib/hooks/use-dismiss";

type KanbanCardItemProps = {
  card: KanbanCard;
  listId: string;
  index: number;
  readOnly?: boolean;
  onClick: (card: KanbanCard, listId: string) => void;
  onSendToFrog?: (card: KanbanCard) => void;
  onDragStart: (e: DragEvent<HTMLDivElement>, cardId: string, listId: string, index: number) => void;
  onDragEnd: (e: DragEvent<HTMLDivElement>) => void;
  onDirectMoveCard?: (sourceListId: string, destListId: string, sourceIndex: number, destIndex: number) => void;
  allLists?: { id: string; title: string }[];
};

export function KanbanCardItem({
  card,
  listId,
  index,
  readOnly = false,
  onClick,
  onSendToFrog,
  onDragStart,
  onDragEnd,
  onDirectMoveCard,
  allLists,
}: KanbanCardItemProps) {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [mounted, setMounted] = useState(false);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const [touchDragging, setTouchDragging] = useState(false);
  const [touchOffset, setTouchOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchMovedSignificantly = useRef(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  useEscapeKey(() => setShowMoveMenu(false), showMoveMenu);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
    }
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

      if (targetListId && targetListId !== listId && onDirectMoveCard) {
        onDirectMoveCard(listId, targetListId, index, 9999);
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
      className={`kanban-card-item ${readOnly ? "is-readonly" : ""} ${touchDragging ? "is-touch-dragging" : ""}`}
      style={{
        ...(touchDragging
          ? {
              transform: `translate3d(${touchOffset.x}px, ${touchOffset.y}px, 0)`,
              zIndex: 99999,
              pointerEvents: "none",
            }
          : {}),
        ...(card.coverColor
          ? {
              backgroundColor: `color-mix(in srgb, ${card.coverColor} 15%, var(--paper, #ffffff))`,
              borderColor: `color-mix(in srgb, ${card.coverColor} 45%, transparent)`,
            }
          : {}),
      }}
      draggable={!readOnly && !isTouchDevice}
      onDragStart={(e) => {
        if (!readOnly) onDragStart(e, card.id, listId, index);
      }}
      onDragEnd={onDragEnd}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`Kartu: ${card.title}`}
    >
      {/* Cover Color or Emoji */}
      {card.coverColor && (
        <div className="kanban-card-cover-bar" style={{ background: card.coverColor, height: "10px" }} />
      )}
      {card.coverEmoji && (
        <div
          className="kanban-card-cover-emoji"
          style={
            card.coverColor
              ? {
                  background: `color-mix(in srgb, ${card.coverColor} 30%, transparent)`,
                  borderBottomColor: `color-mix(in srgb, ${card.coverColor} 40%, transparent)`,
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

      {/* Badges footer */}
      <div className="kanban-card-footer" onClick={(e) => e.stopPropagation()}>
        <div className="kanban-badges-group">
          {card.description && (
            <span className="kanban-badge" title="Memiliki deskripsi">
              ≡
            </span>
          )}

          {card.comments && card.comments.length > 0 && (
            <span className="kanban-badge" title={`${card.comments.length} komentar`}>
              💬 {card.comments.length}
            </span>
          )}

          {totalItems > 0 && (
            <span
              className={`kanban-badge ${doneItems === totalItems ? "checklist-complete" : ""}`}
              title={`${doneItems}/${totalItems} checklist selesai`}
            >
              ☑ {doneItems}/{totalItems}
            </span>
          )}

          {(card.dueDate || card.startDate) && (
            <span className={dueDateClass} title={`Rentang waktu: ${dueDateLabel}`}>
              🕒 {dueDateLabel}
            </span>
          )}

          {card.pomodoros && card.pomodoros > 0 ? (
            <span className="kanban-badge" title={`Estimasi fokus: ${card.pomodoros} pomodoro`}>
              🍅 {card.pomodoros}
            </span>
          ) : null}

          {card.frog && (
            <span className="kanban-badge frog-badge" title="Sedang aktif di Eat Your Frog">
              🐸 Frog
            </span>
          )}
        </div>

        <div className="kanban-card-footer-right">
          {/* Assignees / PIC Avatar Stack */}
          {card.assignees && card.assignees.length > 0 && (
            <div
              className="kanban-card-assignees-stack"
              title={`PIC: ${card.assignees.map((a) => a.name).join(", ")}`}
            >
              {card.assignees.slice(0, 3).map((assignee, idx) =>
                assignee.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={assignee.id || idx}
                    src={assignee.avatarUrl}
                    alt={assignee.name}
                    className="kanban-card-pic-avatar"
                  />
                ) : (
                  <span key={assignee.id || idx} className="kanban-card-pic-avatar placeholder">
                    {(assignee.name || "U").charAt(0).toUpperCase()}
                  </span>
                ),
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
                  title="Pindahkan kartu ke kolom lain"
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
                title="Tahan dan geser untuk memindahkan kartu"
                aria-label="Geser kartu"
              >
                ⠿
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Move Action Modal / Bottom Sheet (Portaled to document.body so it NEVER gets clipped) */}
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
                  Pindahkan Kartu
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
