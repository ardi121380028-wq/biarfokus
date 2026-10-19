"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import type { User } from "@supabase/supabase-js";
import type { KanbanBoardMember, KanbanCard, UserRole } from "@/types/domain";
import { BOARD_BACKGROUNDS } from "@/features/kanban/kanban-service";
import { loadBoardMembersApi } from "@/features/kanban/kanban-cloud";
import { useKanban } from "@/features/kanban/use-kanban";
import { useOutsideClick } from "@/lib/hooks/use-dismiss";
import { KanbanSidebar } from "./kanban-sidebar";
import { KanbanColumn } from "./kanban-column";
import { KanbanCardDialog } from "./kanban-card-dialog";
import { KanbanBoardModal } from "./kanban-board-modal";
import { KanbanShareModal } from "./kanban-share-modal";
import { KanbanJoinModal } from "./kanban-join-modal";

type KanbanViewProps = {
  userId?: string | null;
  user?: User | null;
  userName?: string;
  userAvatar?: string | null;
  userRole?: UserRole;
  dark?: boolean;
  onToggleDark?: () => void;
  onOpenSettings?: () => void;
  onOpenProfile?: () => void;
  onNavigate?: (view: "timer" | "notes" | "calendar" | "kanban" | "stats" | "pricing" | "admin") => void;
  onSendToFrog?: (cardTitle: string, boardTitle: string) => void;
  onRequireLogin?: () => void;
};

