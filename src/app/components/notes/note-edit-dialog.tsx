"use client";

import { useEffect, useRef, useState } from "react";
import type { ChecklistItem, KeepNote } from "@/types/domain";
import {
  convertDraftType,
  createId,
  NOTE_COLORS,
  type NoteDraft,
} from "@/features/notes/notes-service";
import {
  exportNoteToPdf,
  insertMarkdownFormatting,
  type MarkdownFormattingType,
} from "@/features/notes/note-format";
import { LabelSelect } from "./label-select";
import { NoteFormatterToolbar } from "./note-formatter-toolbar";
import { NoteContentRenderer } from "./note-content-renderer";
import { useEscapeKey, useOutsideClick } from "@/lib/hooks/use-dismiss";

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
  const [collapsedDone, setCollapsedDone] = useState(true);
  const [isPreview, setIsPreview] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (draft.type === "text" && textareaRef.current && !isPreview) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(220, textareaRef.current.scrollHeight)}px`;
    }
  }, [draft.type, draft.content, isPreview]);

  const activeItems = (draft.items || []).filter((i) => !i.done);
  const doneItems = (draft.items || []).filter((i) => i.done);

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

  function handleFormat(type: MarkdownFormattingType) {
    const el = textareaRef.current;
    const current = draft.content || "";
    const start = el ? el.selectionStart : current.length;
    const end = el ? el.selectionEnd : current.length;
    const { newText, newStart, newEnd } = insertMarkdownFormatting(current, start, end, type);
    setDraft((prev) => ({ ...prev, content: newText }));
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newStart, newEnd);
      }
    });
  }

  function handleExportPdf() {
    exportNoteToPdf({
      ...draft,
      updatedAt: note.updatedAt,
    });
  }

  return (
    <div className="keep-edit-modal-backdrop" role="presentation">
      <div
        ref={cardRef}
        className="keep-edit-modal-card"
        style={{ background: draft.color }}
        role="dialog"
        aria-label="Edit Catatan"
      >
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
            title={draft.pinned ? "Lepaskan sematan" : "Sematkan"}
            aria-label={draft.pinned ? "Lepaskan sematan" : "Sematkan"}
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
            onClick={() => {
              setIsPreview(false);
              setDraft((prev) => convertDraftType(prev, "checklist"));
            }}
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
          <div className="keep-text-editor-wrap">
            <NoteFormatterToolbar
              onFormat={handleFormat}
              isPreview={isPreview}
              onTogglePreview={() => setIsPreview(!isPreview)}
              showPdfButton={true}
              onDownloadPdf={handleExportPdf}
            />

            {isPreview ? (
              <div className="keep-edit-preview-box">
                <NoteContentRenderer content={draft.content} />
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                placeholder="Isi catatan... (Mendukung Heading H1-H5, • Bullet, dan ⊞ Grid)"
                value={draft.content || ""}
                onChange={(e) => {
                  setDraft({ ...draft, content: e.target.value });
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.max(220, e.target.scrollHeight)}px`;
                }}
                className="keep-create-input keep-textarea keep-edit-textarea"
              />
            )}
          </div>
        ) : (
          <div className="keep-checklist-create-section">
            <div className="keep-checklist-items">
              {activeItems.map((item) => (
                <div key={item.id} className="keep-checklist-item-row">
                  <input
                    type="checkbox"
                    checked={false}
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
                    className="keep-item-edit-input"
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
                placeholder="Tambah item baru (Enter)..."
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

            {doneItems.length > 0 && (
              <div className="keep-card-done-section" style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className="keep-card-done-toggle"
                  onClick={() => setCollapsedDone(!collapsedDone)}
                >
                  {collapsedDone ? "▶" : "▼"} {doneItems.length} item diselesaikan
                </button>

                {!collapsedDone && (
                  <div className="keep-card-done-list" style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
                    {doneItems.map((item) => (
                      <div key={item.id} className="keep-checklist-item-row">
                        <input
                          type="checkbox"
                          checked={true}
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
                          className="keep-item-edit-input done"
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
                )}
              </div>
            )}
          </div>
        )}

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
              className="keep-pdf-export-btn"
              onClick={handleExportPdf}
              title="Unduh catatan ini dalam format PDF"
            >
              📥 PDF
            </button>
            <button
              type="button"
              className="keep-delete-btn"
              onClick={() => {
                onDelete(note.id);
                onClose();
              }}
            >
              🗑️ Hapus
            </button>
            <button
              type="button"
              className="keep-save-btn"
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
