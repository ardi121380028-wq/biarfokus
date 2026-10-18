"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChecklistItem, KeepNote } from "@/types/domain";
import {
  DEFAULT_LABELS,
  filterNotes,
  loadKeepNotes,
  NOTE_COLORS,
  saveKeepNotes,
  toggleChecklistItem,
} from "@/features/notes/notes-service";

type NotesComponentProps = {
  userId?: string | null;
  onClose?: () => void;
  isPageView?: boolean;
};

export function NotesModal({ userId, onClose, isPageView = false }: NotesComponentProps) {
  const [notes, setNotes] = useState<KeepNote[]>(() => loadKeepNotes(userId));
  const [search, setSearch] = useState("");
  const [activeLabelFilter, setActiveLabelFilter] = useState("Semua");

  // Create state
  const [isCreating, setIsCreating] = useState(false);
  const [createType, setCreateType] = useState<"text" | "checklist">("checklist");
  const [createTitle, setCreateTitle] = useState("");
  const [createContent, setCreateContent] = useState("");
  const [createItems, setCreateItems] = useState<ChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState("");
  const [createColor, setCreateColor] = useState(NOTE_COLORS[0].bg);
  const [createLabels, setCreateLabels] = useState<string[]>([]);
  const [createPinned, setCreatePinned] = useState(false);
  const [newLabelInput, setNewLabelInput] = useState("");
  const [showLabelPicker, setShowLabelPicker] = useState(false);

  // Edit note modal state
  const [editingNote, setEditingNote] = useState<KeepNote | null>(null);
  const [editChecklistText, setEditChecklistText] = useState("");
  const [editLabelInput, setEditLabelInput] = useState("");

  // Collapsed states for completed items in cards
  const [completedCollapsed, setCompletedCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setNotes(loadKeepNotes(userId));
  }, [userId]);

  function persist(updated: KeepNote[]) {
    setNotes(updated);
    saveKeepNotes(updated, userId);
  }

  // All distinct labels from default and notes
  const availableLabels = useMemo(() => {
    const set = new Set<string>(DEFAULT_LABELS);
    notes.forEach((n) => n.labels?.forEach((l) => set.add(l)));
    return Array.from(set);
  }, [notes]);

  function handleAddChecklistItem(toEdit = false) {
    if (toEdit) {
      if (!editChecklistText.trim() || !editingNote) return;
      const newItem: ChecklistItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        text: editChecklistText.trim(),
        done: false,
      };
      setEditingNote({
        ...editingNote,
        items: [...(editingNote.items || []), newItem],
      });
      setEditChecklistText("");
    } else {
      if (!newChecklistText.trim()) return;
      const newItem: ChecklistItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        text: newChecklistText.trim(),
        done: false,
      };
      setCreateItems([...createItems, newItem]);
      setNewChecklistText("");
    }
  }

  function handleRemoveChecklistItem(itemId: string, fromEdit = false) {
    if (fromEdit && editingNote) {
      setEditingNote({
        ...editingNote,
        items: (editingNote.items || []).filter((i) => i.id !== itemId),
      });
    } else {
      setCreateItems(createItems.filter((i) => i.id !== itemId));
    }
  }

  function handleToggleCreateItem(itemId: string) {
    setCreateItems((items) =>
      items.map((it) => (it.id === itemId ? { ...it, done: !it.done } : it))
    );
  }

  function handleToggleEditItem(itemId: string) {
    if (!editingNote) return;
    setEditingNote({
      ...editingNote,
      items: (editingNote.items || []).map((it) =>
        it.id === itemId ? { ...it, done: !it.done } : it
      ),
    });
  }

  function handleCardToggleItem(noteId: string, itemId: string) {
    const updated = toggleChecklistItem(notes, noteId, itemId);
    persist(updated);
  }

  function handleSaveCreate() {
    const hasItems = createType === "checklist" && createItems.length > 0;
    const hasText = createType === "text" && createContent.trim().length > 0;
    const hasTitle = createTitle.trim().length > 0;

    if (!hasTitle && !hasItems && !hasText) {
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

    const newNote: KeepNote = {
      id: `note_${Date.now()}`,
      title: createTitle.trim() || (createType === "checklist" ? "Checklist Baru" : "Catatan"),
      type: createType,
      content: createType === "text" ? createContent.trim() : undefined,
      items: createType === "checklist" ? createItems : undefined,
      color: createColor,
      labels: createLabels,
      pinned: createPinned,
      updatedAt: formattedDate,
    };

    persist([newNote, ...notes]);
    resetCreateForm();
  }

  function resetCreateForm() {
    setIsCreating(false);
    setCreateTitle("");
    setCreateContent("");
    setCreateItems([]);
    setNewChecklistText("");
    setCreateColor(NOTE_COLORS[0].bg);
    setCreateLabels([]);
    setCreatePinned(false);
    setShowLabelPicker(false);
  }

  function handleSaveEdit() {
    if (!editingNote) return;
    const now = new Date();
    const formattedDate = now.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    const updated = notes.map((n) =>
      n.id === editingNote.id ? { ...editingNote, updatedAt: formattedDate } : n
    );
    persist(updated);
    setEditingNote(null);
  }

  function handleDeleteNote(id: string) {
    persist(notes.filter((n) => n.id !== id));
    if (editingNote?.id === id) setEditingNote(null);
  }

  function handleTogglePin(id: string) {
    persist(notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)));
  }

  const filtered = filterNotes(notes, search, activeLabelFilter);
  const pinnedNotes = filtered.filter((n) => n.pinned);
  const otherNotes = filtered.filter((n) => !n.pinned);

  const containerContent = (
    <div className="keep-container">
      {/* Top Header */}
      <div className="keep-header-bar">
        <div className="keep-header-title">
          <span className="keep-icon-badge">📝</span>
          <div>
            <h2>Catatan &amp; Todo List</h2>
            <small>Terhubung dengan kalender &amp; time blocking fokus</small>
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
                onClick={() => setSearch("")}
                className="keep-search-clear"
                aria-label="Hapus pencarian"
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
              aria-label="Tutup Catatan"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Label Filter Chips */}
      <div className="keep-labels-toolbar">
        <span className="keep-toolbar-label">Label:</span>
        <div className="keep-label-chips">
          <button
            type="button"
            className={activeLabelFilter === "Semua" ? "keep-chip active" : "keep-chip"}
            onClick={() => setActiveLabelFilter("Semua")}
          >
            Semua ({notes.length})
          </button>
          {availableLabels.map((label) => {
            const count = notes.filter((n) => n.labels?.includes(label)).length;
            return (
              <button
                key={label}
                type="button"
                className={activeLabelFilter === label ? "keep-chip active" : "keep-chip"}
                onClick={() => setActiveLabelFilter(label)}
              >
                🏷️ {label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Note Creation Bar */}
      <div
        className="keep-create-box"
        style={{
          background: createColor,
          borderColor: createColor !== NOTE_COLORS[0].bg ? "transparent" : undefined,
        }}
      >
        {!isCreating ? (
          <div className="keep-create-placeholder-row" onClick={() => setIsCreating(true)}>
            <span className="keep-create-prompt">Buat catatan baru atau todo list...</span>
            <div className="keep-quick-create-actions">
              <button
                type="button"
                className="keep-quick-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setCreateType("checklist");
                  setIsCreating(true);
                }}
                title="Buat Checklist / Todo"
              >
                ☑️ Checklist
              </button>
              <button
                type="button"
                className="keep-quick-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setCreateType("text");
                  setIsCreating(true);
                }}
                title="Buat Catatan Teks"
              >
                📝 Catatan
              </button>
            </div>
          </div>
        ) : (
          <div className="keep-create-expanded">
            <div className="keep-create-title-row">
              <input
                type="text"
                placeholder="Judul catatan / todo..."
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                className="keep-create-input keep-title-input"
                autoFocus
              />
              <button
                type="button"
                className={createPinned ? "keep-pin-btn active" : "keep-pin-btn"}
                onClick={() => setCreatePinned(!createPinned)}
                title={createPinned ? "Lepaskan sematan" : "Sematkan catatan ke atas"}
              >
                📌
              </button>
            </div>

            {/* Type selector toggle */}
            <div className="keep-type-switcher">
              <button
                type="button"
                className={createType === "checklist" ? "keep-switch-btn active" : "keep-switch-btn"}
                onClick={() => setCreateType("checklist")}
              >
                ☑️ Checklist Todo
              </button>
              <button
                type="button"
                className={createType === "text" ? "keep-switch-btn active" : "keep-switch-btn"}
                onClick={() => setCreateType("text")}
              >
                📝 Teks Bebas
              </button>
            </div>

            {/* Content area: text or checklist */}
            {createType === "text" ? (
              <textarea
                placeholder="Tulis catatan fokus kamu di sini..."
                value={createContent}
                onChange={(e) => setCreateContent(e.target.value)}
                rows={4}
                className="keep-create-input keep-textarea"
              />
            ) : (
              <div className="keep-checklist-create-section">
                {/* Active Items */}
                <div className="keep-checklist-items">
                  {createItems.map((item) => (
                    <div key={item.id} className="keep-checklist-item-row">
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => handleToggleCreateItem(item.id)}
                        className="keep-checkbox"
                      />
                      <span className={item.done ? "keep-item-text done" : "keep-item-text"}>
                        {item.text}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveChecklistItem(item.id)}
                        className="keep-item-delete"
                        title="Hapus item"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Input for new item */}
                <div className="keep-checklist-add-row">
                  <span className="keep-add-icon">＋</span>
                  <input
                    type="text"
                    placeholder="Tambah item todo (tekan Enter)..."
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddChecklistItem();
                      }
                    }}
                    className="keep-checklist-add-input"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddChecklistItem()}
                    disabled={!newChecklistText.trim()}
                    className="keep-add-item-btn"
                  >
                    Tambah
                  </button>
                </div>
              </div>
            )}

            {/* Labels Chip Row */}
            <div className="keep-create-labels-row">
              {createLabels.map((lbl) => (
                <span key={lbl} className="keep-label-tag">
                  🏷️ {lbl}
                  <button
                    type="button"
                    onClick={() => setCreateLabels(createLabels.filter((l) => l !== lbl))}
                  >
                    ✕
                  </button>
                </span>
              ))}

              <button
                type="button"
                className="keep-add-label-btn"
                onClick={() => setShowLabelPicker(!showLabelPicker)}
              >
                ＋ Tambah Label
              </button>

              {showLabelPicker && (
                <div className="keep-label-picker-popover">
                  <span className="popover-title">Pilih atau buat label:</span>
                  <div className="popover-chips">
                    {availableLabels.map((l) => (
                      <button
                        key={l}
                        type="button"
                        className={createLabels.includes(l) ? "popover-chip selected" : "popover-chip"}
                        onClick={() => {
                          if (createLabels.includes(l)) {
                            setCreateLabels(createLabels.filter((x) => x !== l));
                          } else {
                            setCreateLabels([...createLabels, l]);
                          }
                        }}
                      >
                        {createLabels.includes(l) ? "✓ " : ""}{l}
                      </button>
                    ))}
                  </div>
                  <div className="popover-new-label-row">
                    <input
                      type="text"
                      placeholder="Label kustom..."
                      value={newLabelInput}
                      onChange={(e) => setNewLabelInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newLabelInput.trim()) {
                          e.preventDefault();
                          const val = newLabelInput.trim();
                          if (!createLabels.includes(val)) {
                            setCreateLabels([...createLabels, val]);
                          }
                          setNewLabelInput("");
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newLabelInput.trim()) {
                          const val = newLabelInput.trim();
                          if (!createLabels.includes(val)) {
                            setCreateLabels([...createLabels, val]);
                          }
                          setNewLabelInput("");
                        }
                      }}
                    >
                      Tambah
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer with colors & action buttons */}
            <div className="keep-create-footer-bar">
              <div className="keep-color-picker-row">
                {NOTE_COLORS.map((col) => (
                  <button
                    key={col.name}
                    type="button"
                    title={col.name}
                    className={createColor === col.bg ? "keep-color-swatch active" : "keep-color-swatch"}
                    style={{ backgroundColor: col.bg, borderColor: col.border }}
                    onClick={() => setCreateColor(col.bg)}
                  />
                ))}
              </div>

              <div className="keep-footer-btns">
                <button
                  type="button"
                  className="keep-cancel-btn"
                  onClick={resetCreateForm}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="keep-save-btn"
                  onClick={handleSaveCreate}
                >
                  Simpan Catatan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notes Grid */}
      <div className="keep-scroll-body">
        {pinnedNotes.length > 0 && (
          <div className="keep-notes-section">
            <span className="keep-section-header">📌 DISEMATKAN ({pinnedNotes.length})</span>
            <div className="keep-grid">
              {pinnedNotes.map((note) => renderNoteCard(note))}
            </div>
          </div>
        )}

        <div className="keep-notes-section">
          {pinnedNotes.length > 0 && (
            <span className="keep-section-header">LAINNYA ({otherNotes.length})</span>
          )}
          {otherNotes.length > 0 ? (
            <div className="keep-grid">
              {otherNotes.map((note) => renderNoteCard(note))}
            </div>
          ) : (
            pinnedNotes.length === 0 && (
              <div className="keep-empty-placeholder">
                <span className="empty-icon">📝</span>
                <h3>Belum ada catatan</h3>
                <p>Mulai tambahkan to-do list, frog task, atau catatan ide fokus kamu di atas.</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Edit Note Modal Overlay */}
      {editingNote && (
        <div className="keep-edit-modal-backdrop" onClick={() => setEditingNote(null)}>
          <div
            className="keep-edit-modal-card"
            style={{ background: editingNote.color }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="keep-create-title-row">
              <input
                type="text"
                placeholder="Judul catatan..."
                value={editingNote.title}
                onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                className="keep-create-input keep-title-input"
              />
              <button
                type="button"
                className={editingNote.pinned ? "keep-pin-btn active" : "keep-pin-btn"}
                onClick={() => setEditingNote({ ...editingNote, pinned: !editingNote.pinned })}
                title="Sematkan"
              >
                📌
              </button>
            </div>

            {/* Type selector toggle in edit */}
            <div className="keep-type-switcher">
              <button
                type="button"
                className={editingNote.type === "checklist" ? "keep-switch-btn active" : "keep-switch-btn"}
                onClick={() => {
                  if (editingNote.type !== "checklist") {
                    setEditingNote({
                      ...editingNote,
                      type: "checklist",
                      items: editingNote.content
                        ? editingNote.content.split("\n").filter(Boolean).map((line, idx) => ({
                            id: `item_${idx}_${Date.now()}`,
                            text: line.replace(/^[•\-\*\d\.]\s*/, ""),
                            done: false,
                          }))
                        : [],
                    });
                  }
                }}
              >
                ☑️ Checklist Todo
              </button>
              <button
                type="button"
                className={editingNote.type === "text" ? "keep-switch-btn active" : "keep-switch-btn"}
                onClick={() => {
                  if (editingNote.type !== "text") {
                    const contentFromItems = (editingNote.items || [])
                      .map((i) => `${i.done ? "✓" : "•"} ${i.text}`)
                      .join("\n");
                    setEditingNote({
                      ...editingNote,
                      type: "text",
                      content: contentFromItems,
                    });
                  }
                }}
              >
                📝 Teks Bebas
              </button>
            </div>

            {/* Edit Content */}
            {editingNote.type === "text" ? (
              <textarea
                placeholder="Isi catatan..."
                value={editingNote.content || ""}
                onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                rows={6}
                className="keep-create-input keep-textarea"
              />
            ) : (
              <div className="keep-checklist-create-section">
                <div className="keep-checklist-items">
                  {(editingNote.items || []).map((item) => (
                    <div key={item.id} className="keep-checklist-item-row">
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => handleToggleEditItem(item.id)}
                        className="keep-checkbox"
                      />
                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) => {
                          const text = e.target.value;
                          setEditingNote({
                            ...editingNote,
                            items: (editingNote.items || []).map((it) =>
                              it.id === item.id ? { ...it, text } : it
                            ),
                          });
                        }}
                        className={item.done ? "keep-item-edit-input done" : "keep-item-edit-input"}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveChecklistItem(item.id, true)}
                        className="keep-item-delete"
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
                    placeholder="Tambah item baru..."
                    value={editChecklistText}
                    onChange={(e) => setEditChecklistText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddChecklistItem(true);
                      }
                    }}
                    className="keep-checklist-add-input"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddChecklistItem(true)}
                    disabled={!editChecklistText.trim()}
                    className="keep-add-item-btn"
                  >
                    Tambah
                  </button>
                </div>
              </div>
            )}

            {/* Labels in Edit */}
            <div className="keep-create-labels-row">
              {(editingNote.labels || []).map((lbl) => (
                <span key={lbl} className="keep-label-tag">
                  🏷️ {lbl}
                  <button
                    type="button"
                    onClick={() =>
                      setEditingNote({
                        ...editingNote,
                        labels: editingNote.labels.filter((l) => l !== lbl),
                      })
                    }
                  >
                    ✕
                  </button>
                </span>
              ))}
              <div className="popover-new-label-row inline">
                <input
                  type="text"
                  placeholder="+ Label..."
                  value={editLabelInput}
                  onChange={(e) => setEditLabelInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && editLabelInput.trim()) {
                      e.preventDefault();
                      const val = editLabelInput.trim();
                      if (!editingNote.labels.includes(val)) {
                        setEditingNote({
                          ...editingNote,
                          labels: [...editingNote.labels, val],
                        });
                      }
                      setEditLabelInput("");
                    }
                  }}
                />
              </div>
            </div>

            {/* Edit Footer */}
            <div className="keep-create-footer-bar">
              <div className="keep-color-picker-row">
                {NOTE_COLORS.map((col) => (
                  <button
                    key={col.name}
                    type="button"
                    title={col.name}
                    className={editingNote.color === col.bg ? "keep-color-swatch active" : "keep-color-swatch"}
                    style={{ backgroundColor: col.bg, borderColor: col.border }}
                    onClick={() => setEditingNote({ ...editingNote, color: col.bg })}
                  />
                ))}
              </div>

              <div className="keep-footer-btns">
                <button
                  type="button"
                  className="keep-delete-btn"
                  onClick={() => handleDeleteNote(editingNote.id)}
                >
                  🗑️ Hapus
                </button>
                <button
                  type="button"
                  className="keep-save-btn"
                  onClick={handleSaveEdit}
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function renderNoteCard(note: KeepNote) {
    const isChecklist = note.type === "checklist" && Array.isArray(note.items);
    const activeItems = isChecklist ? (note.items || []).filter((i) => !i.done) : [];
    const doneItems = isChecklist ? (note.items || []).filter((i) => i.done) : [];
    const isDoneCollapsed = completedCollapsed[note.id] ?? true;

    return (
      <div
        key={note.id}
        className="keep-note-card"
        style={{ background: note.color }}
        onClick={() => setEditingNote(note)}
      >
        <div className="keep-card-top">
          <h4 className="keep-card-title">{note.title || "Tanpa Judul"}</h4>
          <button
            type="button"
            className={note.pinned ? "keep-pin-btn active" : "keep-pin-btn"}
            onClick={(e) => {
              e.stopPropagation();
              handleTogglePin(note.id);
            }}
            title={note.pinned ? "Lepas sematan" : "Sematkan"}
          >
            📌
          </button>
        </div>

        {/* Card Body */}
        {isChecklist ? (
          <div className="keep-card-checklist" onClick={(e) => e.stopPropagation()}>
            {activeItems.map((item) => (
              <label key={item.id} className="keep-card-item">
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => handleCardToggleItem(note.id, item.id)}
                />
                <span className="keep-card-item-text">{item.text}</span>
              </label>
            ))}

            {doneItems.length > 0 && (
              <div className="keep-card-done-section">
                <button
                  type="button"
                  className="keep-card-done-toggle"
                  onClick={() =>
                    setCompletedCollapsed({
                      ...completedCollapsed,
                      [note.id]: !isDoneCollapsed,
                    })
                  }
                >
                  <span>{isDoneCollapsed ? "▶" : "▼"} {doneItems.length} item diselesaikan</span>
                </button>

                {!isDoneCollapsed && (
                  <div className="keep-card-done-list">
                    {doneItems.map((item) => (
                      <label key={item.id} className="keep-card-item done">
                        <input
                          type="checkbox"
                          checked={true}
                          onChange={() => handleCardToggleItem(note.id, item.id)}
                        />
                        <span className="keep-card-item-text done">{item.text}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="keep-card-text">{note.content || "Catatan kosong..."}</p>
        )}

        {/* Labels tag list */}
        {note.labels && note.labels.length > 0 && (
          <div className="keep-card-tags">
            {note.labels.map((lbl) => (
              <span key={lbl} className="keep-card-tag">
                🏷️ {lbl}
              </span>
            ))}
          </div>
        )}

        {/* Card Bottom / Footer */}
        <div className="keep-card-bottom" onClick={(e) => e.stopPropagation()}>
          <small className="keep-card-updated">{note.updatedAt}</small>
          <div className="keep-card-actions">
            <button
              type="button"
              className="keep-icon-action"
              onClick={() => setEditingNote(note)}
              title="Edit catatan"
            >
              ✏️
            </button>
            <button
              type="button"
              className="keep-icon-action"
              onClick={() => handleDeleteNote(note.id)}
              title="Hapus catatan"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isPageView) {
    return <section className="inner-page keep-page-view">{containerContent}</section>;
  }

  return (
    <div className="modal-backdrop keep-backdrop" role="presentation" onClick={onClose}>
      <section
        className="keep-notes-modal-dialog"
        role="dialog"
        aria-label="Catatan & Todo List"
        onClick={(e) => e.stopPropagation()}
      >
        {containerContent}
      </section>
    </div>
  );
}
