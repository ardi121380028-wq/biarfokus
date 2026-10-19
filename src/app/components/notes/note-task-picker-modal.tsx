"use client";

import { useMemo, useRef, useState } from "react";
import type { KeepNote, Task } from "@/types/domain";
import { useEscapeKey, useOutsideClick } from "@/lib/hooks/use-dismiss";

type NoteTaskPickerModalProps = {
  notes: KeepNote[];
  tasks: Task[];
  onSelect: (item: {
    title: string;
    linkedNoteId: string;
    linkedNoteTitle: string;
    linkedItemId?: string;
    linkedItemText?: string;
  }) => void;
  onClose: () => void;
  onOpenNotes?: () => void;
};

export function NoteTaskPickerModal({
  notes,
  tasks,
  onSelect,
  onClose,
  onOpenNotes,
}: NoteTaskPickerModalProps) {
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEscapeKey(onClose);
  useOutsideClick(modalRef, onClose);

  // Set of linked item ids already in active tasks
  const activeLinkedItemIds = useMemo(() => {
    const ids = new Set<string>();
    for (const t of tasks) {
      if (!t.done && t.linkedItemId) {
        ids.add(t.linkedItemId);
      }
    }
    return ids;
  }, [tasks]);

  const activeLinkedNoteIds = useMemo(() => {
    const ids = new Set<string>();
    for (const t of tasks) {
      if (!t.done && t.linkedNoteId && !t.linkedItemId) {
        ids.add(t.linkedNoteId);
      }
    }
    return ids;
  }, [tasks]);

  // Filter notes based on query
  const filteredNotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) => {
      const titleMatch = n.title.toLowerCase().includes(q);
      const contentMatch = (n.content ?? "").toLowerCase().includes(q);
      const itemsMatch = (n.items ?? []).some((it) => it.text.toLowerCase().includes(q));
      const labelsMatch = (n.labels ?? []).some((l) => l.toLowerCase().includes(q));
      return titleMatch || contentMatch || itemsMatch || labelsMatch;
    });
  }, [notes, search]);

  function handlePickItem(note: KeepNote, item: { id: string; text: string }) {
    if (!item.text.trim()) return;
    onSelect({
      title: item.text.trim(),
      linkedNoteId: note.id,
      linkedNoteTitle: note.title || "(Catatan)",
      linkedItemId: item.id,
      linkedItemText: item.text.trim(),
    });
    setFeedback(`"${item.text.slice(0, 28)}..." ditambahkan ke Eat Your Frog!`);
    setTimeout(() => {
      onClose();
    }, 450);
  }

  function handlePickTextNote(note: KeepNote) {
    const title = note.title.trim() || note.content?.trim().slice(0, 60) || "(Catatan)";
    onSelect({
      title,
      linkedNoteId: note.id,
      linkedNoteTitle: note.title || "(Catatan)",
    });
    setFeedback(`"${title.slice(0, 28)}..." ditambahkan ke Eat Your Frog!`);
    setTimeout(() => {
      onClose();
    }, 450);
  }

  return (
    <div className="note-picker-backdrop" role="presentation">
      <div
        ref={modalRef}
        className="note-picker-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="note-picker-title"
      >
        <div className="note-picker-header">
          <div>
            <h3 id="note-picker-title">Ambil Tugas dari Catatan</h3>
            <p>Pilih catatan atau sub-task checklist untuk dijadikan target Eat Your Frog hari ini.</p>
          </div>
          <button
            type="button"
            className="note-picker-close"
            onClick={onClose}
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        <input
          type="search"
          className="note-picker-search"
          placeholder="Cari catatan atau checklist..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />

        {feedback && (
          <div className="daily-goal-badge" style={{ animation: "none", marginBottom: 4 }}>
            ✓ {feedback}
          </div>
        )}

        <div className="note-picker-list">
          {notes.length === 0 ? (
            <div className="note-picker-empty">
              <p>Belum ada catatan di BiarFokus.</p>
              {onOpenNotes && (
                <button
                  type="button"
                  className="cal-today-pill-btn"
                  style={{ marginTop: 10 }}
                  onClick={() => {
                    onClose();
                    onOpenNotes();
                  }}
                >
                  📝 Buka Catatan untuk Buat Baru
                </button>
              )}
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="note-picker-empty">
              <p>Tidak ada catatan yang cocok dengan &quot;{search}&quot;.</p>
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isChecklist = note.type === "checklist" && Array.isArray(note.items);
              const uncompletedItems = isChecklist ? (note.items || []).filter((i) => !i.done) : [];
              const isTextNoteLinked = activeLinkedNoteIds.has(note.id);

              return (
                <div
                  key={note.id}
                  className="note-picker-card"
                  style={{ backgroundColor: note.color }}
                >
                  <div className="note-picker-card-head">
                    <h4 className="note-picker-card-title">
                      {note.title || "(Tanpa judul)"}
                    </h4>
                    {note.labels && note.labels.length > 0 && (
                      <div className="keep-card-tags" style={{ margin: 0 }}>
                        {note.labels.slice(0, 2).map((lbl) => (
                          <span key={lbl} className="keep-card-tag" style={{ fontSize: 10 }}>
                            #{lbl}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {isChecklist ? (
                    <div className="note-picker-items">
                      {uncompletedItems.length === 0 ? (
                        <p style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0" }}>
                          Semua item checklist sudah selesai ✓
                        </p>
                      ) : (
                        uncompletedItems.map((item) => {
                          const isAlreadyInFrog = activeLinkedItemIds.has(item.id);
                          return (
                            <div
                              key={item.id}
                              className="note-picker-item-row"
                              onClick={() => {
                                if (!isAlreadyInFrog) handlePickItem(note, item);
                              }}
                              role="button"
                              tabIndex={0}
                            >
                              <span className="preview-item-check">○</span>
                              <span className="note-picker-item-text">{item.text}</span>
                              {isAlreadyInFrog ? (
                                <span className="note-picker-already-added">✓ Ada di Frog</span>
                              ) : (
                                <button
                                  type="button"
                                  className="note-picker-add-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePickItem(note, item);
                                  }}
                                >
                                  + Frog
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <p className="preview-text-snippet" style={{ flex: 1 }}>
                        {note.content ? note.content.slice(0, 80) : "(Catatan teks)"}
                      </p>
                      {isTextNoteLinked ? (
                        <span className="note-picker-already-added">✓ Ada di Frog</span>
                      ) : (
                        <button
                          type="button"
                          className="note-picker-add-btn"
                          onClick={() => handlePickTextNote(note)}
                        >
                          + Frog
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
