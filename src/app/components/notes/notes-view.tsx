"use client";

import { useMemo, useState } from "react";
import type { KeepNote } from "@/types/domain";
import { filterNotes } from "@/features/notes/notes-service";
import { useKeepNotes } from "@/features/notes/use-keep-notes";
import { NoteCard } from "./note-card";
import { NoteComposer } from "./note-composer";
import { NoteEditDialog } from "./note-edit-dialog";

type NotesViewProps = {
  userId?: string | null;
  onClose?: () => void;
};

export function NotesView({ userId, onClose }: NotesViewProps) {
  const {
    notes,
    labels,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    toggleItem,
    createLabel,
  } = useKeepNotes(userId);

  const [search, setSearch] = useState("");
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<KeepNote | null>(null);

  const filtered = useMemo(
    () => filterNotes(notes, search, activeLabel),
    [notes, search, activeLabel],
  );

  const pinnedNotes = useMemo(() => filtered.filter((n) => n.pinned), [filtered]);
  const otherNotes = useMemo(() => filtered.filter((n) => !n.pinned), [filtered]);

  return (
    <div className="keep-container">
      {/* Header Bar */}
      <div className="keep-header-bar">
        <div className="keep-header-title">
          <span className="keep-icon-badge">📝</span>
          <div>
            <h2>Catatan &amp; Todo List</h2>
            <small>
              Bebas distraksi, terhubung langsung dengan time blocking kalender
            </small>
          </div>
        </div>

        <div className="keep-header-actions">
          <div className="keep-search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Cari catatan atau todo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="keep-search-input"
            />
            {search && (
              <button
                type="button"
                className="keep-search-clear"
                onClick={() => setSearch("")}
                aria-label="Bersihkan pencarian"
              >
                ✕
              </button>
            )}
          </div>

          {onClose && (
            <button
              type="button"
              className="keep-close-button"
              onClick={onClose}
              aria-label="Tutup catatan"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Label Filter Bar */}
      <div className="keep-labels-toolbar">
        <span className="keep-toolbar-label">Label:</span>
        <div className="keep-label-chips">
          <button
            type="button"
            className={activeLabel === null ? "keep-chip active" : "keep-chip"}
            onClick={() => setActiveLabel(null)}
          >
            Semua ({notes.length})
          </button>
          {labels.map((lbl) => {
            const count = notes.filter((n) =>
              n.labels?.some((l) => l.toLowerCase() === lbl.toLowerCase()),
            ).length;
            return (
              <button
                key={lbl}
                type="button"
                className={activeLabel === lbl ? "keep-chip active" : "keep-chip"}
                onClick={() => setActiveLabel(activeLabel === lbl ? null : lbl)}
              >
                🏷️ {lbl} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Note Composer */}
      <NoteComposer
        labels={labels}
        onCreateNote={createNote}
        onCreateLabel={createLabel}
      />

      {/* Notes Grid in Scroll Body */}
      <div className="keep-scroll-body">
        {pinnedNotes.length > 0 && (
          <div className="keep-notes-section">
            <span className="keep-section-header">
              📌 DISEMATKAN ({pinnedNotes.length})
            </span>
            <div className="keep-grid">
              {pinnedNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={setEditingNote}
                  onTogglePin={togglePin}
                  onToggleItem={toggleItem}
                  onDelete={deleteNote}
                />
              ))}
            </div>
          </div>
        )}

        <div className="keep-notes-section">
          {pinnedNotes.length > 0 && (
            <span className="keep-section-header">
              LAINNYA ({otherNotes.length})
            </span>
          )}
          {otherNotes.length > 0 ? (
            <div className="keep-grid">
              {otherNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={setEditingNote}
                  onTogglePin={togglePin}
                  onToggleItem={toggleItem}
                  onDelete={deleteNote}
                />
              ))}
            </div>
          ) : (
            pinnedNotes.length === 0 && (
              <div className="keep-empty-placeholder">
                <span className="empty-icon">📝</span>
                <h3>Belum ada catatan</h3>
                <p>
                  {search || activeLabel
                    ? "Tidak ada catatan yang cocok dengan filter kamu."
                    : "Mulai buat to-do list, frog task, atau catatan ide fokus kamu di atas."}
                </p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Edit Dialog Modal */}
      {editingNote && (
        <NoteEditDialog
          note={editingNote}
          labels={labels}
          onSave={updateNote}
          onDelete={deleteNote}
          onClose={() => setEditingNote(null)}
          onCreateLabel={createLabel}
        />
      )}
    </div>
  );
}
