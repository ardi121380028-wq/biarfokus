"use client";

import type { DragEvent } from "react";
import type { KanbanCard } from "@/types/domain";

type KanbanCardItemProps = {
  card: KanbanCard;
  listId: string;
  index: number;
  onClick: (card: KanbanCard, listId: string) => void;
  onSendToFrog?: (card: KanbanCard) => void;
  onDragStart: (e: DragEvent<HTMLDivElement>, cardId: string, listId: string, index: number) => void;
  onDragEnd: (e: DragEvent<HTMLDivElement>) => void;
};

export function KanbanCardItem({
  card,
  listId,
  index,
  onClick,
  onSendToFrog,
  onDragStart,
  onDragEnd,
}: KanbanCardItemProps) {
  // Compute checklist stats defensively
  const checklists = Array.isArray(card.checklists) ? card.checklists : [];
  const totalItems = checklists.reduce((acc, c) => acc + (Array.isArray(c?.items) ? c.items.length : 0), 0);
  const doneItems = checklists.reduce((acc, c) => acc + (Array.isArray(c?.items) ? c.items.filter((i) => i.done).length : 0), 0);

  // Compute due date state
  let dueDateClass = "kanban-badge-due";
  let dueDateLabel = "";
  if (card.dueDate) {
    const due = new Date(card.dueDate);
    dueDateLabel = due.toLocaleDateString("id-ID", { month: "short", day: "numeric" });
    if (card.dueCompleted) {
      dueDateClass += " completed";
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      due.setHours(0, 0, 0, 0);
      if (due < today) {
        dueDateClass += " overdue";
      } else if (due.getTime() === today.getTime()) {
        dueDateClass += " today";
      }
    }
  }

  return (
    <div
      className="kanban-card-item"
      draggable
      onDragStart={(e) => onDragStart(e, card.id, listId, index)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(card, listId)}
      role="button"
      tabIndex={0}
      aria-label={`Kartu: ${card.title}`}
    >
      {/* Cover Color or Emoji */}
      {card.coverColor && (
        <div className="kanban-card-cover-bar" style={{ background: card.coverColor }} />
      )}
      {card.coverEmoji && (
        <div className="kanban-card-cover-emoji">
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

          {card.dueDate && (
            <span className={dueDateClass} title={`Tenggat waktu: ${card.dueDate}`}>
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
        </div>
      </div>
    </div>
  );
}
