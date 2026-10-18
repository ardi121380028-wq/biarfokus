"use client";

import { useRef, useState } from "react";
import type { ChecklistItem } from "@/types/domain";
import {
  convertDraftType,
  createEmptyDraft,
  createId,
  isDraftEmpty,
  NOTE_COLORS,
  type NoteDraft,
} from "@/features/notes/notes-service";
import { LabelSelect } from "./label-select";
import { useEscapeKey, useOutsideClick } from "@/lib/hooks/use-dismiss";

type NoteComposerProps = {
  labels: string[];
  onCreateNote: (draft: NoteDraft) => void;
  onCreateLabel: (name: string) => string | null;
};

export function NoteComposer({
  labels,
  onCreateNote,
  onCreateLabel,
}: NoteComposerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [draft, setDraft] = useState<NoteDraft>(() => createEmptyDraft("checklist"));
  const [newItemText, setNewItemText] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  function reset() {
    setIsExpanded(false);
    setDraft(createEmptyDraft("checklist"));
    setNewItemText("");
  }

  function handleSave() {
    if (isDraftEmpty(draft)) {
      reset();
      return;
    }
    onCreateNote(draft);
    reset();
  }

  useOutsideClick(containerRef, () => {
    if (!isExpanded) return;
    if (!isDraftEmpty(draft)) {
      handleSave();
    } else {
      reset();
    }
  }, isExpanded);

  useEscapeKey(() => {
    if (isExpanded) {
      if (!isDraftEmpty(draft)) handleSave();
      else reset();
    }
  }, isExpanded);

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
    <div
      ref={containerRef}
      className="keep-create-box"
      style={{ background: draft.color }}
    >
      {!isExpanded ? (
        <div
          className="keep-create-placeholder-row"
          onClick={() => setIsExpanded(true)}
        >
          <span className="keep-create-prompt">
            Buat catatan baru atau to-do list...
          </span>
          <div className="keep-quick-create-actions">
            <button
              type="button"
              className="keep-quick-btn"
              onClick={(e) => {
                e.stopPropagation();
                setDraft(createEmptyDraft("checklist"));
                setIsExpanded(true);
              }}
            >
              ☑️ Checklist
            </button>
            <button
              type="button"
              className="keep-quick-btn"
              onClick={(e) => {
                e.stopPropagation();
                setDraft(createEmptyDraft("text"));
                setIsExpanded(true);
              }}
            >
              📝 Catatan
            </button>
          </div>
        </div>
      ) : (
        <div className="keep-create-expanded">
          <div className="keep-create-title-row">
            <input
              type="text"
              placeholder="Judul catatan..."
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="keep-create-input keep-title-input"
              autoFocus
            />
            <button
              type="button"
              className={draft.pinned ? "keep-pin-btn active" : "keep-pin-btn"}
              onClick={() => setDraft({ ...draft, pinned: !draft.pinned })}
              title={draft.pinned ? "Lepaskan sematan" : "Sematkan ke atas"}
              aria-label={draft.pinned ? "Lepaskan sematan" : "Sematkan ke atas"}
            >
              📌
            </button>
          </div>

          <div className="keep-type-switcher">
            <button
              type="button"
              className={
                draft.type === "checklist"
                  ? "keep-switch-btn active"
                  : "keep-switch-btn"
              }
              onClick={() => setDraft((prev) => convertDraftType(prev, "checklist"))}
            >
              ☑️ Checklist
            </button>
            <button
              type="button"
              className={
                draft.type === "text"
                  ? "keep-switch-btn active"
                  : "keep-switch-btn"
              }
              onClick={() => setDraft((prev) => convertDraftType(prev, "text"))}
            >
              📝 Teks Bebas
            </button>
          </div>

          {draft.type === "text" ? (
            <textarea
              placeholder="Tulis catatan fokus kamu di sini..."
              value={draft.content || ""}
              onChange={(e) => setDraft({ ...draft, content: e.target.value })}
              rows={4}
              className="keep-create-input keep-textarea"
            />
          ) : (
            <div className="keep-checklist-create-section">
              <div className="keep-checklist-items">
                {(draft.items || []).map((item) => (
                  <div key={item.id} className="keep-checklist-item-row">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => handleToggleItem(item.id)}
                      className="keep-checkbox"
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
                          ? "keep-item-edit-input done"
                          : "keep-item-edit-input"
                      }
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="keep-item-delete"
                      aria-label="Hapus item"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="keep-checklist-add-row">
                <span className="keep-add-icon">＋</span>
                <input
                  type="text"
                  placeholder="Tambah item todo (Enter)..."
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddItem();
                    }
                  }}
                  className="keep-checklist-add-input"
                />
                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!newItemText.trim()}
                  className="keep-add-item-btn"
                >
                  Tambah
                </button>
              </div>
            </div>
          )}

          {/* Label selector: select existing or create new */}
          <LabelSelect
            value={draft.labels}
            options={labels}
            onChange={(next) => setDraft({ ...draft, labels: next })}
            onCreateLabel={onCreateLabel}
          />

          <div className="keep-create-footer-bar">
            <div className="keep-color-picker-row">
              {NOTE_COLORS.map((col) => (
                <button
                  key={col.name}
                  type="button"
                  title={col.name}
                  className={
                    draft.color === col.bg
                      ? "keep-color-swatch active"
                      : "keep-color-swatch"
                  }
                  style={{ backgroundColor: col.bg, borderColor: col.border }}
                  onClick={() => setDraft({ ...draft, color: col.bg })}
                />
              ))}
            </div>

            <div className="keep-footer-btns">
              <button
                type="button"
                className="keep-cancel-btn"
                onClick={reset}
              >
                Tutup
              </button>
              <button
                type="button"
                className="keep-save-btn"
                onClick={handleSave}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
