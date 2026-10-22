"use client";

import { useState } from "react";
import type { KeepNote } from "@/types/domain";
import { exportNoteToPdf } from "@/features/notes/note-format";
import { NoteContentRenderer } from "./note-content-renderer";

type NoteCardProps = {
  note: KeepNote;
  onEdit: (note: KeepNote) => void;
  onTogglePin: (id: string) => void;
  onToggleArchive?: (id: string) => void;
  onToggleItem: (noteId: string, itemId: string) => void;
  onDelete: (id: string) => void;
};

export function NoteCard({
  note,
  onEdit,
  onTogglePin,
  onToggleArchive,
  onToggleItem,
  onDelete,
}: NoteCardProps) {
  const [collapsedDone, setCollapsedDone] = useState(true);

  const isChecklist = note.type === "checklist" && Array.isArray(note.items);
  const activeItems = isChecklist ? (note.items || []).filter((i) => !i.done) : [];
  const doneItems = isChecklist ? (note.items || []).filter((i) => i.done) : [];

  return (
    <div
      className="keep-note-card"
      style={{ background: note.color }}
      onClick={() => onEdit(note)}
    >
      <div className="keep-card-top">
        <h4 className="keep-card-title">{note.title || "(Tanpa judul)"}</h4>
        <button
          type="button"
          className={note.pinned ? "keep-pin-btn active" : "keep-pin-btn"}
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(note.id);
          }}
          title={note.pinned ? "Lepas sematan" : "Sematkan catatan"}
          aria-label={note.pinned ? "Lepas sematan" : "Sematkan"}
        >
          📌
        </button>
      </div>

      {isChecklist ? (
        <div className="keep-card-checklist" onClick={(e) => e.stopPropagation()}>
          {activeItems.map((item) => (
            <div key={item.id} className="keep-card-item-row">
              <label className="keep-card-item">
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => onToggleItem(note.id, item.id)}
                  className="keep-checkbox"
                />
                <span className="keep-card-item-text">{item.text}</span>
              </label>
              <button
                type="button"
                className="keep-frog-pill-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  window.dispatchEvent(
                    new CustomEvent("biarfokus:add-task-from-note", {
                      detail: {
                        title: item.text,
                        linkedNoteId: note.id,
                        linkedNoteTitle: note.title || "(Catatan)",
                        linkedItemId: item.id,
                        linkedItemText: item.text,
                      },
                    })
                  );
                }}
                title="Jadikan target Eat Your Frog (Fokus)"
                aria-label="Jadikan Eat Your Frog"
              >
                🐸 Frog
              </button>
            </div>
          ))}

          {doneItems.length > 0 && (
            <div className="keep-card-done-section">
              <button
                type="button"
                className="keep-card-done-toggle"
                onClick={() => setCollapsedDone(!collapsedDone)}
              >
                {collapsedDone ? "▶" : "▼"} {doneItems.length} item diselesaikan
              </button>

              {!collapsedDone && (
                <div className="keep-card-done-list">
                  {doneItems.map((item) => (
                    <label key={item.id} className="keep-card-item">
                      <input
                        type="checkbox"
                        checked={true}
                        onChange={() => onToggleItem(note.id, item.id)}
                        className="keep-checkbox"
                      />
                      <span className="keep-card-item-text done">
                        {item.text}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="keep-card-content-wrap">
          <NoteContentRenderer content={note.content} isCardPreview />
        </div>
      )}

      {note.labels && note.labels.length > 0 && (
        <div className="keep-card-tags">
          {note.labels.map((lbl) => (
            <span key={lbl} className="keep-card-tag">
              🏷️ {lbl}
            </span>
          ))}
        </div>
      )}

      <div className="keep-card-bottom" onClick={(e) => e.stopPropagation()}>
        <span>{note.updatedAt}</span>
        <div className="keep-card-actions">
          {onToggleArchive && (
            <button
              type="button"
              className="keep-icon-action"
              onClick={() => onToggleArchive(note.id)}
              title={note.archived ? "Keluarkan dari arsip" : "Arsipkan catatan"}
              aria-label={note.archived ? "Keluarkan dari arsip" : "Arsipkan catatan"}
            >
              {note.archived ? "📤" : "📦"}
            </button>
          )}
          <button
            type="button"
            className="keep-icon-action"
            onClick={() => exportNoteToPdf(note)}
            title="Unduh sebagai PDF"
            aria-label="Unduh sebagai PDF"
          >
            📥
          </button>
          <button
            type="button"
            className="keep-icon-action"
            onClick={() => onEdit(note)}
            title="Edit catatan"
            aria-label="Edit catatan"
          >
            ✏️
          </button>
          <button
            type="button"
            className="keep-icon-action"
            onClick={() => onDelete(note.id)}
            title="Hapus catatan"
            aria-label="Hapus catatan"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}
