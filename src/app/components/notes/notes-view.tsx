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
    toggleArchive,
    toggleItem,
    createLabel,
  } = useKeepNotes(userId);

  const [search, setSearch] = useState("");
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [editingNote, setEditingNote] = useState<KeepNote | null>(null);

  const filtered = useMemo(
    () => filterNotes(notes, search, activeLabel, showArchived),
    [notes, search, activeLabel, showArchived],
  );

  const pinnedNotes = useMemo(
    () => (showArchived ? [] : filtered.filter((n) => n.pinned)),
    [filtered, showArchived],
  );
  const otherNotes = useMemo(
    () => (showArchived ? filtered : filtered.filter((n) => !n.pinned)),
    [filtered, showArchived],
  );

  const activeNotesCount = useMemo(() => notes.filter((n) => !n.archived).length, [notes]);
  const archivedNotesCount = useMemo(() => notes.filter((n) => n.archived).length, [notes]);

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
        <span className="keep-toolbar-label">Tampilan:</span>
        <div className="keep-label-chips">
          <button
            type="button"
            className={!showArchived && activeLabel === null ? "keep-chip active" : "keep-chip"}
            onClick={() => {
              setShowArchived(false);
              setActiveLabel(null);
            }}
          >
            Semua ({activeNotesCount})
          </button>
          <button
            type="button"
            className={showArchived ? "keep-chip active" : "keep-chip"}
            onClick={() => {
              setShowArchived(!showArchived);
              setActiveLabel(null);
            }}
            title="Lihat catatan yang diarsipkan"
          >
            📦 Arsip ({archivedNotesCount})
          </button>
          {labels.map((lbl) => {
            const count = notes.filter((n) =>
              !n.archived && n.labels?.some((l) => l.toLowerCase() === lbl.toLowerCase()),
            ).length;
            return (
              <button
                key={lbl}
                type="button"
                className={!showArchived && activeLabel === lbl ? "keep-chip active" : "keep-chip"}
                onClick={() => {
                  setShowArchived(false);
                  setActiveLabel(activeLabel === lbl ? null : lbl);
                }}
              >
                🏷️ {lbl} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Note Composer (hidden in archive view) */}
      {!showArchived && (
        <NoteComposer
          labels={labels}
          onCreateNote={createNote}
          onCreateLabel={createLabel}
        />
      )}

      {/* Notes Grid in Scroll Body */}
      <div className="keep-scroll-body">
        {showArchived ? (
          <div className="keep-notes-section">
            <span className="keep-section-header">
              📦 CATATAN DIARSIPKAN ({filtered.length})
            </span>
            {filtered.length > 0 ? (
              <div className="keep-grid">
                {filtered.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={setEditingNote}
                    onTogglePin={togglePin}
                    onToggleArchive={toggleArchive}
                    onToggleItem={toggleItem}
                    onDelete={deleteNote}
                  />
                ))}
              </div>
            ) : (
              <div className="keep-empty-placeholder">
                <span className="empty-icon">📦</span>
                <h3>Belum ada arsip</h3>
                <p>Catatan yang kamu arsipkan akan tersimpan di sini.</p>
              </div>
            )}
          </div>
        ) : (
          <>
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
                      onToggleArchive={toggleArchive}
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
                      onToggleArchive={toggleArchive}
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
          </>
        )}

        {/* Mobile-only bottom completion button */}
        {onClose && (
          <div className="keep-modal-bottom-bar mobile-only">
            <button
              type="button"
              className="keep-modal-done-btn"
              onClick={onClose}
            >
              ✓ Selesai &amp; Tutup Catatan
            </button>
          </div>
        )}
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
          onToggleArchive={toggleArchive}
        />
      )}
    </div>
  );
}
