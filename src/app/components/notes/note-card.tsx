"use client";

import { useState } from "react";
import type { KeepNote } from "@/types/domain";
import styles from "./notes.module.css";

type NoteCardProps = {
  note: KeepNote;
  onEdit: (note: KeepNote) => void;
  onTogglePin: (id: string) => void;
  onToggleItem: (noteId: string, itemId: string) => void;
  onDelete: (id: string) => void;
};

export function NoteCard({
  note,
  onEdit,
  onTogglePin,
  onToggleItem,
  onDelete,
}: NoteCardProps) {
  const [collapsedDone, setCollapsedDone] = useState(true);

  const isChecklist = note.type === "checklist" && Array.isArray(note.items);
  const activeItems = isChecklist ? (note.items || []).filter((i) => !i.done) : [];
  const doneItems = isChecklist ? (note.items || []).filter((i) => i.done) : [];

  return (
    <div
      className={styles.card}
      style={{ background: note.color }}
      onClick={() => onEdit(note)}
    >
      <div className={styles.cardTop}>
        <h4 className={styles.cardTitle}>{note.title || "(Tanpa judul)"}</h4>
        <button
          type="button"
          className={note.pinned ? `${styles.pinBtn} ${styles.pinBtnActive}` : styles.pinBtn}
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
        <div className={styles.cardChecklist} onClick={(e) => e.stopPropagation()}>
          {activeItems.map((item) => (
            <label key={item.id} className={styles.cardItem}>
              <input
                type="checkbox"
                checked={false}
                onChange={() => onToggleItem(note.id, item.id)}
              />
              <span className={styles.cardItemText}>{item.text}</span>
            </label>
          ))}

          {doneItems.length > 0 && (
            <div className={styles.cardDoneSection}>
              <button
                type="button"
                className={styles.cardDoneToggle}
                onClick={() => setCollapsedDone(!collapsedDone)}
              >
                {collapsedDone ? "▶" : "▼"} {doneItems.length} item diselesaikan
              </button>

              {!collapsedDone && (
                <div className={styles.cardDoneList}>
                  {doneItems.map((item) => (
                    <label key={item.id} className={styles.cardItem}>
                      <input
                        type="checkbox"
                        checked={true}
                        onChange={() => onToggleItem(note.id, item.id)}
                      />
                      <span className={`${styles.cardItemText} ${styles.cardItemTextDone}`}>
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
        <p className={styles.cardText}>{note.content || "Catatan kosong..."}</p>
      )}

      {note.labels && note.labels.length > 0 && (
        <div className={styles.cardTags}>
          {note.labels.map((lbl) => (
            <span key={lbl} className={styles.cardTag}>
              🏷️ {lbl}
            </span>
          ))}
        </div>
      )}

      <div className={styles.cardBottom} onClick={(e) => e.stopPropagation()}>
        <span>{note.updatedAt}</span>
        <div className={styles.cardActions}>
          <button
            type="button"
            className={styles.cardIconBtn}
            onClick={() => onEdit(note)}
            title="Edit catatan"
            aria-label="Edit catatan"
          >
            ✏️
          </button>
          <button
            type="button"
            className={styles.cardIconBtn}
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
