"use client";

import { useMemo, useRef, useState } from "react";
import type { CalendarEvent, KeepNote } from "@/types/domain";
import {
  CALENDAR_COLORS,
  DEFAULT_EVENT_COLOR,
  formatDuration,
  validateEventDraft,
  type EventDraft,
} from "@/features/calendar/calendar-service";
import { useEscapeKey, useOutsideClick } from "@/lib/hooks/use-dismiss";
import styles from "./calendar.module.css";

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
    <div className={styles.modalBackdrop} role="presentation">
      <div
        ref={cardRef}
        className={styles.modalCard}
        role="dialog"
        aria-label={editingId ? "Edit Jadwal" : "Buat Jadwal Baru"}
      >
        <div className={styles.modalTopBar}>
          <h3 className={styles.modalTitle}>
            {editingId ? "Edit Jadwal" : "Buat Jadwal Time-Blocking"}
          </h3>
          <button
            type="button"
            className={styles.modalClose}
            onClick={onClose}
            aria-label="Tutup modal"
          >
            ✕
          </button>
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}

        {/* Title Input */}
        <div className={styles.titleInputWrapper}>
          <input
            type="text"
            placeholder="Tambahkan judul jadwal..."
            value={draft.title}
            onChange={(e) => {
              setDraft({ ...draft, title: e.target.value });
              if (error) setError(null);
            }}
            className={styles.eventTitleInput}
            autoFocus
          />
        </div>

        {/* Category: Event vs Task */}
        <div className={styles.categoryTabs}>
          <button
            type="button"
            className={
              draft.category !== "task"
                ? `${styles.catTab} ${styles.catTabActive}`
                : styles.catTab
            }
            onClick={() => setDraft({ ...draft, category: "event" })}
          >
            Acara / Blok Fokus
          </button>
          <button
            type="button"
            className={
              draft.category === "task"
                ? `${styles.catTab} ${styles.catTabActive}`
                : styles.catTab
            }
            onClick={() => setDraft({ ...draft, category: "task" })}
          >
            Tugas / Todo
          </button>
        </div>

        {/* Date and Time Pickers */}
        <div className={styles.fieldRow}>
          <span className={styles.fieldIcon}>🕒</span>
          <div className={styles.fieldContent}>
            <span className={styles.fieldLabel}>Waktu:</span>
            <input
              type="date"
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              className={styles.dateInput}
            />
            <div className={styles.timeRangeRow}>
              <input
                type="time"
                value={draft.startTime}
                onChange={(e) => {
                  setDraft({ ...draft, startTime: e.target.value });
                  if (error) setError(null);
                }}
                className={styles.timeInput}
              />
              <span>—</span>
              <input
                type="time"
                value={draft.endTime}
                onChange={(e) => {
                  setDraft({ ...draft, endTime: e.target.value });
                  if (error) setError(null);
                }}
                className={styles.timeInput}
              />
              {durationText && (
                <span className={styles.durationBadge}>({durationText})</span>
              )}
            </div>
          </div>
        </div>

        {/* Connect to Active Notes / Todo Lists */}
        <div className={styles.fieldRow}>
          <span className={styles.fieldIcon}>📝</span>
          <div className={styles.fieldContent}>
            <span className={styles.fieldLabel}>Hubungkan Catatan / Todo:</span>
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
              className={styles.selectInput}
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
              <div className={styles.linkedPreview}>
                <div className={styles.linkedPreviewHeader}>
                  <strong>Terhubung: {selectedNote.title}</strong>
                  <span>{selectedNote.type === "checklist" ? "Checklist" : "Teks"}</span>
                </div>

                {selectedNote.type === "checklist" && selectedNote.items && (
                  <div className={styles.linkedChecklistItems}>
                    {selectedNote.items.slice(0, 4).map((it) => (
                      <div key={it.id} className={styles.linkedChecklistItem}>
                        <span>{it.done ? "✓" : "○"}</span>
                        <span className={it.done ? styles.linkedItemDone : ""}>
                          {it.text}
                        </span>
                      </div>
                    ))}
                    {selectedNote.items.length > 4 && (
                      <small style={{ color: "var(--muted)" }}>
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
        <div className={styles.fieldRow}>
          <span className={styles.fieldIcon}>≡</span>
          <div className={styles.fieldContent}>
            <span className={styles.fieldLabel}>Deskripsi:</span>
            <textarea
              placeholder="Tambahkan catatan atau deskripsi agenda..."
              value={draft.description || ""}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              rows={2}
              className={styles.descTextarea}
            />
          </div>
        </div>

        {/* Color Palette */}
        <div className={styles.fieldRow}>
          <span className={styles.fieldIcon}>🎨</span>
          <div className={styles.fieldContent}>
            <span className={styles.fieldLabel}>Warna:</span>
            <div className={styles.colorPalette}>
              {CALENDAR_COLORS.map((col) => (
                <button
                  key={col.name}
                  type="button"
                  title={col.name}
                  style={{ backgroundColor: col.hex }}
                  className={
                    draft.color === col.hex
                      ? `${styles.colorDot} ${styles.colorDotSelected}`
                      : styles.colorDot
                  }
                  onClick={() => setDraft({ ...draft, color: col.hex })}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className={styles.modalActions}>
          {editingId && onDelete ? (
            <button
              type="button"
              className={styles.deleteEventBtn}
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

          <div className={styles.modalActionsRight}>
            <button
              type="button"
              className={styles.cancelEventBtn}
              onClick={onClose}
            >
              Batal
            </button>
            <button
              type="button"
              className={styles.saveEventBtn}
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
