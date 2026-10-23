"use client";

import { useEffect, useRef, useState } from "react";
import type { ChecklistItem } from "@/types/domain";
import {
  convertDraftType,
  createEmptyDraft,
  createId,
  getNoteBackgroundColor,
  isDraftEmpty,
  NOTE_COLORS,
  type NoteDraft,
} from "@/features/notes/notes-service";
import { exportNoteToPdf } from "@/features/notes/note-format";
import { useAppContext } from "@/app/providers/app-provider";
import { LabelSelect } from "./label-select";
import { RichNoteEditor } from "./rich-note-editor";
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
  const [isFullyExpanded, setIsFullyExpanded] = useState(false);
  const [draft, setDraft] = useState<NoteDraft>(() => createEmptyDraft("checklist"));
  const [newItemText, setNewItemText] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openComposer(type?: "checklist" | "text") {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (type) {
      setDraft(createEmptyDraft(type));
    }
    setIsExpanded(true);
  }

  function closeComposer() {
    setIsFullyExpanded(false);
    setIsExpanded(false);
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    // Retain draft during the 320ms accordion closing animation so text does not vanish abruptly
    closeTimerRef.current = setTimeout(() => {
      setDraft(createEmptyDraft("checklist"));
      setNewItemText("");
      closeTimerRef.current = null;
    }, 320);
  }

  useEffect(() => {
    if (!isExpanded) return;
    const timer = setTimeout(() => {
      setIsFullyExpanded(true);
      titleInputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, [isExpanded]);

  function handleSave() {
    if (isDraftEmpty(draft)) {
      closeComposer();
      return;
    }
    onCreateNote(draft);
    closeComposer();
  }

  useOutsideClick(containerRef, () => {
    if (!isExpanded) return;
    if (!isDraftEmpty(draft)) {
      handleSave();
    } else {
      closeComposer();
    }
  }, isExpanded);

  useEscapeKey(() => {
    if (isExpanded) {
      if (!isDraftEmpty(draft)) handleSave();
      else closeComposer();
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

  const { dark } = useAppContext();
  const effectiveBg = getNoteBackgroundColor(draft.color, dark);

  return (
    <div
      ref={containerRef}
      className={`keep-create-box ${isExpanded ? "is-expanded" : ""} ${
        isFullyExpanded ? "is-fully-expanded" : ""
      }`}
      style={{ background: effectiveBg }}
      data-note-color={draft.color}
    >
      {/* Collapsed Placeholder Row: folds up smoothly with CSS grid */}
      <div
        className="keep-create-collapsed-wrap"
        aria-hidden={isExpanded}
        inert={isExpanded ? true : undefined}
      >
        <div
          className="keep-create-collapsed-inner keep-create-placeholder-row"
          onClick={() => openComposer("text")}
        >
          <span className="keep-create-prompt">
            Tulis catatan fokus atau buat checklist...
          </span>
          <div className="keep-quick-create-actions">
            <button
              type="button"
              className="keep-quick-btn"
              onClick={(e) => {
                e.stopPropagation();
                openComposer("checklist");
              }}
              title="Buat daftar checklist baru untuk tugas"
            >
              ☑️ Checklist Baru
            </button>
            <button
              type="button"
              className="keep-quick-btn"
              onClick={(e) => {
                e.stopPropagation();
                openComposer("text");
              }}
              title="Tulis catatan teks baru"
            >
              ✏️ Tulis Catatan
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Composer: unfolds smoothly with CSS grid & opacity */}
      <div
        className="keep-create-expanded-wrap"
        aria-hidden={!isExpanded}
        inert={!isExpanded ? true : undefined}
      >
        <div className="keep-create-expanded-inner keep-create-expanded">
          <div className="keep-create-title-row">
            <input
              ref={titleInputRef}
              type="text"
              placeholder="Judul catatan..."
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="keep-create-input keep-title-input"
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
              ☑️ Checklist Tugas
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
              📝 Catatan Bebas
            </button>
          </div>

          {draft.type === "text" ? (
            <div className="keep-text-editor-wrap">
              <RichNoteEditor
                content={draft.content || ""}
                onChange={(html) => setDraft((prev) => ({ ...prev, content: html }))}
                minHeight={160}
                onDownloadPdf={() => exportNoteToPdf(draft)}
                showPdfButton={Boolean(draft.title || draft.content)}
              />
            </div>
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
                  placeholder="Tambah item tugas baru (Enter)..."
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

          {/* Label selector: select existing or create new with upward placement */}
          <LabelSelect
            value={draft.labels}
            options={labels}
            onChange={(next) => setDraft({ ...draft, labels: next })}
            onCreateLabel={onCreateLabel}
            placement="up"
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
                onClick={closeComposer}
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
      </div>
    </div>
  );
}
