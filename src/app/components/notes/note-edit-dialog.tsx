"use client";

import { useEffect, useRef, useState } from "react";
import type { ChecklistItem, KeepNote } from "@/types/domain";
import {
  createId,
  getNoteBackgroundColor,
  NOTE_COLORS,
  type NoteDraft,
} from "@/features/notes/notes-service";
import { LabelSelect } from "./label-select";
import { useEscapeKey, useOutsideClick } from "@/lib/hooks/use-dismiss";
import { exportNoteToPdf } from "@/features/notes/note-format";
import { useAppContext } from "@/app/providers/app-provider";
import { RichNoteEditor } from "./rich-note-editor";
import { DeleteNoteModal } from "./delete-note-modal";

type NoteEditDialogProps = {
  note: KeepNote;
  labels: string[];
  onSave: (id: string, draft: NoteDraft) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onCreateLabel: (name: string) => string | null;
  onToggleArchive?: (id: string) => void;
};

export function NoteEditDialog({
  note,
  labels,
  onSave,
  onDelete,
  onClose,
  onCreateLabel,
  onToggleArchive,
}: NoteEditDialogProps) {
  const [draft, setDraft] = useState<NoteDraft>(() => ({
    title: note.title,
    type: note.type,
    content: note.content || "",
    items: note.items ? [...note.items] : [],
    color: note.color,
    labels: note.labels ? [...note.labels] : [],
    pinned: Boolean(note.pinned),
  }));

  // Undo & Redo stacks
  const [history, setHistory] = useState<NoteDraft[]>([]);
  const [redoStack, setRedoStack] = useState<NoteDraft[]>([]);

  const [newItemText, setNewItemText] = useState("");
  const [collapsedDone, setCollapsedDone] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [checklistMenuOpen, setChecklistMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const checklistMenuRef = useRef<HTMLDivElement>(null);
  const { dark } = useAppContext();

  const activeItems = (draft.items || []).filter((i) => !i.done);
  const doneItems = (draft.items || []).filter((i) => i.done);

  // Sync if incoming note changes
  useEffect(() => {
    setDraft({
      title: note.title,
      type: note.type,
      content: note.content || "",
      items: note.items ? [...note.items] : [],
      color: note.color,
      labels: note.labels ? [...note.labels] : [],
      pinned: Boolean(note.pinned),
    });
    setHistory([]);
    setRedoStack([]);
    setIsEditingTitle(false);
  }, [note]);

  // Helper to commit changes with undo history
  function commitDraftChange(updater: (prev: NoteDraft) => NoteDraft) {
    setDraft((current) => {
      const next = updater(current);
      setHistory((prevH) => [...prevH.slice(-49), current]);
      setRedoStack([]);
      return next;
    });
  }

  function handleUndo() {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((prevH) => prevH.slice(0, -1));
    setRedoStack((prevR) => [...prevR, draft]);
    setDraft(previous);
  }

  function handleRedo() {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prevR) => prevR.slice(0, -1));
    setHistory((prevH) => [...prevH, draft]);
    setDraft(next);
  }

  // Keyboard shortcuts: Ctrl+Z / Cmd+Z for undo, Ctrl+Y / Cmd+Shift+Z for redo
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const modifier = isMac ? e.metaKey : e.ctrlKey;
      if (!modifier) return;

      if (e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if (e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [history, redoStack, draft]);

  function handleSaveAndClose() {
    const cleanTitle = draft.title.trim();
    if (draft.type === "checklist") {
      const items = (draft.items || []).filter((it) => it.text.trim().length > 0);
      if (!cleanTitle && items.length === 0) {
        onDelete(note.id);
        onClose();
        return;
      }
      onSave(note.id, {
        ...draft,
        title: cleanTitle,
        items,
      });
      onClose();
      return;
    }

    const cleanContent = (draft.content || "").trim();
    if (!cleanTitle && !cleanContent) {
      onDelete(note.id);
      onClose();
      return;
    }
    onSave(note.id, {
      ...draft,
      title: cleanTitle,
      content: cleanContent,
    });
    onClose();
  }

  useOutsideClick(cardRef, handleSaveAndClose);
  useOutsideClick(checklistMenuRef, () => setChecklistMenuOpen(false));
  useEscapeKey(handleSaveAndClose);

  function handleAddItem() {
    const text = newItemText.trim();
    if (!text) return;
    const item: ChecklistItem = { id: createId("item"), text, done: false };
    commitDraftChange((prev) => ({
      ...prev,
      items: [...(prev.items || []), item],
    }));
    setNewItemText("");
  }

  function handleToggleItem(id: string) {
    commitDraftChange((prev) => ({
      ...prev,
      items: (prev.items || []).map((i) => (i.id === id ? { ...i, done: !i.done } : i)),
    }));
  }

  function handleDeleteItem(id: string) {
    commitDraftChange((prev) => ({
      ...prev,
      items: (prev.items || []).filter((i) => i.id !== id),
    }));
  }

  function handleExportPdf() {
    exportNoteToPdf({
      title: draft.title,
      type: draft.type,
      content: draft.content || "",
      items: draft.items,
      labels: draft.labels,
      color: draft.color,
      updatedAt: note.updatedAt,
    });
  }

  const effectiveBg = getNoteBackgroundColor(draft.color, dark);

  return (
    <div className="keep-edit-modal-backdrop" role="presentation">
      <div
        ref={cardRef}
        className="keep-edit-modal-card"
        style={{ background: effectiveBg }}
        data-note-color={draft.color}
        role="dialog"
        aria-label="Edit Catatan"
      >
        {/* Mobile Top Navigation Bar (Like Google Keep - Image 4) */}
        <div className="keep-edit-mobile-header">
          <button
            type="button"
            className="keep-edit-back-btn"
            onClick={handleSaveAndClose}
            aria-label="Kembali dan simpan"
            title="Kembali dan Simpan (←)"
          >
            ←
          </button>
          <div className="keep-edit-mobile-actions">
            <button
              type="button"
              className="keep-edit-icon-btn keep-undo-btn"
              onClick={handleUndo}
              disabled={history.length === 0}
              title="Undo (Ctrl+Z)"
              aria-label="Undo"
            >
              ↶
            </button>
            <button
              type="button"
              className="keep-edit-icon-btn keep-redo-btn"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              title="Redo (Ctrl+Y)"
              aria-label="Redo"
            >
              ↷
            </button>
            <button
              type="button"
              className={draft.pinned ? "keep-pin-btn active" : "keep-pin-btn"}
              onClick={() => setDraft({ ...draft, pinned: !draft.pinned })}
              title={draft.pinned ? "Lepaskan sematan" : "Sematkan"}
              aria-label={draft.pinned ? "Lepaskan sematan" : "Sematkan"}
            >
              📌
            </button>
            {onToggleArchive && (
              <button
                type="button"
                className="keep-edit-icon-btn"
                onClick={() => {
                  onToggleArchive(note.id);
                  onClose();
                }}
                title={note.archived ? "Keluarkan dari arsip" : "Arsipkan catatan ini"}
              >
                {note.archived ? "📤" : "📦"}
              </button>
            )}
            {draft.type === "checklist" && (
              <div className="keep-checklist-menu-anchor" ref={checklistMenuRef}>
                <button
                  type="button"
                  className="keep-edit-icon-btn keep-3dots-btn"
                  onClick={() => setChecklistMenuOpen(!checklistMenuOpen)}
                  title="Opsi checklist"
                  aria-label="Opsi checklist"
                >
                  ⋮
                </button>
                {checklistMenuOpen && (
                  <div className="keep-checklist-dropdown">
                    <button
                      type="button"
                      className="keep-checklist-dropdown-item"
                      onClick={() => {
                        commitDraftChange((prev) => ({
                          ...prev,
                          items: (prev.items || []).filter((i) => !i.done),
                        }));
                        setChecklistMenuOpen(false);
                      }}
                    >
                      🧹 Hapus task yang sudah selesai
                    </button>
                    <button
                      type="button"
                      className="keep-checklist-dropdown-item danger"
                      onClick={() => {
                        commitDraftChange((prev) => ({
                          ...prev,
                          items: [],
                        }));
                        setChecklistMenuOpen(false);
                      }}
                    >
                      🗑️ Hapus semua task
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Title Row: Clean Display by default, tap/click to edit without keyboard jumps */}
        <div className="keep-create-title-row">
          {isEditingTitle ? (
            <input
              type="text"
              placeholder="Judul catatan..."
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setIsEditingTitle(false);
              }}
              className="keep-create-input keep-title-input is-editing"
              autoFocus
            />
          ) : (
            <div
              className="keep-title-display-box"
              onClick={() => setIsEditingTitle(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setIsEditingTitle(true);
                }
              }}
              title="Ketuk untuk mengubah judul catatan"
              aria-label="Judul catatan. Ketuk untuk mengubah judul."
            >
              <h2 className="keep-title-display">
                {draft.title.trim() ? (
                  draft.title
                ) : (
                  <span className="keep-title-placeholder">Judul catatan (ketuk untuk edit)...</span>
                )}
              </h2>
              <span className="keep-title-edit-hint" aria-hidden="true">✏️</span>
            </div>
          )}

          <div className="keep-desktop-title-actions">
            <button
              type="button"
              className="keep-edit-icon-btn keep-undo-btn"
              onClick={handleUndo}
              disabled={history.length === 0}
              title="Undo (Ctrl+Z)"
              aria-label="Undo"
            >
              ↶
            </button>
            <button
              type="button"
              className="keep-edit-icon-btn keep-redo-btn"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              title="Redo (Ctrl+Y)"
              aria-label="Redo"
            >
              ↷
            </button>
            <button
              type="button"
              className={`keep-pin-btn keep-desktop-pin ${draft.pinned ? "active" : ""}`}
              onClick={() => setDraft({ ...draft, pinned: !draft.pinned })}
              title={draft.pinned ? "Lepaskan sematan" : "Sematkan"}
              aria-label={draft.pinned ? "Lepaskan sematan" : "Sematkan"}
            >
              📌
            </button>

            {draft.type === "checklist" && (
              <div className="keep-checklist-menu-anchor" ref={checklistMenuRef}>
                <button
                  type="button"
                  className="keep-edit-icon-btn keep-3dots-btn"
                  onClick={() => setChecklistMenuOpen(!checklistMenuOpen)}
                  title="Opsi checklist"
                  aria-label="Opsi checklist"
                >
                  ⋮
                </button>
                {checklistMenuOpen && (
                  <div className="keep-checklist-dropdown">
                    <button
                      type="button"
                      className="keep-checklist-dropdown-item"
                      onClick={() => {
                        commitDraftChange((prev) => ({
                          ...prev,
                          items: (prev.items || []).filter((i) => !i.done),
                        }));
                        setChecklistMenuOpen(false);
                      }}
                    >
                      🧹 Hapus task yang sudah selesai
                    </button>
                    <button
                      type="button"
                      className="keep-checklist-dropdown-item danger"
                      onClick={() => {
                        commitDraftChange((prev) => ({
                          ...prev,
                          items: [],
                        }));
                        setChecklistMenuOpen(false);
                      }}
                    >
                      🗑️ Hapus semua task
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content Area: Rich Text Editor OR Interactive Checklist */}
        {draft.type === "text" ? (
          <div className="keep-text-editor-wrap">
            <RichNoteEditor
              content={draft.content || ""}
              onChange={(html) => setDraft((prev) => ({ ...prev, content: html }))}
              minHeight={260}
              onDownloadPdf={handleExportPdf}
              showPdfButton={true}
            />
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
                  <div
                    className="keep-card-done-list"
                    style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}
                  >
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
            {onToggleArchive && (
              <button
                type="button"
                className="keep-archive-btn"
                onClick={() => {
                  onToggleArchive(note.id);
                  onClose();
                }}
                title={note.archived ? "Keluarkan dari arsip" : "Arsipkan catatan ini"}
              >
                {note.archived ? "📤 Buka Arsip" : "📦 Arsip"}
              </button>
            )}
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
              onClick={() => setShowDeleteConfirm(true)}
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

      <DeleteNoteModal
        isOpen={showDeleteConfirm}
        title={draft.title}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDelete(note.id);
          onClose();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
