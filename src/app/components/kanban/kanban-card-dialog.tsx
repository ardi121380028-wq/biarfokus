"use client";

import { useRef, useState } from "react";
import type {
  KanbanBoardMember,
  KanbanCard,
  KanbanCardAssignee,
  KanbanChecklist,
  KanbanChecklistItem,
  KanbanComment,
  KanbanLabel,
} from "@/types/domain";
import { createId, formatUpdatedAt, LABEL_PALETTE } from "@/features/kanban/kanban-service";
import { useEscapeKey, useOutsideClick } from "@/lib/hooks/use-dismiss";

type KanbanCardDialogProps = {
  card: KanbanCard;
  listTitle: string;
  boardMembers?: KanbanBoardMember[];
  currentUserId?: string | null;
  onUpdate: (updates: Partial<KanbanCard>) => void;
  onDelete: () => void;
  onClose: () => void;
  onSendToFrog?: (card: KanbanCard) => void;
};

export function KanbanCardDialog({
  card,
  listTitle,
  boardMembers = [],
  currentUserId,
  onUpdate,
  onDelete,
  onClose,
  onSendToFrog,
}: KanbanCardDialogProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  useOutsideClick(modalRef, onClose);
  useEscapeKey(onClose);

  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [customPicName, setCustomPicName] = useState("");
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showChecklistPrompt, setShowChecklistPrompt] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState("Checklist");
  const [frogFeedback, setFrogFeedback] = useState<string | null>(null);

  // Quick cover emojis
  const COVER_EMOJIS = ["🐱", "⭐", "🚀", "💡", "🎯", "🔥", "📌", "🏆", "⚠️", "☕"];

  function handleToggleAssignee(member: { id: string; name: string; avatarUrl?: string | null }) {
    const currentAssignees = card.assignees || [];
    const exists = currentAssignees.some((a) => a.id === member.id || a.name.toLowerCase() === member.name.toLowerCase());
    let next: KanbanCardAssignee[];
    if (exists) {
      next = currentAssignees.filter((a) => a.id !== member.id && a.name.toLowerCase() !== member.name.toLowerCase());
    } else {
      next = [...currentAssignees, { id: member.id, name: member.name, avatarUrl: member.avatarUrl || null }];
    }
    onUpdate({
      assignees: next,
      assigneeId: next[0]?.id || null,
      assigneeName: next[0]?.name || null,
      assigneeAvatar: next[0]?.avatarUrl || null,
    });
  }

  function handleAddCustomPic() {
    const trimmed = customPicName.trim();
    if (!trimmed) return;
    const currentAssignees = card.assignees || [];
    const newPic: KanbanCardAssignee = {
      id: createId("pic"),
      name: trimmed,
      avatarUrl: null,
    };
    const next = [...currentAssignees, newPic];
    onUpdate({
      assignees: next,
      assigneeId: next[0]?.id || null,
      assigneeName: next[0]?.name || null,
      assigneeAvatar: next[0]?.avatarUrl || null,
    });
    setCustomPicName("");
  }

  function handleRemoveAssignee(assigneeId: string) {
    const currentAssignees = card.assignees || [];
    const next = currentAssignees.filter((a) => a.id !== assigneeId);
    onUpdate({
      assignees: next,
      assigneeId: next[0]?.id || null,
      assigneeName: next[0]?.name || null,
      assigneeAvatar: next[0]?.avatarUrl || null,
    });
  }

  function handleTitleBlur() {
    const trimmed = title.trim();
    if (trimmed && trimmed !== card.title) {
      onUpdate({ title: trimmed });
    } else {
      setTitle(card.title);
    }
  }

  function handleSaveDescription() {
    onUpdate({ description: description.trim() });
    setIsEditingDesc(false);
  }

  function handleToggleLabel(color: string, defaultName: string) {
    const existing = card.labels.find((l) => l.color === color);
    let nextLabels: KanbanLabel[];
    if (existing) {
      nextLabels = card.labels.filter((l) => l.color !== color);
    } else {
      nextLabels = [...card.labels, { id: createId("lbl"), name: defaultName, color }];
    }
    onUpdate({ labels: nextLabels });
  }

  function handleAddChecklist() {
    const name = newChecklistTitle.trim() || "Checklist";
    const newChecklist: KanbanChecklist = {
      id: createId("chk"),
      title: name,
      items: [],
    };
    onUpdate({ checklists: [...card.checklists, newChecklist] });
    setNewChecklistTitle("Checklist");
    setShowChecklistPrompt(false);
  }

  function handleAddItemToChecklist(checklistId: string, itemText: string) {
    const text = itemText.trim();
    if (!text) return;
    const newItem: KanbanChecklistItem = {
      id: createId("item"),
      text,
      done: false,
    };
    const nextChecklists = card.checklists.map((c) =>
      c.id === checklistId ? { ...c, items: [...c.items, newItem] } : c,
    );
    onUpdate({ checklists: nextChecklists });
  }

  function handleToggleChecklistItem(checklistId: string, itemId: string) {
    const nextChecklists = card.checklists.map((c) => {
      if (c.id !== checklistId) return c;
      return {
        ...c,
        items: c.items.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)),
      };
    });
    onUpdate({ checklists: nextChecklists });
  }

  function handleDeleteChecklistItem(checklistId: string, itemId: string) {
    const nextChecklists = card.checklists.map((c) => {
      if (c.id !== checklistId) return c;
      return {
        ...c,
        items: c.items.filter((i) => i.id !== itemId),
      };
    });
    onUpdate({ checklists: nextChecklists });
  }

  function handleDeleteChecklist(checklistId: string) {
    onUpdate({ checklists: card.checklists.filter((c) => c.id !== checklistId) });
  }

  function handleAddComment() {
    const text = newCommentText.trim();
    if (!text) return;
    const comment: KanbanComment = {
      id: createId("cmt"),
      authorName: "Saya",
      text,
      createdAt: formatUpdatedAt(new Date()),
    };
    onUpdate({ comments: [comment, ...(card.comments || [])] });
    setNewCommentText("");
  }

  function handleSendToFrogClick() {
    if (onSendToFrog) {
      onSendToFrog(card);
      onUpdate({ frog: true });
      setFrogFeedback("Tugas berhasil dikirim ke Eat Your Frog!");
      setTimeout(() => setFrogFeedback(null), 3000);
    }
  }

  return (
    <div className="kanban-dialog-backdrop" role="presentation">
      <div
        ref={modalRef}
        className="kanban-dialog-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kanban-dialog-title"
      >
        {/* Cover Band / Emoji Header */}
        {card.coverColor && (
          <div className="kanban-dialog-cover" style={{ background: card.coverColor }} />
        )}

        {/* Top Header Row */}
        <div className="kanban-dialog-header">
          <div className="kanban-dialog-title-area">
            {card.coverEmoji && <span className="kanban-header-emoji">{card.coverEmoji}</span>}
            <div style={{ flex: 1 }}>
              <input
                id="kanban-dialog-title"
                type="text"
                className="kanban-dialog-title-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTitleBlur();
                }}
                aria-label="Judul kartu"
              />
              <p className="kanban-dialog-crumb">
                dalam kolom <strong>{listTitle}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            className="kanban-dialog-close-btn"
            onClick={onClose}
            aria-label="Tutup detail kartu"
          >
            ✕
          </button>
        </div>

        {frogFeedback && (
          <div className="daily-goal-badge" style={{ animation: "none", margin: "0 0 12px" }}>
            ✓ {frogFeedback}
          </div>
        )}

        {/* Two-column Body */}
        <div className="kanban-dialog-body">
          {/* Main Left Content */}
          <div className="kanban-dialog-main">
            {/* PIC / Anggota Row */}
            {card.assignees && card.assignees.length > 0 && (
              <div className="kanban-dialog-section">
                <span className="kanban-section-title">👥 Anggota / PIC</span>
                <div className="kanban-pic-chips-row">
                  {card.assignees.map((pic) => (
                    <span key={pic.id} className="kanban-pic-chip">
                      {pic.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={pic.avatarUrl} alt={pic.name} className="kanban-pic-chip-img" />
                      ) : (
                        <span className="kanban-pic-chip-placeholder">
                          {(pic.name || "U").charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span className="kanban-pic-chip-name">{pic.name}</span>
                      <button
                        type="button"
                        className="kanban-pic-remove-btn"
                        onClick={() => handleRemoveAssignee(pic.id)}
                        title="Hapus PIC"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    className="kanban-add-mini-btn"
                    onClick={() => setShowMemberPicker(!showMemberPicker)}
                    title="Tambah anggota / PIC"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Member / PIC Picker Popover */}
            {showMemberPicker && (
              <div className="kanban-popover-box kanban-member-popover">
                <div className="kanban-popover-head">
                  <span>Pilih Anggota / PIC</span>
                  <button type="button" onClick={() => setShowMemberPicker(false)}>✕</button>
                </div>

                <div className="kanban-member-picker-list">
                  {boardMembers.length > 0 ? (
                    boardMembers.map((member) => {
                      const isAssigned = (card.assignees || []).some(
                        (a) => a.id === member.userId || a.name.toLowerCase() === (member.displayName || "").toLowerCase(),
                      );
                      const name = member.displayName || (member.userId === currentUserId ? "Kamu" : "Anggota Tim");
                      return (
                        <button
                          key={member.id}
                          type="button"
                          className={`kanban-member-pick-item ${isAssigned ? "selected" : ""}`}
                          onClick={() =>
                            handleToggleAssignee({
                              id: member.userId,
                              name,
                              avatarUrl: member.avatarUrl,
                            })
                          }
                        >
                          <div className="kanban-member-pick-avatar">
                            {member.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={member.avatarUrl} alt={name} />
                            ) : (
                              <span>{name.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <span className="kanban-member-pick-name">{name}</span>
                          {isAssigned && <span className="kanban-member-pick-check">✓</span>}
                        </button>
                      );
                    })
                  ) : (
                    <button
                      type="button"
                      className={`kanban-member-pick-item ${(card.assignees || []).some((a) => a.name === "Kamu") ? "selected" : ""}`}
                      onClick={() =>
                        handleToggleAssignee({
                          id: currentUserId || "user-self",
                          name: "Kamu",
                        })
                      }
                    >
                      <div className="kanban-member-pick-avatar">
                        <span>K</span>
                      </div>
                      <span className="kanban-member-pick-name">Kamu (Pemilik)</span>
                      {(card.assignees || []).some((a) => a.name === "Kamu") && (
                        <span className="kanban-member-pick-check">✓</span>
                      )}
                    </button>
                  )}
                </div>

                {/* Custom PIC input */}
                <div className="kanban-custom-pic-form">
                  <span className="kanban-custom-pic-label">+ Tambah PIC nama lain</span>
                  <div className="kanban-custom-pic-row">
                    <input
                      type="text"
                      placeholder="Nama PIC (cth: Dita, Ardi)..."
                      value={customPicName}
                      onChange={(e) => setCustomPicName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomPic();
                        }
                      }}
                      className="kanban-subtask-input"
                    />
                    <button
                      type="button"
                      className="kanban-primary-btn"
                      onClick={handleAddCustomPic}
                      disabled={!customPicName.trim()}
                    >
                      Pilih
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Labels Row */}
            {card.labels && card.labels.length > 0 && (
              <div className="kanban-dialog-section">
                <span className="kanban-section-title">Labels</span>
                <div className="kanban-dialog-labels">
                  {card.labels.map((lbl) => (
                    <span
                      key={lbl.id}
                      className="kanban-dialog-label-chip"
                      style={{ backgroundColor: lbl.color }}
                      onClick={() => setShowLabelPicker(true)}
                    >
                      {lbl.name}
                    </span>
                  ))}
                  <button
                    type="button"
                    className="kanban-add-mini-btn"
                    onClick={() => setShowLabelPicker(!showLabelPicker)}
                    title="Tambah label"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Label Picker Popover */}
            {showLabelPicker && (
              <div className="kanban-popover-box">
                <div className="kanban-popover-head">
                  <span>Pilih Label</span>
                  <button type="button" onClick={() => setShowLabelPicker(false)}>✕</button>
                </div>
                <div className="kanban-palette-grid">
                  {LABEL_PALETTE.map((item) => {
                    const isSelected = card.labels.some((l) => l.color === item.color);
                    return (
                      <button
                        key={item.color}
                        type="button"
                        className={`kanban-palette-item ${isSelected ? "selected" : ""}`}
                        style={{ backgroundColor: item.color }}
                        onClick={() => handleToggleLabel(item.color, item.defaultName)}
                      >
                        {item.defaultName} {isSelected ? "✓" : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Due Date Indicator */}
            {card.dueDate && (
              <div className="kanban-dialog-section">
                <span className="kanban-section-title">Tenggat Waktu</span>
                <div className="kanban-due-date-row">
                  <input
                    type="checkbox"
                    checked={Boolean(card.dueCompleted)}
                    onChange={(e) => onUpdate({ dueCompleted: e.target.checked })}
                    className="keep-checkbox"
                    id="due-check"
                  />
                  <label htmlFor="due-check" style={{ fontSize: 13, cursor: "pointer" }}>
                    {card.dueDate} {card.dueCompleted ? "(Selesai ✓)" : ""}
                  </label>
                  <button
                    type="button"
                    className="kanban-text-btn"
                    onClick={() => onUpdate({ dueDate: undefined, dueCompleted: false })}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            )}

            {/* Description Section */}
            <div className="kanban-dialog-section">
              <div className="kanban-section-head-row">
                <span className="kanban-section-title">📝 Deskripsi</span>
                {!isEditingDesc && (
                  <button
                    type="button"
                    className="kanban-text-btn"
                    onClick={() => setIsEditingDesc(true)}
                  >
                    {card.description ? "Edit" : "+ Tambah deskripsi"}
                  </button>
                )}
              </div>

              {isEditingDesc ? (
                <div className="kanban-desc-editor">
                  <textarea
                    className="kanban-desc-textarea"
                    placeholder="Tambahkan penjelasan rinci tentang tugas ini..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    autoFocus
                  />
                  <div className="kanban-desc-actions">
                    <button
                      type="button"
                      className="kanban-primary-btn"
                      onClick={handleSaveDescription}
                    >
                      Simpan
                    </button>
                    <button
                      type="button"
                      className="kanban-secondary-btn"
                      onClick={() => {
                        setDescription(card.description || "");
                        setIsEditingDesc(false);
                      }}
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="kanban-desc-preview"
                  onClick={() => setIsEditingDesc(true)}
                  role="button"
                  tabIndex={0}
                >
                  {card.description ? (
                    <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{card.description}</p>
                  ) : (
                    <p className="kanban-desc-placeholder">
                      Klik untuk menambahkan detail deskripsi...
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Checklists Section */}
            {card.checklists.map((chk) => {
              const total = chk.items.length;
              const done = chk.items.filter((i) => i.done).length;
              const pct = total === 0 ? 0 : Math.round((done / total) * 100);

              return (
                <div key={chk.id} className="kanban-dialog-section">
                  <div className="kanban-section-head-row">
                    <span className="kanban-section-title">☑️ {chk.title}</span>
                    <button
                      type="button"
                      className="kanban-text-btn"
                      onClick={() => handleDeleteChecklist(chk.id)}
                    >
                      Hapus
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="kanban-checklist-progress">
                    <span className="progress-pct">{pct}%</span>
                    <div className="progress-bar-track">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${pct}%`,
                          background: pct === 100 ? "#61bd4f" : "var(--blue)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="kanban-checklist-items">
                    {chk.items.map((item) => (
                      <div key={item.id} className="kanban-check-item-row">
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => handleToggleChecklistItem(chk.id, item.id)}
                          className="keep-checkbox"
                          id={`item-${item.id}`}
                        />
                        <label
                          htmlFor={`item-${item.id}`}
                          className={`kanban-check-item-text ${item.done ? "done" : ""}`}
                        >
                          {item.text}
                        </label>
                        <button
                          type="button"
                          className="kanban-del-item-btn"
                          onClick={() => handleDeleteChecklistItem(chk.id, item.id)}
                          title="Hapus sub-tugas"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add item inline */}
                  <div className="kanban-add-item-box">
                    <input
                      type="text"
                      placeholder="Tambah item checklist..."
                      className="kanban-subtask-input"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const target = e.currentTarget;
                          handleAddItemToChecklist(chk.id, target.value);
                          target.value = "";
                        }
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Comments & Activity Section */}
            <div className="kanban-dialog-section">
              <span className="kanban-section-title">💬 Komentar &amp; Aktivitas</span>
              <div className="kanban-comment-input-area">
                <textarea
                  className="kanban-desc-textarea"
                  placeholder="Tulis komentar atau update progress..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  rows={2}
                />
                <button
                  type="button"
                  className="kanban-primary-btn"
                  onClick={handleAddComment}
                  disabled={!newCommentText.trim()}
                  style={{ alignSelf: "flex-start", marginTop: 6 }}
                >
                  Kirim Komentar
                </button>
              </div>

              {card.comments && card.comments.length > 0 && (
                <div className="kanban-comments-list">
                  {card.comments.map((cmt) => (
                    <div key={cmt.id} className="kanban-comment-card">
                      <div className="kanban-comment-meta">
                        <strong>{cmt.authorName}</strong>
                        <span>{cmt.createdAt}</span>
                      </div>
                      <p className="kanban-comment-body">{cmt.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar Actions */}
          <div className="kanban-dialog-sidebar">
            <span className="kanban-sidebar-heading">Tambahkan ke Kartu</span>

            {/* Frog Action (Super prominent integration) */}
            <button
              type="button"
              className="kanban-sidebar-btn frog-action"
              onClick={handleSendToFrogClick}
              title="Kirim kartu ini langsung ke Eat Your Frog"
            >
              🐸 Jadikan Eat Your Frog
            </button>

            <button
              type="button"
              className={`kanban-sidebar-btn ${showMemberPicker ? "active" : ""}`}
              onClick={() => setShowMemberPicker(!showMemberPicker)}
            >
              👥 Anggota / PIC
            </button>

            <button
              type="button"
              className="kanban-sidebar-btn"
              onClick={() => setShowLabelPicker(!showLabelPicker)}
            >
              🏷️ Labels
            </button>

            <button
              type="button"
              className="kanban-sidebar-btn"
              onClick={() => setShowChecklistPrompt(!showChecklistPrompt)}
            >
              ☑️ Checklist
            </button>

            {showChecklistPrompt && (
              <div className="kanban-sidebar-subbox">
                <input
                  type="text"
                  placeholder="Judul checklist..."
                  value={newChecklistTitle}
                  onChange={(e) => setNewChecklistTitle(e.target.value)}
                  className="kanban-subtask-input"
                  autoFocus
                />
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <button
                    type="button"
                    className="kanban-primary-btn"
                    onClick={handleAddChecklist}
                  >
                    Buat
                  </button>
                  <button
                    type="button"
                    className="kanban-secondary-btn"
                    onClick={() => setShowChecklistPrompt(false)}
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              className="kanban-sidebar-btn"
              onClick={() => setShowDatePicker(!showDatePicker)}
            >
              🕒 Tenggat Waktu
            </button>

            {showDatePicker && (
              <div className="kanban-sidebar-subbox">
                <input
                  type="date"
                  value={card.dueDate || ""}
                  onChange={(e) => onUpdate({ dueDate: e.target.value })}
                  className="kanban-subtask-input"
                />
              </div>
            )}

            <button
              type="button"
              className="kanban-sidebar-btn"
              onClick={() => setShowCoverPicker(!showCoverPicker)}
            >
              🎨 Cover Emoji
            </button>

            {showCoverPicker && (
              <div className="kanban-sidebar-subbox">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {COVER_EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      className="kanban-emoji-pill"
                      onClick={() => {
                        onUpdate({ coverEmoji: em });
                        setShowCoverPicker(false);
                      }}
                    >
                      {em}
                    </button>
                  ))}
                  {card.coverEmoji && (
                    <button
                      type="button"
                      className="kanban-text-btn"
                      onClick={() => {
                        onUpdate({ coverEmoji: undefined });
                        setShowCoverPicker(false);
                      }}
                      style={{ width: "100%", marginTop: 4 }}
                    >
                      Hapus Cover
                    </button>
                  )}
                </div>
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <span className="kanban-sidebar-heading">Aksi</span>
              <button
                type="button"
                className="kanban-sidebar-btn danger"
                onClick={() => {
                  if (confirm(`Hapus kartu "${card.title}"?`)) {
                    onDelete();
                  }
                }}
              >
                🗑️ Hapus Kartu
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
