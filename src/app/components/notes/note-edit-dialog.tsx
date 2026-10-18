"use client";

import { useRef, useState } from "react";
import type { ChecklistItem, KeepNote } from "@/types/domain";
import {
  convertDraftType,
  createId,
  NOTE_COLORS,
  type NoteDraft,
} from "@/features/notes/notes-service";
import { LabelSelect } from "./label-select";
import { useEscapeKey, useOutsideClick } from "@/lib/hooks/use-dismiss";
import styles from "./notes.module.css";

type NoteEditDialogProps = {
  note: KeepNote;
  labels: string[];
  onSave: (id: string, draft: NoteDraft) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onCreateLabel: (name: string) => string | null;
};

export function NoteEditDialog({
  note,
  labels,
  onSave,
  onDelete,
  onClose,
  onCreateLabel,
}: NoteEditDialogProps) {
  const [draft, setDraft] = useState<NoteDraft>({
    title: note.title,
    type: note.type,
    content: note.content || "",
    items: note.items ? [...note.items] : [],
    color: note.color,
    labels: note.labels ? [...note.labels] : [],
    pinned: Boolean(note.pinned),
  });
  const [newItemText, setNewItemText] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);

  function handleSaveAndClose() {
    onSave(note.id, draft);
    onClose();
  }

  useOutsideClick(cardRef, handleSaveAndClose);
  useEscapeKey(handleSaveAndClose);

  function handleAddItem() {
    const text = newItemText.trim();
    if (!text) return;
    const item: ChecklistItem = { id: createId("item"), text, done: false };
    setDraft((prev) => ({
      ...prev,
      items: [...(prev.items || []), item],
    }));
    setNewItemText("");
  }

  function handleToggleItem(id: string) {
    setDraft((prev) => ({
      ...prev,
      items: (prev.items || []).map((i) => (i.id === id ? { ...i, done: !i.done } : i)),
    }));
  }

  function handleDeleteItem(id: string) {
    setDraft((prev) => ({
      ...prev,
      items: (prev.items || []).filter((i) => i.id !== id),
    }));
  }

  return (
    <div className={styles.editOverlay} role="presentation">
      <div
        ref={cardRef}
        className={styles.editDialog}
        style={{ background: draft.color }}
        role="dialog"
        aria-label="Edit Catatan"
      >
        <div className={styles.titleRow}>
          <input
            type="text"
            placeholder="Judul catatan..."
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            className={styles.titleInput}
            autoFocus
          />
          <button
            type="button"
            className={draft.pinned ? `${styles.pinBtn} ${styles.pinBtnActive}` : styles.pinBtn}
            onClick={() => setDraft({ ...draft, pinned: !draft.pinned })}
            title={draft.pinned ? "Lepaskan sematan" : "Sematkan"}
            aria-label={draft.pinned ? "Lepaskan sematan" : "Sematkan"}
          >
            📌
          </button>
        </div>

        <div className={styles.typeSwitcher}>
          <button
            type="button"
            className={
              draft.type === "checklist"
                ? `${styles.typeSwitchBtn} ${styles.typeSwitchBtnActive}`
                : styles.typeSwitchBtn
            }
            onClick={() => setDraft((prev) => convertDraftType(prev, "checklist"))}
          >
            ☑️ Checklist
          </button>
          <button
            type="button"
            className={
              draft.type === "text"
                ? `${styles.typeSwitchBtn} ${styles.typeSwitchBtnActive}`
                : styles.typeSwitchBtn
            }
            onClick={() => setDraft((prev) => convertDraftType(prev, "text"))}
          >
            📝 Teks Bebas
          </button>
        </div>

        {draft.type === "text" ? (
          <textarea
            placeholder="Isi catatan..."
            value={draft.content || ""}
            onChange={(e) => setDraft({ ...draft, content: e.target.value })}
            rows={6}
            className={styles.textArea}
          />
        ) : (
          <div className={styles.checklistSection}>
            <div className={styles.checklistItems}>
              {(draft.items || []).map((item) => (
                <div key={item.id} className={styles.checklistItemRow}>
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => handleToggleItem(item.id)}
                    className={styles.itemCheckbox}
                  />
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => {
                      const text = e.target.value;
                      setDraft((prev) => ({
                        ...prev,
                        items: (prev.items || []).map((i) =>
                          i.id === item.id ? { ...i, text } : i
                        ),
                      }));
                    }}
                    className={
                      item.done
                        ? `${styles.itemTextInput} ${styles.itemDone}`
                        : styles.itemTextInput
                    }
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    className={styles.itemDeleteBtn}
                    aria-label="Hapus item"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className={styles.checklistAddRow}>
              <span className={styles.addIcon}>＋</span>
              <input
                type="text"
                placeholder="Tambah item baru (Enter)..."
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddItem();
                  }
                }}
                className={styles.checklistAddInput}
              />
              <button
                type="button"
                onClick={handleAddItem}
                disabled={!newItemText.trim()}
                className={styles.addItemBtn}
              >
                Tambah
              </button>
            </div>
          </div>
        )}

        <LabelSelect
          value={draft.labels}
          options={labels}
          onChange={(next) => setDraft({ ...draft, labels: next })}
          onCreateLabel={onCreateLabel}
        />

        <div className={styles.composerFooter}>
          <div className={styles.swatchesRow}>
            {NOTE_COLORS.map((col) => (
              <button
                key={col.name}
                type="button"
                title={col.name}
                className={
                  draft.color === col.bg
                    ? `${styles.swatch} ${styles.swatchActive}`
                    : styles.swatch
                }
                style={{ backgroundColor: col.bg, borderColor: col.border }}
                onClick={() => setDraft({ ...draft, color: col.bg })}
              />
            ))}
          </div>

          <div className={styles.composerActions}>
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={() => {
                onDelete(note.id);
                onClose();
              }}
            >
              🗑️ Hapus
            </button>
            <button
              type="button"
              className={styles.saveBtn}
              onClick={handleSaveAndClose}
            >
              Selesai
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
