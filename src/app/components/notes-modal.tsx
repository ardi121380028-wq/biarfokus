"use client";

import { useEffect, useState } from "react";

export type KeepNote = {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned?: boolean;
  updatedAt: string;
};

const NOTE_COLORS = [
  { name: "Default", bg: "var(--paper)", border: "color-mix(in srgb,var(--ink) 12%,transparent)" },
  { name: "Kuning", bg: "#fef9c3", border: "#fde047" },
  { name: "Hijau", bg: "#dcfce7", border: "#86efac" },
  { name: "Biru", bg: "#e0f2fe", border: "#7dd3fc" },
  { name: "Oranye", bg: "#ffedd5", border: "#fdba74" },
  { name: "Ungu", bg: "#f3e8ff", border: "#d8b4fe" },
  { name: "Merah Muda", bg: "#ffe4e6", border: "#fda4af" },
];

type NotesModalProps = {
  userId?: string | null;
  onClose: () => void;
};

const NOTES_STORAGE_PREFIX = "biarfokus.keep_notes.";

export function NotesModal({ userId, onClose }: NotesModalProps) {
  const storageKey = `${NOTES_STORAGE_PREFIX}${userId || "guest"}`;
  const [notes, setNotes] = useState<KeepNote[]>([]);
  const [search, setSearch] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newColor, setNewColor] = useState(NOTE_COLORS[0].bg);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editColor, setEditColor] = useState(NOTE_COLORS[0].bg);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setNotes(parsed);
        }
      }
    } catch {
      // Ignore storage read error
    }
  }, [storageKey]);

  function persistNotes(updated: KeepNote[]) {
    setNotes(updated);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  }

  function handleCreateNote() {
    if (!newTitle.trim() && !newContent.trim()) {
      setIsCreating(false);
      return;
    }
    const now = new Date();
    const formattedDate = now.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    const noteItem: KeepNote = {
      id: "note_" + Date.now(),
      title: newTitle.trim(),
      content: newContent.trim(),
      color: newColor,
      updatedAt: formattedDate,
    };

    persistNotes([noteItem, ...notes]);
    setNewTitle("");
    setNewContent("");
    setNewColor(NOTE_COLORS[0].bg);
    setIsCreating(false);
  }

  function handleDelete(id: string) {
    persistNotes(notes.filter((n) => n.id !== id));
  }

  function handleTogglePin(id: string) {
    persistNotes(
      notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)),
    );
  }

  function startEdit(note: KeepNote) {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditColor(note.color);
  }

  function saveEdit() {
    if (!editingId) return;
    const now = new Date();
    const formattedDate = now.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    persistNotes(
      notes.map((n) =>
        n.id === editingId
          ? {
              ...n,
              title: editTitle.trim(),
              content: editContent.trim(),
              color: editColor,
              updatedAt: formattedDate,
            }
          : n,
      ),
    );
    setEditingId(null);
  }

  const filteredNotes = notes.filter((n) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
  });

  const pinnedNotes = filteredNotes.filter((n) => n.pinned);
  const otherNotes = filteredNotes.filter((n) => !n.pinned);

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="keep-notes-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Catatan Fokus Google Keep Style"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="keep-modal-header">
          <div className="keep-modal-title-group">
            <span className="keep-modal-icon" aria-hidden="true">📝</span>
            <div>
              <h2>Catatan Fokus</h2>
              <small>Catat ide, ringkasan, atau to-do cepat ala Google Keep</small>
            </div>
          </div>
          <div className="keep-modal-actions">
            <input
              type="search"
              className="keep-search-input"
              placeholder="Cari catatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Cari catatan"
            />
            <button
              type="button"
              className="keep-close-button"
              onClick={onClose}
              aria-label="Tutup catatan"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Input Card: Take a note */}
        <div className="keep-create-card" style={{ backgroundColor: newColor }}>
          {isCreating ? (
            <>
              <input
                type="text"
                className="keep-create-title"
                placeholder="Judul catatan..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                autoFocus
              />
              <textarea
                className="keep-create-content"
                placeholder="Tulis catatan fokus di sini..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={3}
              />
              <div className="keep-create-footer">
                <div className="keep-color-swatches" role="group" aria-label="Warna catatan">
                  {NOTE_COLORS.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      className={newColor === c.bg ? "keep-color-dot selected" : "keep-color-dot"}
                      style={{ backgroundColor: c.bg, borderColor: c.border }}
                      title={c.name}
                      onClick={() => setNewColor(c.bg)}
                    />
                  ))}
                </div>
                <div className="keep-create-buttons">
                  <button
                    type="button"
                    className="secondary-button keep-btn"
                    onClick={() => {
                      setNewTitle("");
                      setNewContent("");
                      setIsCreating(false);
                    }}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    className="keep-save-button"
                    onClick={handleCreateNote}
                  >
                    Simpan
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div
              className="keep-create-placeholder"
              onClick={() => setIsCreating(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setIsCreating(true);
              }}
            >
              <span>✏️ Buat catatan baru...</span>
            </div>
          )}
        </div>

        {/* Edit Note Modal if active */}
        {editingId && (
          <div className="keep-edit-overlay" role="dialog" aria-modal="true">
            <div className="keep-edit-card" style={{ backgroundColor: editColor }}>
              <h3>Edit Catatan</h3>
              <input
                type="text"
                className="keep-create-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Judul..."
              />
              <textarea
                className="keep-create-content"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={5}
                placeholder="Isi catatan..."
              />
              <div className="keep-create-footer">
                <div className="keep-color-swatches">
                  {NOTE_COLORS.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      className={editColor === c.bg ? "keep-color-dot selected" : "keep-color-dot"}
                      style={{ backgroundColor: c.bg, borderColor: c.border }}
                      title={c.name}
                      onClick={() => setEditColor(c.bg)}
                    />
                  ))}
                </div>
                <div className="keep-create-buttons">
                  <button
                    type="button"
                    className="secondary-button keep-btn"
                    onClick={() => setEditingId(null)}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    className="keep-save-button"
                    onClick={saveEdit}
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notes Grid Display */}
        <div className="keep-notes-scroll">
          {notes.length === 0 ? (
            <div className="keep-empty-state">
              <span className="keep-empty-icon">💡</span>
              <p>Belum ada catatan fokus.</p>
              <small>Tulis ide spontan atau hal penting agar pikiranmu tetap tenang dan terarah selama sesi fokus!</small>
            </div>
          ) : (
            <>
              {pinnedNotes.length > 0 && (
                <div className="keep-section">
                  <span className="keep-section-title">📌 DISEMATKAN</span>
                  <div className="keep-grid">
                    {pinnedNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onEdit={startEdit}
                        onDelete={handleDelete}
                        onTogglePin={handleTogglePin}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="keep-section">
                {pinnedNotes.length > 0 && <span className="keep-section-title">LAINNYA</span>}
                <div className="keep-grid">
                  {otherNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onEdit={startEdit}
                      onDelete={handleDelete}
                      onTogglePin={handleTogglePin}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function NoteCard({
  note,
  onEdit,
  onDelete,
  onTogglePin,
}: {
  note: KeepNote;
  onEdit: (n: KeepNote) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
}) {
  return (
    <article
      className="keep-card"
      style={{ backgroundColor: note.color }}
      onClick={() => onEdit(note)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onEdit(note);
      }}
    >
      <div className="keep-card-header">
        {note.title && <strong className="keep-card-title">{note.title}</strong>}
        <button
          type="button"
          className={note.pinned ? "keep-pin-btn active" : "keep-pin-btn"}
          title={note.pinned ? "Lepas sematan" : "Sematkan di atas"}
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(note.id);
          }}
        >
          📌
        </button>
      </div>

      {note.content && <p className="keep-card-body">{note.content}</p>}

      <div className="keep-card-footer">
        <span className="keep-card-date">{note.updatedAt}</span>
        <div className="keep-card-btns" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="keep-icon-btn"
            title="Edit"
            onClick={() => onEdit(note)}
          >
            ✏️
          </button>
          <button
            type="button"
            className="keep-icon-btn delete"
            title="Hapus"
            onClick={() => onDelete(note.id)}
          >
            🗑️
          </button>
        </div>
      </div>
    </article>
  );
}
