"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  KanbanBoardMember,
  KanbanCard,
  KanbanCardAssignee,
  KanbanChecklist,
  KanbanChecklistItem,
  KanbanComment,
  KanbanLabel,
} from "@/types/domain";
import {
  createId,
  formatUpdatedAt,
  LABEL_PALETTE,
  resolveBoardAvailableLabels,
  saveCustomBoardLabels,
  saveDeletedBoardLabel,
  unmarkDeletedBoardLabel,
  isLightHexColor,
} from "@/features/kanban/kanban-service";
import { toISODate } from "@/features/calendar/calendar-service";
import { useEscapeKey, useOutsideClick } from "@/lib/hooks/use-dismiss";
import { KanbanConfirmModal } from "./kanban-confirm-modal";

type KanbanCardDialogProps = {
  card: KanbanCard;
  listTitle: string;
  currentListId?: string;
  boardLists?: { id: string; title: string }[];
  onMoveToList?: (destListId: string) => void;
  onMoveCardPosition?: (listId: string, cardId: string, direction: "top" | "up" | "down" | "bottom") => void;
  boardMembers?: KanbanBoardMember[];
  currentUserId?: string | null;
  boardId?: string;
  boardLabels?: KanbanLabel[];
  onUpdateBoardLabels?: (labels: KanbanLabel[]) => void;
  onDeleteBoardLabel?: (labelId: string, labelName?: string) => void;
  readOnly?: boolean;
  onUpdate: (updates: Partial<KanbanCard>) => void;
  onArchive?: () => void;
  onRestore?: () => void;
  onDelete?: () => void;
  onClose: () => void;
  onSendToFrog?: (card: KanbanCard) => void;
  onScheduleToCalendar?: (card: KanbanCard) => void;
  isLight?: boolean;
};

const DEFAULT_LABEL_COLORS = [
  "#61bd4f",
  "#f2d600",
  "#ff9f1a",
  "#eb5a46",
  "#c377e0",
  "#0079bf",
  "#00c2e0",
  "#ff78cb",
  "#51e898",
  "#344563",
];

