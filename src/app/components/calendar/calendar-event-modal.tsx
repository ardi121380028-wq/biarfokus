"use client";

import { useMemo, useRef, useState } from "react";
import type { CalendarEvent, KeepNote } from "@/types/domain";
import {
  CALENDAR_COLORS,
  formatDuration,
  validateEventDraft,
  type EventDraft,
} from "@/features/calendar/calendar-service";
import { useEscapeKey, useOutsideClick } from "@/lib/hooks/use-dismiss";

type CalendarEventModalProps = {
  initialDraft: EventDraft;
  editingId?: string;
  notes: KeepNote[];
  onSave: (draft: EventDraft, id?: string) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
};

export function CalendarEventModal({
  initialDraft,
  editingId,
  notes,
  onSave,
  onDelete,
  onClose,
}: CalendarEventModalProps) {
  const [draft, setDraft] = useState<EventDraft>(initialDraft);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEscapeKey(onClose);
  useOutsideClick(cardRef, onClose);

  const durationText = useMemo(
    () => formatDuration(draft.startTime, draft.endTime),
    [draft.startTime, draft.endTime],
  );

  const selectedNote = useMemo(
    () => notes.find((n) => n.id === draft.linkedNoteId) || null,
    [notes, draft.linkedNoteId],
  );

  function handleSave() {
    const validationError = validateEventDraft(draft);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Capture linked note title snapshot
    let linkedNoteTitle = draft.linkedNoteTitle;
    if (selectedNote) {
      linkedNoteTitle = selectedNote.title || "(Catatan)";
    }

    onSave({ ...draft, linkedNoteTitle }, editingId);
    onClose();
  }

  return (
    <div className="cal-modal-backdrop" role="presentation">
      <div
        ref={cardRef}
        className="cal-modal-card"
        role="dialog"
        aria-label={editingId ? "Edit Jadwal" : "Buat Jadwal Baru"}
      >
        <div className="cal-modal-top-bar">
          <span className="cal-modal-handle">
            {editingId ? "EDIT JADWAL" : "TIME-BLOCKING JADWAL"}
          </span>
          <button
            type="button"
            className="cal-modal-close"
            onClick={onClose}
            aria-label="Tutup modal"
          >
            ✕
          </button>
        </div>

        {error && <div className="cal-error-banner">{error}</div>}

        {/* Title Input */}
        <div className="cal-input-title-wrapper">
          <input
            type="text"
            placeholder="Tambahkan judul jadwal..."
            value={draft.title}
            onChange={(e) => {
              setDraft({ ...draft, title: e.target.value });
              if (error) setError(null);
            }}
            className="cal-title-input"
            autoFocus
          />
        </div>

        {/* Category: Event vs Task */}
        <div className="cal-category-tabs">
          <button
            type="button"
            className={
              draft.category !== "task"
                ? "cal-cat-tab active"
                : "cal-cat-tab"
            }
            onClick={() => setDraft({ ...draft, category: "event" })}
          >
            Acara / Blok Fokus
          </button>
          <button
            type="button"
            className={
              draft.category === "task"
                ? "cal-cat-tab active"
                : "cal-cat-tab"
            }
            onClick={() => setDraft({ ...draft, category: "task" })}
          >
            Tugas / Todo
          </button>
        </div>

        {/* Date and Time Pickers */}
        <div className="cal-time-pickers-row">
          <span className="cal-field-icon">🕒</span>
          <div className="cal-field-content">
            <span className="cal-field-label">Waktu:</span>
            <input
              type="date"
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              className="cal-date-picker"
            />
            <div className="cal-range-times">
              <input
                type="time"
                value={draft.startTime}
                onChange={(e) => {
                  setDraft({ ...draft, startTime: e.target.value });
                  if (error) setError(null);
                }}
                className="cal-time-picker"
              />
              <span>—</span>
              <input
                type="time"
                value={draft.endTime}
                onChange={(e) => {
                  setDraft({ ...draft, endTime: e.target.value });
                  if (error) setError(null);
                }}
                className="cal-time-picker"
              />
              {durationText && (
                <span className="cal-duration-badge">({durationText})</span>
              )}
            </div>
          </div>
        </div>

        {/* Connect to Active Notes / Todo Lists */}
        <div className="cal-linked-note-row">
          <span className="cal-field-icon">📝</span>
          <div className="cal-field-content">
            <span className="cal-field-label">Hubungkan Catatan / Todo:</span>
            <select
              value={draft.linkedNoteId || ""}
              onChange={(e) => {
                const noteId = e.target.value || undefined;
                setDraft({
                  ...draft,
                  linkedNoteId: noteId,
                  linkedItemId: undefined,
                });
              }}
              className="cal-select-note"
            >
              <option value="">-- Tidak terhubung / Mandiri --</option>
              {notes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.type === "checklist" ? "☑️ " : "📝 "}
                  {n.title || "(Tanpa judul)"} {n.labels.length ? `[${n.labels.join(", ")}]` : ""}
                </option>
              ))}
            </select>

            {/* Preview of Connected Note */}
            {selectedNote && (
              <div className="cal-linked-preview-box">
                <div className="preview-header">
                  <strong>Terhubung: {selectedNote.title}</strong>
                  <span>{selectedNote.type === "checklist" ? "Checklist" : "Teks"}</span>
                </div>

                {selectedNote.type === "checklist" && selectedNote.items && (
                  <div className="preview-items-list">
                    {selectedNote.items.slice(0, 4).map((it) => (
                      <div key={it.id} className="preview-item">
                        <span>{it.done ? "✓" : "○"}</span>
                        <span className={it.done ? "preview-done" : ""}>
                          {it.text}
                        </span>
                      </div>
                    ))}
                    {selectedNote.items.length > 4 && (
                      <small className="preview-more">
                        +{selectedNote.items.length - 4} item lainnya...
                      </small>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Description textarea */}
        <div className="cal-desc-row">
          <span className="cal-field-icon">≡</span>
          <div className="cal-field-content">
            <span className="cal-field-label">Deskripsi:</span>
            <textarea
              placeholder="Tambahkan catatan atau deskripsi agenda..."
              value={draft.description || ""}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              rows={2}
              className="cal-desc-input"
            />
          </div>
        </div>

        {/* Color Palette */}
        <div className="cal-color-row">
          <span className="cal-field-icon">🎨</span>
          <div className="cal-field-content">
            <span className="cal-field-label">Warna:</span>
            <div className="cal-color-palette">
              {CALENDAR_COLORS.map((col) => (
                <button
                  key={col.name}
                  type="button"
                  title={col.name}
                  style={{ backgroundColor: col.hex }}
                  className={
                    draft.color === col.hex
                      ? "cal-color-swatch selected"
                      : "cal-color-swatch"
                  }
                  onClick={() => setDraft({ ...draft, color: col.hex })}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="cal-modal-actions-bar">
          {editingId && onDelete ? (
            <button
              type="button"
              className="cal-delete-btn"
              onClick={() => {
                onDelete(editingId);
                onClose();
              }}
            >
              🗑️ Hapus Jadwal
            </button>
          ) : (
            <div />
          )}

          <div className="cal-action-btns-right">
            <button
              type="button"
              className="cal-btn-cancel"
              onClick={onClose}
            >
              Batal
            </button>
            <button
              type="button"
              className="cal-btn-save"
              disabled={!draft.title.trim()}
              onClick={handleSave}
            >
              Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
