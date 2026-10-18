"use client";

import { useMemo, useState } from "react";
import type { KeepNote } from "@/types/domain";
import { filterNotes } from "@/features/notes/notes-service";
import { useKeepNotes } from "@/features/notes/use-keep-notes";
import { NoteCard } from "./note-card";
import { NoteComposer } from "./note-composer";
import { NoteEditDialog } from "./note-edit-dialog";
import styles from "./notes.module.css";

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
    <div className={styles.container}>
      {/* Header Bar */}
      <div className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>📝</span>
          <div>
            <h2 className={styles.title}>Catatan &amp; Todo List</h2>
            <span className={styles.subtitle}>
              Bebas distraksi, terhubung langsung dengan time blocking kalender
            </span>
          </div>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Cari catatan atau todo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
            {search && (
              <button
                type="button"
                className={styles.clearSearch}
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
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Tutup catatan"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Label Filter Chips */}
      <div className={styles.labelFilterBar}>
        <button
          type="button"
          className={
            activeLabel === null
              ? `${styles.filterChip} ${styles.filterChipActive}`
              : styles.filterChip
          }
          onClick={() => setActiveLabel(null)}
        >
          Semua <span className={styles.chipCount}>({notes.length})</span>
        </button>
        {labels.map((lbl) => {
          const count = notes.filter((n) =>
            n.labels?.some((l) => l.toLowerCase() === lbl.toLowerCase()),
          ).length;
          return (
            <button
              key={lbl}
              type="button"
              className={
                activeLabel === lbl
                  ? `${styles.filterChip} ${styles.filterChipActive}`
                  : styles.filterChip
              }
              onClick={() => setActiveLabel(activeLabel === lbl ? null : lbl)}
            >
              🏷️ {lbl} <span className={styles.chipCount}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* Note Composer */}
      <NoteComposer
        labels={labels}
        onCreateNote={createNote}
        onCreateLabel={createLabel}
      />

      {/* Notes Grid */}
      {pinnedNotes.length > 0 && (
        <div className={styles.section}>
          <span className={styles.sectionHeader}>
            📌 DISEMATKAN ({pinnedNotes.length})
          </span>
          <div className={styles.grid}>
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

      <div className={styles.section}>
        {pinnedNotes.length > 0 && (
          <span className={styles.sectionHeader}>
            LAINNYA ({otherNotes.length})
          </span>
        )}
        {otherNotes.length > 0 ? (
          <div className={styles.grid}>
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
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>📝</span>
              <h3 className={styles.emptyTitle}>Belum ada catatan</h3>
              <p className={styles.emptyDesc}>
                {search || activeLabel
                  ? "Tidak ada catatan yang cocok dengan filter kamu."
                  : "Mulai buat to-do list, frog task, atau catatan ide fokus kamu di atas."}
              </p>
            </div>
          )
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
        />
      )}
    </div>
  );
}