export function KanbanCardDialog({
  card,
  listTitle,
  currentListId,
  boardLists,
  onMoveToList,
  onMoveCardPosition,
  boardMembers = [],
  currentUserId,
  boardId,
  boardLabels,
  onUpdateBoardLabels,
  onDeleteBoardLabel,
  readOnly = false,
  isLight = false,
  onUpdate,
  onArchive,
  onRestore,
  onDelete,
  onClose,
  onSendToFrog,
  onScheduleToCalendar,
}: KanbanCardDialogProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [title, setTitle] = useState(card.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [description, setDescription] = useState(card.description || "");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descSaveStatus, setDescSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const descDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const descriptionRef = useRef(card.description || "");
  const cardDescriptionRef = useRef(card.description || "");
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const flushDescriptionSave = useCallback(() => {
    if (descDebounceRef.current) {
      clearTimeout(descDebounceRef.current);
      descDebounceRef.current = null;
    }
    const currentVal = descriptionRef.current;
    const trimmed = currentVal.trim();
    if (trimmed !== (cardDescriptionRef.current || "").trim()) {
      onUpdateRef.current({ description: trimmed });
      cardDescriptionRef.current = trimmed;
      setDescSaveStatus("saved");
      setTimeout(() => setDescSaveStatus("idle"), 2500);
      return true;
    }
    return false;
  }, []);

  const handleSafeClose = useCallback(() => {
    flushDescriptionSave();
    onClose();
  }, [flushDescriptionSave, onClose]);

  useOutsideClick(modalRef, handleSafeClose, !showDeleteConfirm);
  useEscapeKey(handleSafeClose, !showDeleteConfirm);

  // Sync state if card prop changes, but ONLY when user is NOT actively editing
  useEffect(() => {
    cardDescriptionRef.current = card.description || "";
    if (!isEditingDesc) {
      setDescription(card.description || "");
      descriptionRef.current = card.description || "";
    }
  }, [card.description, isEditingDesc]);

  // Flush on unmount so nothing is ever lost
  useEffect(() => {
    return () => {
      if (descDebounceRef.current) {
        clearTimeout(descDebounceRef.current);
        descDebounceRef.current = null;
      }
      const trimmed = descriptionRef.current.trim();
      if (trimmed !== (cardDescriptionRef.current || "").trim()) {
        onUpdateRef.current({ description: trimmed });
      }
    };
  }, []);
  const [newCommentText, setNewCommentText] = useState("");
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [customPicName, setCustomPicName] = useState("");
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showChecklistPrompt, setShowChecklistPrompt] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState("Checklist");
  const [frogFeedback, setFrogFeedback] = useState<string | null>(null);
  const [calendarFeedback, setCalendarFeedback] = useState<string | null>(null);

  // Mobile quick action inline panel state
  const [activeMobilePanel, setActiveMobilePanel] = useState<"date" | "move" | "pic" | "label" | "checklist" | "cover" | null>(null);

  // Modern Move Column dropdown state
  const [moveMenuOpen, setMoveMenuOpen] = useState(false);
  const moveMenuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(moveMenuRef, () => setMoveMenuOpen(false), moveMenuOpen);

  // Member / PIC popover dismiss on click outside & escape
  const memberPickerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showMemberPicker) return;
    function handlePointerDown(e: PointerEvent) {
      if (memberPickerRef.current && !memberPickerRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (target.closest(".kanban-member-trigger-btn")) return;
        setShowMemberPicker(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [showMemberPicker]);
  useEscapeKey(() => setShowMemberPicker(false), showMemberPicker);

  // Label popover dismiss on click outside & escape
  const labelPickerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showLabelPicker) return;
    function handlePointerDown(e: PointerEvent) {
      if (labelPickerRef.current && !labelPickerRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (target.closest(".kanban-label-trigger-btn, .kanban-dialog-label-chip-text")) return;
        setShowLabelPicker(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [showLabelPicker]);
  useEscapeKey(() => setShowLabelPicker(false), showLabelPicker);

  const handleToggleQuickAction = (panel: "date" | "move" | "pic" | "label" | "checklist" | "cover") => {
    setActiveMobilePanel((prev) => (prev === panel ? null : panel));
  };

  // Custom label creator state
  const [newLabelName, setNewLabelName] = useState("");
  const [selectedLabelColor, setSelectedLabelColor] = useState(DEFAULT_LABEL_COLORS[0]);
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);

  // Mention autocomplete state in comment textarea
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Quick cover emojis
  const COVER_EMOJIS = ["🐱", "⭐", "🚀", "💡", "🎯", "🔥", "📌", "🏆", "⚠️", "☕"];

  // Combined pool of available labels (board labels + card's own labels, deduplicated)
  const availableLabels: KanbanLabel[] = useMemo(() => {
    return resolveBoardAvailableLabels(
      {
        id: boardId || "default",
        title: "Current Board",
        background: "default",
        createdAt: "",
        updatedAt: "",
        lists: [
          {
            id: currentListId || "list",
            title: listTitle,
            order: 0,
            cards: [card],
          },
        ],
      },
      boardLabels,
    );
  }, [boardLabels, card, boardId, currentListId, listTitle]);

  // List of candidates for @mention in comments
  const mentionCandidates = useMemo(() => {
    const list: { id: string; name: string; avatarUrl?: string | null }[] = [];
    const seen = new Set<string>();

    // 1. Board members
    boardMembers.forEach((m) => {
      const id = m.userId || m.id;
      const name = m.displayName || (m.userId === currentUserId ? "Kamu" : "Anggota");
      if (!seen.has(id)) {
        seen.add(id);
        list.push({ id, name, avatarUrl: m.avatarUrl });
      }
    });

    // 2. Card assignees
    (card.assignees || []).forEach((a) => {
      if (!seen.has(a.id)) {
        seen.add(a.id);
        list.push({ id: a.id, name: a.name, avatarUrl: a.avatarUrl });
      }
    });

    if (list.length === 0) {
      list.push({
        id: currentUserId || "user-self",
        name: "Kamu",
        avatarUrl: null,
      });
    }

    if (!mentionQuery) return list;
    const q = mentionQuery.toLowerCase();
    return list.filter((item) => item.name.toLowerCase().includes(q));
  }, [boardMembers, card.assignees, currentUserId, mentionQuery]);

  // Handle strictly by unique member ID (Fixes multi-select bug)
  function handleToggleAssignee(member: { id: string; name: string; avatarUrl?: string | null }) {
    if (readOnly) return;
    const currentAssignees = card.assignees || [];
    const exists = currentAssignees.some((a) => a.id === member.id);
    let next: KanbanCardAssignee[];
    if (exists) {
      next = currentAssignees.filter((a) => a.id !== member.id);
    } else {
      next = [
        ...currentAssignees,
        { id: member.id, name: member.name, avatarUrl: member.avatarUrl || null },
      ];
    }
    onUpdate({
      assignees: next,
      assigneeId: next[0]?.id || null,
      assigneeName: next[0]?.name || null,
      assigneeAvatar: next[0]?.avatarUrl || null,
    });
  }

  function handleAddCustomPic() {
    if (readOnly) return;
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
    if (readOnly) return;
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
    if (readOnly) return;
    const trimmed = title.trim();
    if (trimmed && trimmed !== card.title) {
      onUpdate({ title: trimmed });
    } else {
      setTitle(card.title);
    }
  }

  const handleDescriptionChange = (newVal: string) => {
    setDescription(newVal);
    descriptionRef.current = newVal;
    if (readOnly) return;
    setDescSaveStatus("saving");
    if (descDebounceRef.current) {
      clearTimeout(descDebounceRef.current);
    }
    descDebounceRef.current = setTimeout(() => {
      flushDescriptionSave();
    }, 400);
  };

  const handleDescriptionBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (readOnly) return;
    flushDescriptionSave();
    const nextTarget = e.relatedTarget as HTMLElement | null;
    if (!nextTarget || !nextTarget.closest(".kanban-desc-editor")) {
      setIsEditingDesc(false);
    }
  };

  function handleSaveDescription() {
    if (readOnly) return;
    flushDescriptionSave();
    setIsEditingDesc(false);
  }

  // Toggle label on the card
  function handleToggleLabel(label: KanbanLabel) {
    if (readOnly) return;
    const existing = card.labels.find((l) => l.id === label.id || l.name.toLowerCase() === label.name.toLowerCase());
    let nextLabels: KanbanLabel[];
    if (existing) {
      nextLabels = card.labels.filter((l) => l.id !== label.id && l.name.toLowerCase() !== label.name.toLowerCase());
    } else {
      nextLabels = [...card.labels, label];
    }
    onUpdate({ labels: nextLabels });
  }

  // Create a brand new label
  function handleCreateCustomLabel() {
    if (readOnly) return;
    const trimmed = newLabelName.trim();
    if (!trimmed) return;
    // Unmark from deleted registry in case it was previously deleted
    unmarkDeletedBoardLabel(boardId, trimmed);
    unmarkDeletedBoardLabel("global", trimmed);
    const newLbl: KanbanLabel = {
      id: createId("lbl"),
      name: trimmed,
      color: selectedLabelColor,
    };
    const updatedPool = [
      ...availableLabels.filter((l) => l.name.toLowerCase() !== trimmed.toLowerCase()),
      newLbl,
    ];
    if (onUpdateBoardLabels) {
      onUpdateBoardLabels(updatedPool);
    }
    saveCustomBoardLabels(boardId || "default", updatedPool);
    saveCustomBoardLabels("global", updatedPool);
    // Also attach to card immediately
    const nextCardLabels = [
      ...card.labels.filter((l) => l.name.toLowerCase() !== trimmed.toLowerCase()),
      newLbl,
    ];
    onUpdate({ labels: nextCardLabels });
    setNewLabelName("");
    setIsCreatingLabel(false);
  }

  // Delete label permanently from board palette, registry, and cards
  function handleDeleteLabel(labelId: string, e?: React.MouseEvent) {
    if (readOnly) return;
    if (e) e.stopPropagation();
    const targetLabel = availableLabels.find((l) => l.id === labelId);
    const targetName = targetLabel?.name || "";

    // Save into deleted registry to prevent resurrecting from default palette or card scans
    saveDeletedBoardLabel(boardId, labelId);
    if (targetName) saveDeletedBoardLabel(boardId, targetName);
    saveDeletedBoardLabel("global", labelId);
    if (targetName) saveDeletedBoardLabel("global", targetName);

    const updatedPool = availableLabels.filter(
      (l) => l.id !== labelId && (!targetName || l.name.toLowerCase() !== targetName.toLowerCase()),
    );
    if (onDeleteBoardLabel) {
      onDeleteBoardLabel(labelId, targetName);
    } else if (onUpdateBoardLabels) {
      onUpdateBoardLabels(updatedPool);
    }
    saveCustomBoardLabels(boardId || "default", updatedPool);
    saveCustomBoardLabels("global", updatedPool);
    onUpdate({
      labels: card.labels.filter(
        (l) => l.id !== labelId && (!targetName || l.name.toLowerCase() !== targetName.toLowerCase()),
      ),
    });
  }

  function handleAddChecklist() {
    if (readOnly) return;
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
    if (readOnly) return;
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
    if (readOnly) return;
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
    if (readOnly) return;
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
    if (readOnly) return;
    onUpdate({ checklists: card.checklists.filter((c) => c.id !== checklistId) });
  }

  // Handle comment input with @mention detection
  function handleCommentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setNewCommentText(val);

    const match = val.match(/@([a-zA-Z0-9_\s]{0,20})$/);
    if (match) {
      setMentionQuery(match[1]);
    } else {
      setMentionQuery(null);
    }
  }

  function handleSelectMention(memberName: string) {
    const replaced = newCommentText.replace(/@([a-zA-Z0-9_\s]{0,20})$/, `@${memberName} `);
    setNewCommentText(replaced);
    setMentionQuery(null);
    if (commentTextareaRef.current) {
      commentTextareaRef.current.focus();
    }
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
    setMentionQuery(null);
  }

  function handleSendToFrogClick() {
    if (onSendToFrog) {
      onSendToFrog(card);
      onUpdate({ frog: true });
      setFrogFeedback("Tugas berhasil dikirim ke Eat Your Frog!");
      setTimeout(() => setFrogFeedback(null), 3000);
    }
  }

  // Formatted date range label for header/body
  const formattedDateRange = useMemo(() => {
    if (!card.startDate && !card.dueDate) return null;
    try {
      if (card.startDate && card.dueDate) {
        const start = new Date(card.startDate);
        const due = new Date(card.dueDate);
        const s = start.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
        const d = due.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
        return `${s} – ${d}`;
      }
      if (card.dueDate) {
        return new Date(card.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
      }
      if (card.startDate) {
        return `Mulai ${new Date(card.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`;
      }
    } catch {
      return card.dueDate || card.startDate || "";
    }
    return null;
  }, [card.startDate, card.dueDate]);

  function handleScheduleToCalendar() {
    if (onScheduleToCalendar) {
      onScheduleToCalendar(card);
      setCalendarFeedback("✓ Berhasil dijadwalkan ke Kalender!");
      setTimeout(() => setCalendarFeedback(null), 3500);
    }
  }

  // Parser to style @mentions in comment body
  function renderCommentBody(text: string) {
    const parts = text.split(/(@[a-zA-Z0-9_\s]+?\b)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        return (
          <span key={i} className="kanban-comment-mention">
            {part}
          </span>
        );
      }
      return part;
    });
  }

  return (
    <div className="kanban-dialog-backdrop" role="presentation">
      <div
        ref={modalRef}
        className={`kanban-dialog-card ${isLight ? "kanban-light-card" : "kanban-dark-card"}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="kanban-dialog-title"
      >
        {/* Mobile Drag Handle Indicator */}
        <div className="kanban-dialog-mobile-handle" aria-hidden="true" />
        {/* Read-Only Notice Bar */}
        {readOnly && (
          <div className="kanban-dialog-readonly-banner">
            <span>🔒 Mode Hanya Lihat — Kamu belum bergabung sebagai editor untuk kartu ini.</span>
          </div>
        )}

        {/* Cover Band / Emoji Header */}
        {card.coverColor && (
          <div className="kanban-dialog-cover" style={{ background: card.coverColor }} />
        )}

        {/* Archived Notice Banner */}
        {card.archived && (
          <div className="kanban-archived-card-banner">
            <div className="archived-banner-text">
              <span className="archived-banner-icon">📦</span>
              <div>
                <strong>Kartu ini telah diarsipkan.</strong>
                <p>Kartu disembunyikan dari kolom papan aktif.</p>
              </div>
            </div>
            <div className="archived-banner-actions">
              {onRestore && !readOnly && (
                <button
                  type="button"
                  className="kanban-primary-btn"
                  onClick={() => {
                    onRestore();
                    onClose();
                  }}
                  style={{ fontSize: 13, padding: "6px 14px", fontWeight: 600 }}
                >
                  ↩️ Pulihkan ke Papan
                </button>
              )}
              {onDelete && !readOnly && (
                <button
                  type="button"
                  className="kanban-secondary-btn danger-text"
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{ fontSize: 13, padding: "6px 14px" }}
                >
                  🗑️ Hapus Permanen
                </button>
              )}
            </div>
          </div>
        )}

        {/* Top Header Row */}
        <div className="kanban-dialog-header">
          <div className="kanban-dialog-title-area">
            {card.coverEmoji && <span className="kanban-header-emoji">{card.coverEmoji}</span>}
            <div style={{ flex: 1, minWidth: 0 }}>
              {isEditingTitle && !readOnly ? (
                <input
                  id="kanban-dialog-title"
                  type="text"
                  className="kanban-dialog-title-input is-editing"
                  style={{ color: isLight ? "#0f172a" : "#ffffff" }}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => {
                    handleTitleBlur();
                    setIsEditingTitle(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleTitleBlur();
                      setIsEditingTitle(false);
                    }
                  }}
                  autoFocus
                  aria-label="Judul kartu"
                />
              ) : (
                <div
                  className="kanban-dialog-title-display-box"
                  onClick={() => {
                    if (!readOnly) setIsEditingTitle(true);
                  }}
                  role={readOnly ? undefined : "button"}
                  tabIndex={readOnly ? undefined : 0}
                  onKeyDown={(e) => {
                    if (!readOnly && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      setIsEditingTitle(true);
                    }
                  }}
                  title={readOnly ? undefined : "Ketuk untuk mengubah judul kartu"}
                >
                  <h2
                    className="kanban-dialog-title-display"
                    style={{ color: isLight ? "#0f172a" : "#ffffff" }}
                  >
                    {title.trim() || "Kartu Tanpa Judul"}
                  </h2>
                  {!readOnly && (
                    <span
                      className="kanban-dialog-title-edit-hint"
                      aria-hidden="true"
                      style={{ color: isLight ? "#64748b" : "rgba(255, 255, 255, 0.7)" }}
                    >
                      ✏️
                    </span>
                  )}
                </div>
              )}
              <p
                className="kanban-dialog-crumb"
                style={{ color: isLight ? "#64748b" : "rgba(255, 255, 255, 0.7)" }}
              >
                dalam kolom <strong style={{ color: isLight ? "#0f172a" : "#ffffff" }}>{listTitle}</strong>
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {!readOnly && !card.archived && onArchive && (
              <button
                type="button"
                className="kanban-header-archive-btn"
                onClick={onArchive}
                title="Arsipkan kartu ini"
              >
                📦 Arsipkan
              </button>
            )}
            <button
              type="button"
              className="kanban-dialog-close-btn"
              onClick={handleSafeClose}
              aria-label="Tutup detail kartu"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Quick Toolbar for Mobile & Fast Access */}
        {!readOnly && (
          <div className="kanban-dialog-quick-toolbar">
            {!card.archived && onArchive && (
              <button
                type="button"
                className="kanban-quick-btn kanban-quick-archive-btn"
                onClick={onArchive}
                title="Arsipkan kartu ini"
              >
                📦 Arsip
              </button>
            )}
            <button
              type="button"
              className={`kanban-quick-btn ${activeMobilePanel === "date" ? "active" : ""}`}
              onClick={() => handleToggleQuickAction("date")}
            >
              🕒 Tenggat
            </button>
            {boardLists && boardLists.length > 1 && (
              <button
                type="button"
                className={`kanban-quick-btn ${activeMobilePanel === "move" ? "active" : ""}`}
                onClick={() => handleToggleQuickAction("move")}
              >
                📍 Pindah
              </button>
            )}
            <button
              type="button"
              className={`kanban-quick-btn ${activeMobilePanel === "pic" ? "active" : ""}`}
              onClick={() => handleToggleQuickAction("pic")}
            >
              👥 PIC
            </button>
            <button
              type="button"
              className={`kanban-quick-btn ${activeMobilePanel === "label" ? "active" : ""}`}
              onClick={() => handleToggleQuickAction("label")}
            >
              🏷️ Label
            </button>
            <button
              type="button"
              className={`kanban-quick-btn ${activeMobilePanel === "checklist" ? "active" : ""}`}
              onClick={() => handleToggleQuickAction("checklist")}
            >
              ☑️ Checklist
            </button>
            <button
              type="button"
              className={`kanban-quick-btn ${activeMobilePanel === "cover" ? "active" : ""}`}
              onClick={() => handleToggleQuickAction("cover")}
            >
              🎨 Cover
            </button>
          </div>
        )}

        {/* Mobile Inline Quick Action Panel */}
        {!readOnly && activeMobilePanel && (
          <div className="kanban-mobile-inline-panel kanban-mobile-only">
            <div className="mobile-panel-header">
              <span className="mobile-panel-title">
                {activeMobilePanel === "date" && "🕒 Tenggat & Rentang Waktu"}
                {activeMobilePanel === "move" && "📍 Pindahkan ke Kolom"}
                {activeMobilePanel === "pic" && "👥 Atur Anggota / PIC"}
                {activeMobilePanel === "label" && "🏷️ Atur Labels"}
                {activeMobilePanel === "checklist" && "☑️ Tambah Checklist Baru"}
                {activeMobilePanel === "cover" && "🎨 Cover & Emoji Kartu"}
              </span>
              <button
                type="button"
                className="mobile-panel-close-btn"
                onClick={() => setActiveMobilePanel(null)}
                aria-label="Tutup panel"
              >
                ✕
              </button>
            </div>
            <div className="mobile-panel-body">
              {activeMobilePanel === "date" && (
                <div className="kanban-date-picker-box">
                  <div className="kanban-date-field-row">
                    <div className="kanban-date-field-col">
                      <label className="kanban-custom-pic-label">
                        <span className="date-icon-badge">📅</span> Tanggal Mulai
                      </label>
                      <input
                        type="date"
                        value={card.startDate || ""}
                        onChange={(e) => onUpdate({ startDate: e.target.value || undefined })}
                        className="kanban-subtask-input kanban-date-input"
                      />
                    </div>
                    <div className="kanban-date-field-col">
                      <label className="kanban-custom-pic-label">
                        <span className="date-icon-badge">🏁</span> Tenggat Selesai
                      </label>
                      <input
                        type="date"
                        value={card.dueDate || ""}
                        onChange={(e) => onUpdate({ dueDate: e.target.value || undefined })}
                        className="kanban-subtask-input kanban-date-input"
                      />
                    </div>
                  </div>

                  {onScheduleToCalendar && (
                    <button
                      type="button"
                      className="kanban-primary-btn kanban-schedule-btn"
                      onClick={() => {
                        handleScheduleToCalendar();
                        setActiveMobilePanel(null);
                      }}
                      style={{ marginTop: 10, width: "100%", padding: "8px 12px", fontSize: 12.5 }}
                    >
                      📅 Jadwalkan ke Kalender
                    </button>
                  )}

                  {(card.startDate || card.dueDate) && (
                    <button
                      type="button"
                      className="kanban-text-btn"
                      onClick={() => {
                        onUpdate({ startDate: undefined, dueDate: undefined, dueCompleted: false });
                        setActiveMobilePanel(null);
                      }}
                      style={{ marginTop: 8, width: "100%", textAlign: "center", fontSize: 12 }}
                    >
                      Hapus Rentang Tanggal
                    </button>
                  )}
                </div>
              )}

              {activeMobilePanel === "move" && (
                <div className="mobile-move-column-list" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {boardLists?.map((l) => {
                    const isCurrent = l.id === currentListId;
                    return (
                      <button
                        key={l.id}
                        type="button"
                        className={`mobile-move-column-btn ${isCurrent ? "current" : ""}`}
                        onClick={() => {
                          if (!isCurrent && onMoveToList) {
                            onMoveToList(l.id);
                          }
                          setActiveMobilePanel(null);
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{l.title}</span>
                        {isCurrent ? <span className="option-badge current">✓ Saat ini</span> : <span className="option-badge hover-tag">Pindah →</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {activeMobilePanel === "checklist" && (
                <div className="mobile-panel-checklist">
                  <input
                    type="text"
                    placeholder="Judul checklist..."
                    value={newChecklistTitle}
                    onChange={(e) => setNewChecklistTitle(e.target.value)}
                    className="kanban-subtask-input"
                    autoFocus
                  />
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button
                      type="button"
                      className="kanban-primary-btn"
                      onClick={() => {
                        handleAddChecklist();
                        setActiveMobilePanel(null);
                      }}
                    >
                      + Buat Checklist
                    </button>
                    <button
                      type="button"
                      className="kanban-secondary-btn"
                      onClick={() => setActiveMobilePanel(null)}
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}

              {activeMobilePanel === "cover" && (
                <div className="mobile-panel-cover">
                  <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 8px" }}>Pilih Emoji Cover:</p>
                  <div className="kanban-cover-emoji-grid" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                    {COVER_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className={`emoji-btn ${card.coverEmoji === emoji ? "active" : ""}`}
                        onClick={() => {
                          onUpdate({ coverEmoji: card.coverEmoji === emoji ? undefined : emoji });
                        }}
                        style={{ fontSize: 22, padding: "6px 9px", borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", cursor: "pointer" }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 8px" }}>Pilih Warna Cover:</p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                    {DEFAULT_LABEL_COLORS.map((col) => (
                      <button
                        key={col}
                        type="button"
                        style={{ width: 28, height: 28, borderRadius: 8, background: col, border: card.coverColor === col ? "2px solid #fff" : "none", cursor: "pointer" }}
                        onClick={() => onUpdate({ coverColor: card.coverColor === col ? undefined : col })}
                      />
                    ))}
                  </div>
                  {(card.coverColor || card.coverEmoji) && (
                    <button
                      type="button"
                      className="kanban-text-btn"
                      onClick={() => onUpdate({ coverColor: undefined, coverEmoji: undefined })}
                      style={{ marginTop: 4, width: "100%", textAlign: "center", fontSize: 12 }}
                    >
                      Hapus Cover
                    </button>
                  )}
                </div>
              )}

              {activeMobilePanel === "pic" && (
                <div className="mobile-panel-pic">
                  <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 8px" }}>
                    Tugaskan kartu ke anggota tim:
                  </p>
                  {boardMembers.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12, maxHeight: 180, overflowY: "auto" }}>
                      {boardMembers.map((member) => {
                        const memberId = member.userId || member.id;
                        const isAssigned = (card.assignees || []).some((a) => a.id === memberId);
                        const name = member.displayName || (member.userId === currentUserId ? "Kamu" : "Anggota Tim");
                        return (
                          <button
                            key={memberId}
                            type="button"
                            onClick={() => handleToggleAssignee({ id: memberId, name, avatarUrl: member.avatarUrl })}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "8px 12px",
                              borderRadius: 10,
                              border: isAssigned ? "1.5px solid #0284c7" : "1px solid color-mix(in srgb, var(--ink) 12%, transparent)",
                              background: isAssigned ? "color-mix(in srgb, #0284c7 15%, var(--paper))" : "var(--paper)",
                              color: "var(--ink)",
                              cursor: "pointer",
                            }}
                          >
                            <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: isAssigned ? 700 : 500 }}>
                              <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#0284c7", color: "#fff", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700 }}>
                                {name.charAt(0).toUpperCase()}
                              </span>
                              {name}
                            </span>
                            <span style={{ fontSize: 12, color: isAssigned ? "#0284c7" : "var(--muted)" }}>
                              {isAssigned ? "✓ Ditugaskan" : "+ Pilih"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                    <input
                      type="text"
                      placeholder="Nama PIC kustom..."
                      value={customPicName}
                      onChange={(e) => setCustomPicName(e.target.value)}
                      className="kanban-subtask-input"
                    />
                    <button
                      type="button"
                      className="kanban-primary-btn"
                      onClick={() => {
                        handleAddCustomPic();
                        setCustomPicName("");
                      }}
                      disabled={!customPicName.trim()}
                    >
                      + Tambah
                    </button>
                  </div>
                </div>
              )}

              {activeMobilePanel === "label" && (
                <div className="mobile-panel-label">
                  <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 8px" }}>
                    Pilih label untuk kartu ini:
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12, maxHeight: 180, overflowY: "auto" }}>
                    {availableLabels.map((lbl) => {
                      const isAttached = card.labels.some((l) => l.id === lbl.id || l.name.toLowerCase() === lbl.name.toLowerCase());
                      return (
                        <button
                          key={lbl.id}
                          type="button"
                          onClick={() => handleToggleLabel(lbl)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 12px",
                            borderRadius: 10,
                            border: isAttached ? "1.5px solid #0284c7" : "1px solid color-mix(in srgb, var(--ink) 12%, transparent)",
                            background: isAttached ? "color-mix(in srgb, #0284c7 15%, var(--paper))" : "var(--paper)",
                            color: "var(--ink)",
                            cursor: "pointer",
                          }}
                        >
                          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: isAttached ? 700 : 500 }}>
                            <span style={{ width: 14, height: 14, borderRadius: 4, background: lbl.color, flexShrink: 0 }} />
                            {lbl.name}
                          </span>
                          <span style={{ fontSize: 12, color: isAttached ? "#0284c7" : "var(--muted)" }}>
                            {isAttached ? "✓ Aktif" : "+ Pasang"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      type="text"
                      placeholder="Nama label baru..."
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      className="kanban-subtask-input"
                    />
                    <button
                      type="button"
                      className="kanban-primary-btn"
                      onClick={handleCreateCustomLabel}
                      disabled={!newLabelName.trim()}
                    >
                      + Buat
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {frogFeedback && (
          <div className="daily-goal-badge" style={{ animation: "none", margin: "0 24px 12px" }}>
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
                      {!readOnly && (
                        <button
                          type="button"
                          className="kanban-pic-remove-btn"
                          onClick={() => handleRemoveAssignee(pic.id)}
                          title="Hapus PIC"
                        >
                          ✕
                        </button>
                      )}
                    </span>
                  ))}
                  {!readOnly && (
                    <button
                      type="button"
                      className="kanban-add-mini-btn kanban-member-trigger-btn"
                      onClick={() => setShowMemberPicker(!showMemberPicker)}
                      title="Tambah anggota / PIC"
                    >
                      +
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Member / PIC Picker Popover */}
            {!readOnly && showMemberPicker && (
              <div ref={memberPickerRef} className="kanban-popover-box kanban-member-popover">
                <div className="kanban-popover-head">
                  <span>Pilih Anggota / PIC</span>
                  <button type="button" onClick={() => setShowMemberPicker(false)}>✕</button>
                </div>

                <div className="kanban-member-picker-list">
                  {boardMembers.length > 0 ? (
                    boardMembers.map((member) => {
                      const memberId = member.userId || member.id;
                      const isAssigned = (card.assignees || []).some((a) => a.id === memberId);
                      const name = member.displayName || (member.userId === currentUserId ? "Kamu" : "Anggota Tim");
                      return (
                        <button
                          key={member.id}
                          type="button"
                          className={`kanban-member-pick-item ${isAssigned ? "selected" : ""}`}
                          onClick={() =>
                            handleToggleAssignee({
                              id: memberId,
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
                      className={`kanban-member-pick-item ${(card.assignees || []).some((a) => a.id === (currentUserId || "user-self")) ? "selected" : ""}`}
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
                      {(card.assignees || []).some((a) => a.id === (currentUserId || "user-self")) && (
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
                  {card.labels.map((lbl) => {
                    const isBright = isLightHexColor(lbl.color);
                    return (
                      <span
                        key={lbl.id}
                        className="kanban-dialog-label-chip"
                        style={{
                          backgroundColor: lbl.color,
                          color: isBright ? "#0f172a" : "#ffffff",
                        }}
                      >
                        <span
                          className="kanban-dialog-label-chip-text"
                          onClick={() => !readOnly && setShowLabelPicker(true)}
                          title="Klik untuk memilih atau mengelola label"
                          style={{ color: isBright ? "#0f172a" : "#ffffff" }}
                        >
                          {lbl.name}
                        </span>
                        {!readOnly && (
                          <button
                            type="button"
                            className="kanban-dialog-label-chip-remove"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleLabel(lbl);
                            }}
                            title={`Lepas label "${lbl.name}" dari kartu ini`}
                            aria-label={`Lepas label ${lbl.name}`}
                            style={{
                              color: isBright ? "#0f172a" : "rgba(255, 255, 255, 0.85)",
                              background: isBright ? "rgba(0, 0, 0, 0.12)" : "rgba(0, 0, 0, 0.22)",
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </span>
                    );
                  })}
                  {!readOnly && (
                    <button
                      type="button"
                      className="kanban-add-mini-btn kanban-label-trigger-btn"
                      onClick={() => setShowLabelPicker(!showLabelPicker)}
                      title="Tambah label"
                    >
                      +
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Label Picker Popover (With Create & Delete Capabilities) */}
            {!readOnly && showLabelPicker && (
              <div ref={labelPickerRef} className="kanban-popover-box kanban-labels-popover">
                <div className="kanban-popover-head">
                  <span>Pilih &amp; Kelola Label</span>
                  <button type="button" onClick={() => setShowLabelPicker(false)}>✕</button>
                </div>

                {/* Existing Available Labels */}
                <div className="kanban-palette-grid">
                  {availableLabels.map((item) => {
                    const isSelected = card.labels.some((l) => l.id === item.id || l.name === item.name);
                    const isBright = isLightHexColor(item.color);
                    return (
                      <div
                        key={item.id}
                        className={`kanban-palette-item-wrap ${isSelected ? "selected" : ""}`}
                        style={{
                          backgroundColor: item.color,
                          color: isBright ? "#0f172a" : "#ffffff",
                        }}
                      >
                        <button
                          type="button"
                          className="kanban-palette-item-btn"
                          onClick={() => handleToggleLabel(item)}
                          title={`Terapkan label ${item.name}`}
                          style={{ color: isBright ? "#0f172a" : "#ffffff" }}
                        >
                          <span className="label-item-name">{item.name}</span>
                          {isSelected && <span className="label-check" style={{ color: isBright ? "#0f172a" : "#ffffff" }}>✓</span>}
                        </button>
                        <button
                          type="button"
                          className="kanban-palette-item-del-btn"
                          onClick={(e) => handleDeleteLabel(item.id, e)}
                          title="Hapus label dari daftar"
                          style={{ color: isBright ? "#0f172a" : "rgba(255, 255, 255, 0.85)" }}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Create New Custom Label Form */}
                <div className="kanban-create-label-box">
                  {!isCreatingLabel ? (
                    <button
                      type="button"
                      className="kanban-text-btn create-label-trigger"
                      onClick={() => setIsCreatingLabel(true)}
                    >
                      + Buat Label Baru
                    </button>
                  ) : (
                    <div className="kanban-new-label-form">
                      <span className="kanban-custom-pic-label">Nama Label Baru</span>
                      <input
                        type="text"
                        placeholder="Cth: Design Sprint, Blocked..."
                        value={newLabelName}
                        onChange={(e) => setNewLabelName(e.target.value)}
                        className="kanban-subtask-input"
                        autoFocus
                      />

                      <span className="kanban-custom-pic-label" style={{ marginTop: 6 }}>
                        Warna Label
                      </span>
                      <div className="kanban-label-colors-row">
                        {DEFAULT_LABEL_COLORS.map((col) => (
                          <button
                            key={col}
                            type="button"
                            className={`color-swatch-mini ${selectedLabelColor === col ? "active" : ""}`}
                            style={{ backgroundColor: col }}
                            onClick={() => setSelectedLabelColor(col)}
                            title={col}
                          />
                        ))}
                      </div>

                      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                        <button
                          type="button"
                          className="kanban-primary-btn"
                          onClick={handleCreateCustomLabel}
                          disabled={!newLabelName.trim()}
                        >
                          Simpan Label
                        </button>
                        <button
                          type="button"
                          className="kanban-secondary-btn"
                          onClick={() => setIsCreatingLabel(false)}
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Date Range Section */}
            {(card.startDate || card.dueDate) && (
              <div className="kanban-dialog-section">
                <div className="kanban-section-head-row">
                  <span className="kanban-section-title">🕒 Rentang Tenggat Waktu</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    {onScheduleToCalendar && (
                      <button
                        type="button"
                        className="kanban-text-btn kanban-schedule-cal-btn"
                        onClick={handleScheduleToCalendar}
                        title="Sinkronkan kartu tugas ini ke time-blocking Kalender"
                      >
                        📅 Jadwalkan ke Kalender
                      </button>
                    )}
                  </div>
                </div>
                <div className="kanban-due-date-row">
                  <input
                    type="checkbox"
                    checked={Boolean(card.dueCompleted)}
                    onChange={(e) => !readOnly && onUpdate({ dueCompleted: e.target.checked })}
                    className="keep-checkbox"
                    id="due-check"
                    disabled={readOnly}
                  />
                  <label htmlFor="due-check" style={{ fontSize: 13, cursor: readOnly ? "default" : "pointer" }}>
                    <strong>{formattedDateRange}</strong> {card.dueCompleted ? "(Selesai ✓)" : ""}
                  </label>
                  {!readOnly && (
                    <button
                      type="button"
                      className="kanban-text-btn"
                      onClick={() => onUpdate({ startDate: undefined, dueDate: undefined, dueCompleted: false })}
                    >
                      Hapus Rentang
                    </button>
                  )}
                </div>
                {calendarFeedback && (
                  <div className="kanban-schedule-success-banner">
                    {calendarFeedback}
                  </div>
                )}
              </div>
            )}

            {/* Description Section */}
            <div className="kanban-dialog-section">
              <div className="kanban-section-head-row">
                <span className="kanban-section-title">📝 Deskripsi</span>
                {!readOnly && !isEditingDesc && (
                  <button
                    type="button"
                    className="kanban-text-btn"
                    onClick={() => setIsEditingDesc(true)}
                  >
                    {card.description ? "Edit" : "+ Tambah deskripsi"}
                  </button>
                )}
              </div>

              {!readOnly && isEditingDesc ? (
                <div className="kanban-desc-editor">
                  <textarea
                    className="kanban-desc-textarea"
                    placeholder="Tambahkan penjelasan rinci tentang tugas ini..."
                    value={description}
                    onChange={(e) => handleDescriptionChange(e.target.value)}
                    onBlur={handleDescriptionBlur}
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
                        flushDescriptionSave();
                        setIsEditingDesc(false);
                      }}
                    >
                      Tutup
                    </button>
                    {descSaveStatus === "saving" && (
                      <span className="kanban-desc-autosave-badge saving">
                        Menyimpan...
                      </span>
                    )}
                    {descSaveStatus === "saved" && (
                      <span className="kanban-desc-autosave-badge saved">
                        ✓ Tersimpan otomatis
                      </span>
                    )}
                    {descSaveStatus === "idle" && (
                      <span className="kanban-desc-autosave-badge idle">
                        Auto-save aktif
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  className="kanban-desc-preview"
                  onClick={() => !readOnly && setIsEditingDesc(true)}
                  role="button"
                  tabIndex={0}
                  style={{ cursor: readOnly ? "default" : "pointer" }}
                >
                  {card.description ? (
                    <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{card.description}</p>
                  ) : (
                    <p className="kanban-desc-placeholder">
                      {readOnly ? "Tidak ada deskripsi." : "Klik untuk menambahkan detail deskripsi..."}
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
                <div key={chk.id} className="kanban-dialog-section kanban-checklist-section">
                  <div className="kanban-section-head-row">
                    <span className="kanban-section-title">☑️ {chk.title}</span>
                    {!readOnly && (
                      <button
                        type="button"
                        className="kanban-text-btn"
                        onClick={() => handleDeleteChecklist(chk.id)}
                      >
                        Hapus
                      </button>
                    )}
                  </div>

                  {/* Progress bar */}
                  {chk.items.length > 0 && (
                    <div className="kanban-checklist-progress">
                      <span className="progress-pct">{pct}%</span>
                      <div className="progress-bar-track">
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${pct}%`,
                            background: pct === 100 ? "#22c55e" : "var(--blue)",
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Items list */}
                  <div className="kanban-checklist-items">
                    {chk.items.map((it) => (
                      <div key={it.id} className="kanban-check-item-row">
                        <input
                          type="checkbox"
                          checked={it.done}
                          onChange={() => handleToggleChecklistItem(chk.id, it.id)}
                          className="keep-checkbox"
                          disabled={readOnly}
                        />
                        <span
                          className={`kanban-check-item-text ${it.done ? "done" : ""}`}
                          onClick={() => handleToggleChecklistItem(chk.id, it.id)}
                        >
                          {it.text}
                        </span>
                        {!readOnly && (
                          <button
                            type="button"
                            className="kanban-del-item-btn"
                            onClick={() => handleDeleteChecklistItem(chk.id, it.id)}
                            title="Hapus butir"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}

                    {!readOnly && (
                      <form
                        className="kanban-add-checklist-item-form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const input = e.currentTarget.elements.namedItem("itemText") as HTMLInputElement | null;
                          if (input && input.value.trim()) {
                            handleAddItemToChecklist(chk.id, input.value.trim());
                            input.value = "";
                          }
                        }}
                      >
                        <input
                          name="itemText"
                          type="text"
                          enterKeyHint="done"
                          placeholder="+ Tambah butir checklist..."
                          className="kanban-subtask-input kanban-checklist-add-input"
                          autoComplete="off"
                        />
                        <button
                          type="submit"
                          className="kanban-add-item-btn"
                          title="Tambah butir checklist"
                        >
                          + Tambah
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Comments & Activity Section with @mention support */}
            <div className="kanban-dialog-section">
              <span className="kanban-section-title">💬 Komentar &amp; Aktivitas</span>

              <div className="kanban-comment-input-area" style={{ position: "relative" }}>
                <textarea
                  ref={commentTextareaRef}
                  className="kanban-desc-textarea"
                  placeholder="Tulis komentar atau ketik @ untuk mention anggota..."
                  value={newCommentText}
                  onChange={handleCommentChange}
                  rows={2}
                />

                {/* Floating Mention Autocomplete Suggestions Dropdown */}
                {mentionQuery !== null && mentionCandidates.length > 0 && (
                  <div className="kanban-mention-popover">
                    <span className="mention-popover-title">Mention Anggota Tim:</span>
                    {mentionCandidates.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        className="mention-candidate-item"
                        onClick={() => handleSelectMention(m.name)}
                      >
                        <div className="mention-candidate-avatar">
                          {m.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.avatarUrl} alt={m.name} />
                          ) : (
                            <span>{m.name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <span className="mention-candidate-name">{m.name}</span>
                      </button>
                    ))}
                  </div>
                )}

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
                        <strong className="kanban-comment-author">{cmt.authorName}</strong>
                        <span className="kanban-comment-date">{cmt.createdAt}</span>
                      </div>
                      <p className="kanban-comment-body kanban-comment-text">{renderCommentBody(cmt.text)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar Actions */}
          {!readOnly && (
            <div className="kanban-dialog-sidebar">
              {/* Modern Move Column Dropdown */}
              {onMoveToList && boardLists && boardLists.length > 1 && (
                <div className="kanban-move-card-box" ref={moveMenuRef}>
                  <span className="kanban-sidebar-heading">📍 Pindahkan ke Kolom</span>
                  <div className="kanban-custom-select-wrap">
                    <button
                      type="button"
                      className={`kanban-custom-select-btn ${moveMenuOpen ? "active" : ""}`}
                      onClick={() => setMoveMenuOpen(!moveMenuOpen)}
                      disabled={readOnly}
                      aria-label="Pindahkan kartu ke kolom lain"
                      aria-expanded={moveMenuOpen}
                    >
                      <span className="select-btn-text">
                        {boardLists.find((l) => l.id === currentListId)?.title || "Pilih Kolom..."}
                      </span>
                      <svg
                        className={`select-chevron ${moveMenuOpen ? "open" : ""}`}
                        width="12"
                        height="12"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>

                    {moveMenuOpen && (
                      <div className="kanban-custom-select-menu" role="menu">
                        {boardLists.map((l) => {
                          const isCurrent = l.id === currentListId;
                          return (
                            <button
                              key={l.id}
                              type="button"
                              className={`kanban-select-option ${isCurrent ? "current" : ""}`}
                              onClick={() => {
                                if (!isCurrent && onMoveToList) {
                                  onMoveToList(l.id);
                                }
                                setMoveMenuOpen(false);
                              }}
                              role="menuitem"
                            >
                              <span className="option-title">{l.title}</span>
                              {isCurrent ? (
                                <span className="option-badge current">✓ Saat ini</span>
                              ) : (
                                <span className="option-badge hover-tag">Pindahkan →</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <span className="kanban-sidebar-heading" style={{ marginTop: 8 }}>Tambahkan ke Kartu</span>

              {/* Frog Action */}
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
                className={`kanban-sidebar-btn kanban-member-trigger-btn ${showMemberPicker ? "active" : ""}`}
                onClick={() => setShowMemberPicker(!showMemberPicker)}
              >
                👥 Anggota / PIC
              </button>

              <button
                type="button"
                className={`kanban-sidebar-btn kanban-label-trigger-btn ${showLabelPicker ? "active" : ""}`}
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

              {/* Date Range Picker Action */}
              <button
                type="button"
                className={`kanban-sidebar-btn ${showDatePicker ? "active" : ""}`}
                onClick={() => setShowDatePicker(!showDatePicker)}
              >
                🕒 Tenggat &amp; Rentang Waktu
              </button>

              {showDatePicker && (
                <div className="kanban-sidebar-subbox kanban-date-picker-box">
                  <div className="kanban-date-field-col" style={{ marginBottom: 8 }}>
                    <label className="kanban-custom-pic-label" style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                      <span className="date-icon-badge">📅</span> Tanggal Mulai
                    </label>
                    <input
                      type="date"
                      value={card.startDate || ""}
                      onChange={(e) => onUpdate({ startDate: e.target.value || undefined })}
                      className="kanban-subtask-input kanban-date-input"
                    />
                  </div>

                  <div className="kanban-date-field-col" style={{ marginBottom: 10 }}>
                    <label className="kanban-custom-pic-label" style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                      <span className="date-icon-badge">🏁</span> Tenggat Selesai
                    </label>
                    <input
                      type="date"
                      value={card.dueDate || ""}
                      onChange={(e) => onUpdate({ dueDate: e.target.value || undefined })}
                      className="kanban-subtask-input kanban-date-input"
                    />
                  </div>

                  {onScheduleToCalendar && (
                    <button
                      type="button"
                      className="kanban-primary-btn kanban-schedule-btn"
                      onClick={handleScheduleToCalendar}
                      style={{ width: "100%", fontSize: 12, padding: "7px 10px", fontWeight: 700 }}
                    >
                      📅 Jadwalkan ke Kalender
                    </button>
                  )}

                  {(card.startDate || card.dueDate) && (
                    <button
                      type="button"
                      className="kanban-text-btn"
                      onClick={() =>
                        onUpdate({ startDate: undefined, dueDate: undefined, dueCompleted: false })
                      }
                      style={{ marginTop: 6, width: "100%", textAlign: "center", fontSize: 12 }}
                    >
                      Hapus Rentang Tanggal
                    </button>
                  )}
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
                {!card.archived ? (
                  <button
                    type="button"
                    className="kanban-sidebar-btn"
                    onClick={() => {
                      if (readOnly) return;
                      if (onArchive) {
                        onArchive();
                      } else if (onDelete) {
                        onDelete();
                      }
                    }}
                    style={{
                      background: isLight ? "rgba(0, 0, 0, 0.06)" : "rgba(255, 255, 255, 0.1)",
                      color: isLight ? "#333333" : "#e2e8f0",
                    }}
                    title="Arsipkan kartu ini dari papan proyek"
                  >
                    📦 Arsipkan Kartu
                  </button>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {onRestore && (
                      <button
                        type="button"
                        className="kanban-sidebar-btn"
                        onClick={() => {
                          if (readOnly) return;
                          onRestore();
                          onClose();
                        }}
                        style={{
                          background: "#0284c7",
                          color: "#ffffff",
                          fontWeight: 600,
                        }}
                        title="Kembalikan kartu ke kolom papan aktif"
                      >
                        ↩️ Pulihkan ke Papan
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        className="kanban-sidebar-btn danger-text"
                        onClick={() => {
                          if (readOnly) return;
                          setShowDeleteConfirm(true);
                        }}
                        style={{
                          background: isLight ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.2)",
                          color: "#ef4444",
                        }}
                        title="Hapus kartu ini secara permanen"
                      >
                        🗑️ Hapus Permanen
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal Pop-up for Permanent Deletion */}
      <KanbanConfirmModal
        isOpen={showDeleteConfirm}
        title="Hapus Permanen Kartu?"
        message="Apakah kamu yakin ingin menghapus kartu ini secara permanen? Kartu ini, checklist, serta seluruh komentarnya akan dihapus selamanya dan tidak dapat dikembalikan."
        itemName={card.title}
        itemSubtext={`Kolom: ${listTitle}`}
        confirmLabel="Ya, Hapus Permanen"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDelete?.();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
