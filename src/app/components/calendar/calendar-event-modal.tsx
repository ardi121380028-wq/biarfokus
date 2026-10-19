"use client";

import { useMemo, useRef, useState } from "react";
import type { KanbanBoard, KeepNote, RecurrenceFrequency } from "@/types/domain";
import {
  CALENDAR_COLORS,
  formatDuration,
  validateEventDraft,
  type EventDraft,
} from "@/features/calendar/calendar-service";
import { useEscapeKey, useOutsideClick } from "@/lib/hooks/use-dismiss";

const DAYS_OF_WEEK = [
  { day: 1, label: "Senin", shortName: "Sen" },
  { day: 2, label: "Selasa", shortName: "Sel" },
  { day: 3, label: "Rabu", shortName: "Rab" },
  { day: 4, label: "Kamis", shortName: "Kam" },
  { day: 5, label: "Jumat", shortName: "Jum" },
  { day: 6, label: "Sabtu", shortName: "Sab" },
  { day: 0, label: "Minggu", shortName: "Min" },
] as const;

type CalendarEventModalProps = {
  initialDraft: EventDraft;
  editingId?: string;
  notes: KeepNote[];
  boards?: KanbanBoard[];
  onSave: (draft: EventDraft, id?: string) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
};

export function CalendarEventModal({
  initialDraft,
  editingId,
  notes,
  boards,
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

  const [linkType, setLinkType] = useState<"none" | "note" | "kanban">(() => {
    if (initialDraft.linkedKanbanCardId) return "kanban";
    if (initialDraft.linkedNoteId) return "note";
    return "none";
  });

  const [selectedBoardId, setSelectedBoardId] = useState<string>(() => {
    if (initialDraft.linkedKanbanBoardId) return initialDraft.linkedKanbanBoardId;
    return boards && boards.length > 0 ? boards[0].id : "";
  });

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

    let linkedNoteTitle = draft.linkedNoteTitle;
    let linkedItemText = draft.linkedItemText;
    let linkedNoteId = draft.linkedNoteId;
    let linkedItemId = draft.linkedItemId;
    let linkedKanbanCardId = draft.linkedKanbanCardId;
    let linkedKanbanBoardId = draft.linkedKanbanBoardId;
    let linkedKanbanBoardTitle = draft.linkedKanbanBoardTitle;

    if (linkType === "note" && selectedNote) {
      linkedNoteTitle = selectedNote.title || "(Catatan)";
      if (draft.linkedItemId && selectedNote.items) {
        const found = selectedNote.items.find((it) => it.id === draft.linkedItemId);
        linkedItemText = found ? found.text : undefined;
      } else {
        linkedItemText = undefined;
      }
      linkedKanbanCardId = undefined;
      linkedKanbanBoardId = undefined;
      linkedKanbanBoardTitle = undefined;
    } else if (linkType === "kanban") {
      linkedNoteId = undefined;
      linkedNoteTitle = undefined;
      linkedItemId = undefined;
      linkedItemText = undefined;
    } else {
      linkedNoteId = undefined;
      linkedNoteTitle = undefined;
      linkedItemId = undefined;
      linkedItemText = undefined;
      linkedKanbanCardId = undefined;
      linkedKanbanBoardId = undefined;
      linkedKanbanBoardTitle = undefined;
    }

    onSave(
      {
        ...draft,
        linkedNoteId,
        linkedNoteTitle,
        linkedItemId,
        linkedItemText,
        linkedKanbanCardId,
        linkedKanbanBoardId,
        linkedKanbanBoardTitle,
      },
      editingId,
    );
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

        {/* Repeat / Recurrence Row */}
        <div className="cal-recurrence-row">
          <span className="cal-field-icon">🔁</span>
          <div className="cal-field-content">
            <span className="cal-field-label">Pengulangan Jadwal:</span>
            <div className="cal-recurrence-controls">
              <select
                value={draft.recurrence?.frequency || "none"}
                onChange={(e) => {
                  const freq = e.target.value as RecurrenceFrequency;
                  if (freq === "none") {
                    setDraft({ ...draft, recurrence: undefined });
                  } else if (freq === "daily") {
                    setDraft({
                      ...draft,
                      recurrence: { frequency: "daily", untilDate: draft.recurrence?.untilDate },
                    });
                  } else if (freq === "weekdays") {
                    setDraft({
                      ...draft,
                      recurrence: {
                        frequency: "weekdays",
                        daysOfWeek: [1, 2, 3, 4, 5],
                        untilDate: draft.recurrence?.untilDate,
                      },
                    });
                  } else if (freq === "custom") {
                    const initialDays =
                      draft.recurrence?.daysOfWeek && draft.recurrence.daysOfWeek.length > 0
                        ? draft.recurrence.daysOfWeek
                        : [1, 2, 3, 4, 5];
                    setDraft({
                      ...draft,
                      recurrence: {
                        frequency: "custom",
                        daysOfWeek: initialDays,
                        untilDate: draft.recurrence?.untilDate,
                      },
                    });
                  }
                  if (error) setError(null);
                }}
                className="cal-select-recurrence"
              >
                <option value="none">Tidak berulang</option>
                <option value="daily">Setiap hari</option>
                <option value="weekdays">Setiap hari kerja (Senin – Jumat)</option>
                <option value="custom">Kustom (Pilih hari sendiri)...</option>
              </select>

              {/* Custom 7-day checkboxes / pills */}
              {draft.recurrence?.frequency === "custom" && (
                <div className="cal-custom-days-box">
                  <div className="cal-days-pills-row">
                    {DAYS_OF_WEEK.map(({ day, label, shortName }) => {
                      const isSelected = draft.recurrence?.daysOfWeek?.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          className={`cal-day-toggle-pill ${isSelected ? "selected" : ""}`}
                          onClick={() => {
                            const currentDays = draft.recurrence?.daysOfWeek || [];
                            let newDays: number[];
                            if (isSelected) {
                              newDays = currentDays.filter((d) => d !== day);
                            } else {
                              newDays = [...currentDays, day].sort((a, b) => a - b);
                            }
                            setDraft({
                              ...draft,
                              recurrence: {
                                frequency: "custom",
                                daysOfWeek: newDays,
                                untilDate: draft.recurrence?.untilDate,
                              },
                            });
                            if (error) setError(null);
                          }}
                          title={`Klik untuk ${isSelected ? "kecualikan" : "aktifkan"} hari ${label}`}
                        >
                          <span className="cal-day-pill-check">{isSelected ? "✓" : "○"}</span>
                          <span>{shortName}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Quick preset buttons */}
                  <div className="cal-days-presets-row">
                    <span className="cal-presets-label">Pilihan Cepat:</span>
                    <button
                      type="button"
                      className="cal-preset-btn"
                      onClick={() => {
                        setDraft({
                          ...draft,
                          recurrence: {
                            frequency: "custom",
                            daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
                            untilDate: draft.recurrence?.untilDate,
                          },
                        });
                        if (error) setError(null);
                      }}
                    >
                      Semua Hari
                    </button>
                    <button
                      type="button"
                      className="cal-preset-btn"
                      onClick={() => {
                        setDraft({
                          ...draft,
                          recurrence: {
                            frequency: "custom",
                            daysOfWeek: [1, 2, 3, 4, 5],
                            untilDate: draft.recurrence?.untilDate,
                          },
                        });
                        if (error) setError(null);
                      }}
                    >
                      Hari Kerja (Sen–Jum)
                    </button>
                    <button
                      type="button"
                      className="cal-preset-btn"
                      onClick={() => {
                        setDraft({
                          ...draft,
                          recurrence: {
                            frequency: "custom",
                            daysOfWeek: [0, 6],
                            untilDate: draft.recurrence?.untilDate,
                          },
                        });
                        if (error) setError(null);
                      }}
                    >
                      Akhir Pekan (Sab–Min)
                    </button>
                  </div>
                  <p className="cal-custom-days-hint">
                    💡 <em>Klik hari yang ingin kamu kecualikan (misal: uncheck Rabu atau Minggu).</em>
                  </p>
                </div>
              )}

              {/* Optional End Date */}
              {draft.recurrence && draft.recurrence.frequency !== "none" && (
                <div className="cal-until-date-row">
                  <span className="cal-subfield-label">Berulang sampai:</span>
                  <input
                    type="date"
                    min={draft.date}
                    value={draft.recurrence.untilDate || ""}
                    onChange={(e) => {
                      setDraft({
                        ...draft,
                        recurrence: {
                          ...draft.recurrence!,
                          untilDate: e.target.value || undefined,
                        },
                      });
                      if (error) setError(null);
                    }}
                    className="cal-date-picker small"
                  />
                  {draft.recurrence.untilDate ? (
                    <button
                      type="button"
                      className="cal-clear-until-btn"
                      onClick={() => {
                        setDraft({
                          ...draft,
                          recurrence: {
                            ...draft.recurrence!,
                            untilDate: undefined,
                          },
                        });
                      }}
                      title="Ubah jadi selamanya"
                    >
                      ✕ Selamanya
                    </button>
                  ) : (
                    <span className="cal-until-hint">(Selamanya)</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Connect to Active Notes or Kanban Task */}
        <div className="cal-linked-note-row">
          <span className="cal-field-icon">🔗</span>
          <div className="cal-field-content">
            <span className="cal-field-label">Hubungkan Sumber Tugas / Agenda:</span>
            <div className="cal-link-type-tabs">
              <button
                type="button"
                className={`cal-link-tab ${linkType === "none" ? "active" : ""}`}
                onClick={() => {
                  setLinkType("none");
                  setDraft({
                    ...draft,
                    linkedNoteId: undefined,
                    linkedNoteTitle: undefined,
                    linkedItemId: undefined,
                    linkedItemText: undefined,
                    linkedKanbanCardId: undefined,
                    linkedKanbanBoardId: undefined,
                    linkedKanbanBoardTitle: undefined,
                  });
                }}
              >
                Mandiri
              </button>
              <button
                type="button"
                className={`cal-link-tab ${linkType === "note" ? "active" : ""}`}
                onClick={() => {
                  setLinkType("note");
                  setDraft({
                    ...draft,
                    linkedKanbanCardId: undefined,
                    linkedKanbanBoardId: undefined,
                    linkedKanbanBoardTitle: undefined,
                  });
                }}
              >
                📝 Catatan &amp; Todo
              </button>
              {boards && boards.length > 0 && (
                <button
                  type="button"
                  className={`cal-link-tab ${linkType === "kanban" ? "active" : ""}`}
                  onClick={() => {
                    setLinkType("kanban");
                    setDraft({
                      ...draft,
                      linkedNoteId: undefined,
                      linkedNoteTitle: undefined,
                      linkedItemId: undefined,
                      linkedItemText: undefined,
                    });
                  }}
                >
                  📋 Kartu Kanban
                </button>
              )}
            </div>

            {/* Note Linking UI */}
            {linkType === "note" && (
              <div className="cal-note-link-wrap">
                <select
                  value={draft.linkedNoteId || ""}
                  onChange={(e) => {
                    const noteId = e.target.value || undefined;
                    setDraft({
                      ...draft,
                      linkedNoteId: noteId,
                      linkedItemId: undefined,
                      linkedItemText: undefined,
                    });
                  }}
                  className="cal-select-note"
                >
                  <option value="">-- Pilih Catatan / Todo --</option>
                  {notes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.type === "checklist" ? "☑️ " : "📝 "}
                      {n.title || "(Tanpa judul)"} {n.labels.length ? `[${n.labels.join(", ")}]` : ""}
                    </option>
                  ))}
                </select>

                {/* If checklist note is chosen, show specific sub-task selector */}
                {selectedNote && selectedNote.type === "checklist" && selectedNote.items && selectedNote.items.length > 0 && (
                  <div className="cal-subtask-picker-row">
                    <span className="cal-field-label">🎯 Pilih Sub-task Spesifik:</span>
                    <select
                      value={draft.linkedItemId || ""}
                      onChange={(e) => {
                        const itemId = e.target.value || undefined;
                        const item = selectedNote.items?.find((it) => it.id === itemId);
                        setDraft({
                          ...draft,
                          linkedItemId: itemId,
                          linkedItemText: item?.text,
                          title: !draft.title.trim() && item?.text ? item.text : draft.title,
                        });
                      }}
                      className="cal-select-note cal-select-subtask"
                    >
                      <option value="">-- Semua Sub-task (Seluruh Catatan) --</option>
                      {selectedNote.items.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.done ? "✓ " : "○ "}
                          {it.text || "(Item tanpa teks)"}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Preview of Connected Note */}
                {selectedNote && (
                  <div className="cal-linked-preview-box">
                    <div className="preview-header">
                      <strong>Terhubung: {selectedNote.title || "(Tanpa judul)"}</strong>
                      <span>{selectedNote.type === "checklist" ? "Checklist / Todo" : "Teks"}</span>
                    </div>

                    {selectedNote.type === "checklist" && selectedNote.items && selectedNote.items.length > 0 ? (
                      <div className="preview-items-list interactive">
                        <span className="preview-help-text">
                          💡 Klik item di bawah untuk langsung menargetkannya ke time-blocking:
                        </span>
                        {selectedNote.items.map((it) => {
                          const isSelected = draft.linkedItemId === it.id;
                          return (
                            <div
                              key={it.id}
                              className={`preview-item-interactive ${isSelected ? "is-selected-subtask" : ""}`}
                              onClick={() => {
                                if (isSelected) {
                                  setDraft({
                                    ...draft,
                                    linkedItemId: undefined,
                                    linkedItemText: undefined,
                                  });
                                } else {
                                  setDraft({
                                    ...draft,
                                    linkedItemId: it.id,
                                    linkedItemText: it.text,
                                    title: !draft.title.trim() ? it.text : draft.title,
                                  });
                                }
                              }}
                              role="button"
                              tabIndex={0}
                              title={isSelected ? "Klik untuk batalkan target spesifik" : "Klik untuk jadikan target jadwal"}
                            >
                              <span className="preview-item-check">{it.done ? "✓" : "○"}</span>
                              <span className={`preview-item-title ${it.done ? "preview-done" : ""}`}>
                                {it.text || "(Item tanpa teks)"}
                              </span>
                              {isSelected && (
                                <span className="preview-selected-tag">🎯 Terpilih</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : selectedNote.content ? (
                      <p className="preview-content-text">{selectedNote.content.slice(0, 160)}</p>
                    ) : null}
                  </div>
                )}
              </div>
            )}

            {/* Kanban Linking UI */}
            {linkType === "kanban" && boards && boards.length > 0 && (
              <div className="cal-kanban-link-box">
                <div className="cal-kanban-selectors-row">
                  <div className="cal-subfield-col">
                    <span className="cal-subfield-label">Papan Proyek:</span>
                    <select
                      value={selectedBoardId}
                      onChange={(e) => {
                        setSelectedBoardId(e.target.value);
                      }}
                      className="cal-select-note"
                    >
                      {boards.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="cal-subfield-col">
                    <span className="cal-subfield-label">Kartu Task Kanban:</span>
                    {(() => {
                      const currentBoard = boards.find((b) => b.id === selectedBoardId) || boards[0];
                      const allCards = currentBoard ? currentBoard.lists.flatMap((l) => l.cards) : [];
                      return (
                        <select
                          value={draft.linkedKanbanCardId || ""}
                          onChange={(e) => {
                            const cardId = e.target.value || undefined;
                            const card = allCards.find((c) => c.id === cardId);
                            setDraft({
                              ...draft,
                              linkedKanbanCardId: cardId,
                              linkedKanbanBoardId: currentBoard?.id,
                              linkedKanbanBoardTitle: currentBoard?.title,
                              title: !draft.title.trim() && card?.title ? card.title : draft.title,
                              date: card?.dueDate ? card.dueDate : draft.date,
                            });
                          }}
                          className="cal-select-note"
                        >
                          <option value="">-- Pilih Kartu Kanban --</option>
                          {allCards.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.coverEmoji ? `${c.coverEmoji} ` : ""}
                              {c.title}
                              {c.dueDate ? ` (Tenggat: ${c.dueDate})` : ""}
                            </option>
                          ))}
                        </select>
                      );
                    })()}
                  </div>
                </div>

                {draft.linkedKanbanCardId && (
                  <div className="cal-linked-preview-box">
                    <div className="preview-header">
                      <strong>Terhubung ke Kanban: {draft.linkedKanbanBoardTitle || "Papan"}</strong>
                      <span>Task Kanban</span>
                    </div>
                    <p className="preview-content-text" style={{ margin: "4px 0 0", fontWeight: 600 }}>
                      📋 {draft.title}
                    </p>
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