export function KanbanView({
  userId,
  user,
  userName,
  userAvatar,
  dark,
  onToggleDark,
  onOpenSettings,
  onOpenProfile,
  onNavigate,
  onSendToFrog,
  onRequireLogin,
}: KanbanViewProps) {
  const {
    boards,
    activeBoard,
    activeBoardId,
    selectBoard,
    createBoard,
    updateBoard,
    deleteBoard,
    addCard,
    updateCard,
    deleteCard,
    moveCard,
    addList,
    updateList,
    deleteList,
    joinBoard,
  } = useKanban(userId);

  // Collapsible Sidebar state (persisted)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("biarfokus.kanban.sidebar_collapsed");
        if (stored !== null) return stored === "true";
        return window.innerWidth < 1024;
      } catch {}
    }
    return false;
  });

  function toggleSidebar() {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("biarfokus.kanban.sidebar_collapsed", String(next));
        } catch {}
      }
      return next;
    });
  }

  const [searchQuery, setSearchQuery] = useState("");
  const [boardModalOpen, setBoardModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [boardMembers, setBoardMembers] = useState<KanbanBoardMember[]>([]);
  const [pendingInviteCode, setPendingInviteCode] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        return url.searchParams.get("kanbanInvite") || url.searchParams.get("invite");
      } catch {}
    }
    return null;
  });

  const [activeCardData, setActiveCardData] = useState<{ card: KanbanCard; listId: string } | null>(null);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [isEditingBoardTitle, setIsEditingBoardTitle] = useState(false);
  const [boardTitleInput, setBoardTitleInput] = useState(activeBoard.title);
  const [bgMenuOpen, setBgMenuOpen] = useState(false);

  // Outside click dismiss for wallpaper dropdown
  const bgMenuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(bgMenuRef, () => setBgMenuOpen(false), bgMenuOpen);

  // Load board members for team avatar display and task PIC assignment
  useEffect(() => {
    if (!activeBoard.id) return;
    let cancelled = false;
    loadBoardMembersApi(activeBoard.id).then((members) => {
      if (!cancelled) setBoardMembers(members);
    });
    return () => {
      cancelled = true;
    };
  }, [activeBoard.id]);

  // Drag-to-scroll canvas state
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isPanningRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const [isPanning, setIsPanning] = useState(false);

  // Drag state
  const [draggedCardInfo, setDraggedCardInfo] = useState<{
    cardId: string;
    sourceListId: string;
    sourceIndex: number;
  } | null>(null);

  // Fullscreen container mode state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  function toggleFullscreen() {
    if (!isFullscreen) {
      setIsFullscreen(true);
      if (viewportRef.current?.requestFullscreen && !document.fullscreenElement) {
        viewportRef.current.requestFullscreen().catch(() => {});
      }
    } else {
      setIsFullscreen(false);
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }

  useEffect(() => {
    function handleFullscreenChange() {
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen]);

  // Current background
  const currentBg = useMemo(() => {
    return (
      BOARD_BACKGROUNDS.find((b) => b.id === activeBoard.background) || BOARD_BACKGROUNDS[0]
    );
  }, [activeBoard.background]);

  const isLightBg = Boolean(
    currentBg.isLight ||
    currentBg.textColor === "#0f172a" ||
    currentBg.textColor === "#111111"
  );

  // Month and Year format for Catatan-style headline
  const currentMonthYear = useMemo(() => {
    try {
      return new Intl.DateTimeFormat("id-ID", {
        month: "long",
        year: "numeric",
      }).format(new Date());
    } catch {
      return "Bulan Ini";
    }
  }, []);

  const totalCardsCount = useMemo(() => {
    return activeBoard.lists.reduce((acc, l) => acc + (Array.isArray(l.cards) ? l.cards.length : 0), 0);
  }, [activeBoard.lists]);

  // Permission check: read-only unless user is owner, editor, or private board
  const canEdit = useMemo(() => {
    if (pendingInviteCode) return false;
    if (activeBoard.role === "viewer") return false;
    return true;
  }, [pendingInviteCode, activeBoard.role]);

  // Filtered lists if search query is active
  const displayedLists = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return activeBoard.lists;

    return activeBoard.lists.map((list) => ({
      ...list,
      cards: list.cards.filter((card) => {
        const titleMatch = card.title.toLowerCase().includes(q);
        const descMatch = (card.description ?? "").toLowerCase().includes(q);
        const labelMatch = card.labels.some((l) => l.name.toLowerCase().includes(q));
        const picMatch = (card.assignees || []).some((a) => a.name.toLowerCase().includes(q));
        const checkMatch = card.checklists.some((c) =>
          c.items.some((i) => i.text.toLowerCase().includes(q)),
        );
        return titleMatch || descMatch || labelMatch || picMatch || checkMatch;
      }),
    }));
  }, [activeBoard.lists, searchQuery]);

  function handleSaveBoardTitle() {
    const trimmed = boardTitleInput.trim();
    if (trimmed && trimmed !== activeBoard.title) {
      updateBoard(activeBoard.id, { title: trimmed });
    } else {
      setBoardTitleInput(activeBoard.title);
    }
    setIsEditingBoardTitle(false);
  }

  function handleAddListSubmit() {
    const trimmed = newListTitle.trim();
    if (!trimmed) return;
    addList(trimmed);
    setNewListTitle("");
    setIsAddingList(false);
  }

  function handleDragStartCard(
    e: DragEvent<HTMLDivElement>,
    cardId: string,
    listId: string,
    index: number,
  ) {
    e.dataTransfer.setData("text/plain", cardId);
    e.dataTransfer.effectAllowed = "move";
    setDraggedCardInfo({ cardId, sourceListId: listId, sourceIndex: index });
  }

  function handleDragEndCard() {
    setDraggedCardInfo(null);
  }

  function handleDropCard(destListId: string, dropIndex: number) {
    if (!draggedCardInfo) return;
    const { sourceListId, sourceIndex } = draggedCardInfo;
    moveCard(sourceListId, destListId, sourceIndex, dropIndex);
    setDraggedCardInfo(null);
  }

  function handleSendCardToFrog(card: KanbanCard) {
    if (onSendToFrog) {
      onSendToFrog(card.title, activeBoard.title);
    } else if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("biarfokus:add-task-from-note", {
          detail: {
            title: card.title,
            linkedNoteId: activeBoard.id,
            linkedNoteTitle: `Kanban: ${activeBoard.title}`,
          },
        }),
      );
    }
  }

  function handleMouseDownCanvas(e: React.MouseEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("input") ||
      target.closest("textarea") ||
      target.closest(".kanban-card-item") ||
      target.closest(".kanban-add-card-composer") ||
      target.closest(".kanban-add-list-composer") ||
      target.closest(".kanban-dialog-backdrop") ||
      target.closest(".kanban-modal-backdrop") ||
      target.closest(".kanban-bg-dropdown") ||
      target.closest(".kanban-column-popover")
    ) {
      return;
    }

    const container = scrollContainerRef.current;
    if (!container) return;

    isPanningRef.current = true;
    startXRef.current = e.pageX - container.offsetLeft;
    scrollLeftRef.current = container.scrollLeft;
    setIsPanning(true);
  }

  function handleMouseMoveCanvas(e: React.MouseEvent<HTMLDivElement>) {
    if (!isPanningRef.current) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startXRef.current) * 1.35;
    container.scrollLeft = scrollLeftRef.current - walk;
  }

  function handleMouseUpCanvas() {
    isPanningRef.current = false;
    setIsPanning(false);
  }

  function handleMouseLeaveCanvas() {
    isPanningRef.current = false;
    setIsPanning(false);
  }

  function handleWheelCanvas(e: React.WheelEvent<HTMLDivElement>) {
    const container = scrollContainerRef.current;
    if (!container) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && !e.shiftKey) {
      container.scrollLeft += e.deltaY;
    }
  }

  // Active card for dialog
  const currentCardDetail = (() => {
    if (!activeCardData) return null;
    for (const list of activeBoard.lists) {
      const found = list.cards.find((c) => c.id === activeCardData.card.id);
      if (found) {
        return { card: found, listTitle: list.title, listId: list.id };
      }
    }
    return null;
  })();

  return (
    <div className={`kanban-app-workspace ${isLightBg ? "kanban-light-theme" : "kanban-dark-theme"} ${isFullscreen ? "is-fullscreen" : ""}`}>
      {/* Left Collapsible Sidebar */}
      <KanbanSidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        boards={boards}
        activeBoardId={activeBoardId}
        onSelectBoard={selectBoard}
        onCreateBoardModalOpen={() => setBoardModalOpen(true)}
        onDeleteBoard={deleteBoard}
        onNavigate={(view) => {
          if (onNavigate) onNavigate(view);
        }}
        onOpenSettings={onOpenSettings}
        onOpenShare={() => setShareModalOpen(true)}
        dark={dark}
        onToggleDark={onToggleDark}
      />

      {/* Main Kanban Content Area */}
      <div
        ref={viewportRef}
        className="kanban-workspace-content"
        style={{
          background: currentBg.value,
          color: currentBg.textColor,
        }}
      >
        {/* Top Header Bar (with Trello-style Profile on the Right) */}
        <div className="kanban-top-bar">
          <div className="kanban-left-controls">
            {sidebarCollapsed && (
              <button
                type="button"
                className="kanban-bar-btn kanban-sidebar-open-pill"
                onClick={toggleSidebar}
                title="Buka menu navigasi & daftar papan"
              >
                <span>☰</span>
                <span className="kanban-sidebar-open-label">Papan</span>
              </button>
            )}

            {/* Breadcrumb Indicator */}
            <div className="kanban-breadcrumb-row">
              <span className="kanban-breadcrumb-root">Project Canban</span>
              <span className="kanban-breadcrumb-sep">/</span>
              <span className="kanban-breadcrumb-current">{activeBoard.title}</span>
            </div>

            {/* Switch Boards Button */}
            <button
              type="button"
              className="kanban-bar-btn"
              onClick={() => {
                setBgMenuOpen(false);
                setBoardModalOpen(true);
              }}
              title="Ganti atau buat board baru"
            >
              🗂️ Switch boards ({boards.length})
            </button>

            {/* Background Wallpaper Switcher */}
            <div style={{ position: "relative" }} ref={bgMenuRef}>
              <button
                type="button"
                className="kanban-bar-btn"
                onClick={() => setBgMenuOpen(!bgMenuOpen)}
                title="Ganti wallpaper background"
              >
                🎨 Wallpaper
              </button>
              {bgMenuOpen && (
                <div className="kanban-bg-dropdown">
                  {BOARD_BACKGROUNDS.map((bg) => (
                    <button
                      key={bg.id}
                      type="button"
                      className={`kanban-bg-item ${bg.id === activeBoard.background ? "active" : ""}`}
                      onClick={() => {
                        updateBoard(activeBoard.id, { background: bg.id });
                        setBgMenuOpen(false);
                      }}
                    >
                      <span className="bg-preview-swatch" style={{ background: bg.value }} />
                      <span>{bg.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Search Box, Actions, & Profile (Trello-style) */}
          <div className="kanban-right-controls">
            <div className="kanban-search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Cari kartu di board..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="kanban-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="kanban-clear-search-btn"
                  onClick={() => setSearchQuery("")}
                  aria-label="Bersihkan pencarian"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Share & Invite Button */}
            <button
              type="button"
              className="kanban-bar-btn kanban-share-bar-btn"
              onClick={() => setShareModalOpen(true)}
              title="Bagikan papan atau undang teman"
            >
              👥 Bagikan
            </button>

            {/* Fullscreen Button */}
            <button
              type="button"
              className="kanban-bar-btn kanban-fullscreen-btn"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Keluar layar penuh (Esc)" : "Mode layar penuh"}
            >
              {isFullscreen ? "⤓ Perkecil" : "⛶ Layar Penuh"}
            </button>

            {/* Profile Avatar on Top Right (Trello-style!) */}
            {user ? (
              <button
                type="button"
                className="kanban-top-profile-avatar-btn"
                onClick={onOpenProfile}
                title={`Profil Akun: ${userName || "Pengguna"}`}
                aria-label="Buka profil akun"
              >
                {userAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={userAvatar} alt="" className="kanban-avatar-img" />
                ) : (
                  <span className="kanban-avatar-fallback">
                    {(userName || "U").charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="kanban-avatar-status-dot" />
              </button>
            ) : (
              <button
                type="button"
                className="kanban-bar-btn kanban-signin-pill"
                onClick={onRequireLogin}
                title="Masuk ke Akun BiarFokus"
              >
                🔐 Masuk
              </button>
            )}
          </div>
        </div>

        {/* Notion / Catatan-Style Headline Section (Image 3) */}
        <div className="kanban-workspace-headline">
          <div className="kanban-headline-left">
            <span className="kanban-headline-emoji">🎯</span>
            <div className="kanban-headline-titles">
              <div className="kanban-headline-title-interactive">
                {canEdit && isEditingBoardTitle ? (
                  <input
                    type="text"
                    value={boardTitleInput}
                    onChange={(e) => setBoardTitleInput(e.target.value)}
                    onBlur={handleSaveBoardTitle}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveBoardTitle();
                      if (e.key === "Escape") {
                        setBoardTitleInput(activeBoard.title);
                        setIsEditingBoardTitle(false);
                      }
                    }}
                    className="kanban-headline-input"
                    autoFocus
                  />
                ) : (
                  <h1
                    className="kanban-headline-main-title"
                    onClick={() => {
                      if (canEdit) {
                        setBoardTitleInput(activeBoard.title);
                        setIsEditingBoardTitle(true);
                      }
                    }}
                    title={canEdit ? "Klik untuk mengubah nama proyek" : activeBoard.title}
                    style={{ cursor: canEdit ? "pointer" : "default" }}
                  >
                    {activeBoard.title}
                    {canEdit && (
                      <span className="kanban-headline-edit-icon" aria-hidden="true">
                        ✏️
                      </span>
                    )}
                  </h1>
                )}

                {activeBoard.isShared && (
                  <span className="kanban-role-badge editor" title="Papan kolaborasi bersama tim">
                    👥 Tim
                  </span>
                )}
                {(!canEdit || activeBoard.role === "viewer") && (
                  <span className="kanban-role-badge viewer" title="Izin hanya lihat">
                    👁️ Viewer / Read Only
                  </span>
                )}
              </div>

              {/* Subtitle / Month & Year Badge & Stats (Catatan / Notion style) */}
              <div className="kanban-headline-meta-pills">
                <span className="kanban-meta-pill date-pill">
                  📅 {currentMonthYear}
                </span>
                <span className="kanban-meta-pill count-pill">
                  📋 {activeBoard.lists.length} Kolom • 🗂️ {totalCardsCount} Kartu • 👥 {boardMembers.length > 0 ? boardMembers.length : 1} Anggota
                </span>
                <span className="kanban-meta-pill updated-pill">
                  🕒 Diperbarui {activeBoard.updatedAt}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Read-Only Mode Banner */}
        {!canEdit && (
          <div className="kanban-readonly-notice-banner">
            <div className="readonly-banner-info">
              <span className="readonly-banner-icon">🔒</span>
              <span>
                <strong>Mode Hanya Lihat:</strong>{" "}
                {pendingInviteCode
                  ? "Kamu memiliki undangan untuk berkolaborasi di papan ini. Konfirmasi bergabung untuk mengedit tugas."
                  : "Papan ini sedang dalam mode hanya lihat. Kamu belum menjadi editor pada papan ini."}
              </span>
            </div>
            {pendingInviteCode ? (
              <button
                type="button"
                className="kanban-bar-btn kanban-share-bar-btn"
                onClick={() => setPendingInviteCode(pendingInviteCode)}
              >
                🤝 Konfirmasi &amp; Gabung
              </button>
            ) : null}
          </div>
        )}

        {/* Horizontal Kanban Columns Canvas with internal vertical scroll */}
        <div
          className={`kanban-canvas-scroll ${isPanning ? "is-panning" : ""}`}
          ref={scrollContainerRef}
          onMouseDown={handleMouseDownCanvas}
          onMouseMove={handleMouseMoveCanvas}
          onMouseUp={handleMouseUpCanvas}
          onMouseLeave={handleMouseLeaveCanvas}
          onWheel={handleWheelCanvas}
        >
          <div className="kanban-columns-row">
            {displayedLists.map((list) => (
              <KanbanColumn
                key={list.id}
                list={list}
                readOnly={!canEdit}
                onCardClick={(card, listId) => setActiveCardData({ card, listId })}
                onSendToFrog={handleSendCardToFrog}
                onAddCard={addCard}
                onUpdateTitle={updateList}
                onDeleteList={deleteList}
                onDragStartCard={handleDragStartCard}
                onDragEndCard={handleDragEndCard}
                onDropCard={handleDropCard}
              />
            ))}

            {/* Add New List Column (Only for Editors/Owners) */}
            {canEdit && (
              <div className="kanban-add-list-column">
                {isAddingList ? (
                  <div className="kanban-add-list-composer">
                    <input
                      type="text"
                      className="kanban-add-list-input"
                      placeholder="Enter list title..."
                      value={newListTitle}
                      onChange={(e) => setNewListTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddListSubmit();
                        if (e.key === "Escape") {
                          setIsAddingList(false);
                          setNewListTitle("");
                        }
                      }}
                      autoFocus
                    />
                    <div className="kanban-add-list-actions">
                      <button
                        type="button"
                        className="kanban-add-list-btn"
                        onClick={handleAddListSubmit}
                        disabled={!newListTitle.trim()}
                      >
                        Add list
                      </button>
                      <button
                        type="button"
                        className="kanban-cancel-list-btn"
                        onClick={() => {
                          setIsAddingList(false);
                          setNewListTitle("");
                        }}
                        aria-label="Batal"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="kanban-add-list-prompt-btn"
                    onClick={() => setIsAddingList(true)}
                  >
                    + Add another list
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Detail Dialog Modal */}
      {currentCardDetail && (
        <KanbanCardDialog
          card={currentCardDetail.card}
          listTitle={currentCardDetail.listTitle}
          boardMembers={boardMembers}
          currentUserId={userId}
          boardLabels={activeBoard.labels}
          onUpdateBoardLabels={(newLabels) => updateBoard(activeBoard.id, { labels: newLabels })}
          readOnly={!canEdit}
          onUpdate={(updates) =>
            updateCard(currentCardDetail.listId, currentCardDetail.card.id, updates)
          }
          onDelete={() => deleteCard(currentCardDetail.listId, currentCardDetail.card.id)}
          onClose={() => setActiveCardData(null)}
          onSendToFrog={(card) => handleSendCardToFrog(card)}
        />
      )}

      {/* Switch Boards Modal */}
      {boardModalOpen && (
        <KanbanBoardModal
          boards={boards}
          activeBoardId={activeBoard.id}
          onSelectBoard={(id) => {
            selectBoard(id);
            setBoardModalOpen(false);
          }}
          onCreateBoard={createBoard}
          onDeleteBoard={deleteBoard}
          onClose={() => setBoardModalOpen(false)}
        />
      )}

      {/* Share & Invite Modal */}
      {shareModalOpen && (
        <KanbanShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          board={activeBoard}
          userId={userId}
        />
      )}

      {/* Join Board Modal via Invite Link */}
      {pendingInviteCode && (
        <KanbanJoinModal
          inviteCode={pendingInviteCode}
          userId={userId}
          onClose={() => setPendingInviteCode(null)}
          onJoined={(joinedBoard) => {
            joinBoard(joinedBoard);
            setPendingInviteCode(null);
          }}
          onRequireLogin={onRequireLogin}
        />
      )}
    </div>
  );
}
