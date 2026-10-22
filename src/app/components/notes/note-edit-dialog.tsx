"use client";

import { useEffect, useRef, useState } from "react";
import type { KeepNote } from "@/types/domain";
import { NOTE_COLORS, type NoteDraft } from "@/features/notes/notes-service";
import { LabelSelect } from "./label-select";
import { useEscapeKey, useOutsideClick } from "@/lib/hooks/use-dismiss";
import { exportNoteToPdf } from "@/features/notes/note-format";
import { RichNoteEditor } from "./rich-note-editor";

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
  const [draft, setDraft] = useState<NoteDraft>({
    title: note.title,
    type: "text",
    content:
      note.content ||
      (note.items && note.items.length > 0
        ? note.items.map((it) => `• ${it.text}`).join("<br>")
        : ""),
    items: [],
    color: note.color,
    labels: note.labels ? [...note.labels] : [],
    pinned: Boolean(note.pinned),
  });

  const cardRef = useRef<HTMLDivElement>(null);

  // Sync if incoming note changes
  useEffect(() => {
    setDraft({
      title: note.title,
      type: "text",
      content:
        note.content ||
        (note.items && note.items.length > 0
          ? note.items.map((it) => `• ${it.text}`).join("<br>")
          : ""),
      items: [],
      color: note.color,
      labels: note.labels ? [...note.labels] : [],
      pinned: Boolean(note.pinned),
    });
  }, [note]);

  function handleSaveAndClose() {
    const cleanTitle = draft.title.trim();
    const cleanContent = (draft.content || "").trim();

    // If completely empty, delete
    if (!cleanTitle && !cleanContent) {
      onDelete(note.id);
      onClose();
      return;
    }

    onSave(note.id, {
      ...draft,
      type: "text",
      title: cleanTitle,
      content: cleanContent,
    });
    onClose();
  }

  useOutsideClick(cardRef, handleSaveAndClose);
  useEscapeKey(handleSaveAndClose);

  function handleExportPdf() {
    exportNoteToPdf({
      title: draft.title,
      type: "text",
      content: draft.content || "",
      labels: draft.labels,
      color: draft.color,
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
          </div>
        </div>

        {/* Title Row */}
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
            className={`keep-pin-btn keep-desktop-pin ${draft.pinned ? "active" : ""}`}
            onClick={() => setDraft({ ...draft, pinned: !draft.pinned })}
            title={draft.pinned ? "Lepaskan sematan" : "Sematkan"}
            aria-label={draft.pinned ? "Lepaskan sematan" : "Sematkan"}
          >
            📌
          </button>
        </div>

        {/* Rich Note Editor Content */}
        <div className="keep-text-editor-wrap">
          <RichNoteEditor
            content={draft.content || ""}
            onChange={(html) => setDraft((prev) => ({ ...prev, content: html }))}
            minHeight={260}
            onDownloadPdf={handleExportPdf}
            showPdfButton={true}
          />
        </div>

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
