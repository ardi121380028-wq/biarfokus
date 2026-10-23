"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import type { User } from "@supabase/supabase-js";
import type { KanbanBoard, KanbanBoardMember, KanbanCard, KanbanList, UserRole } from "@/types/domain";
import { BOARD_BACKGROUNDS } from "@/features/kanban/kanban-service";
import { joinBoardViaInviteApi, loadBoardMembersApi } from "@/features/kanban/kanban-cloud";
import { useKanban } from "@/features/kanban/use-kanban";
import { useCalendarEvents } from "@/features/calendar/use-calendar-events";
import { toISODate } from "@/features/calendar/calendar-service";
import { useOutsideClick } from "@/lib/hooks/use-dismiss";
import { KanbanSidebar } from "./kanban-sidebar";
import { KanbanColumn } from "./kanban-column";
import { KanbanCardDialog } from "./kanban-card-dialog";
import { KanbanBoardModal } from "./kanban-board-modal";
import { KanbanShareModal } from "./kanban-share-modal";
import { KanbanJoinModal } from "./kanban-join-modal";
import { useAppContext } from "@/app/providers/app-provider";
import { ProBadge } from "@/app/components/ui/pro-badge";

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
  const { isPro } = useAppContext();
  const {
    boards,
    activeBoard,
    activeBoardId,
    syncStatus,
    forceSync,
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

  const { addEvent: addCalendarEvent } = useCalendarEvents(userId);

  function handleScheduleCardToCalendar(card: KanbanCard) {
    const targetDate = card.dueDate || card.startDate || toISODate(new Date());
    addCalendarEvent({
      title: card.title,
      date: targetDate,
      startTime: "09:00",
      endTime: "10:00",
      color: "#0284c7",
      category: "task",
      description: card.description || "",
      linkedKanbanCardId: card.id,
      linkedKanbanBoardId: activeBoard.id,
      linkedKanbanBoardTitle: activeBoard.title,
    });
  }

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

  const { handleLogout } = useAppContext();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(profileMenuRef, () => setProfileMenuOpen(false));

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
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [boardModalOpen, setBoardModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const handleOpenShareModal = useCallback(() => {
    if (boards.length === 0 || !activeBoard.id) {
      setBoardModalOpen(true);
      return;
    }
    setShareModalOpen(true);
  }, [boards.length, activeBoard.id]);
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

  const [previewBoard, setPreviewBoard] = useState<KanbanBoard | null>(null);
  const [previewOwnerName, setPreviewOwnerName] = useState<string>("Pemilik Papan");
  const [autoJoinNotice, setAutoJoinNotice] = useState<string | null>(null);
  const autoJoinAttempted = useRef<string | null>(null);

  // Auto-join effect ONLY when user explicitly clicked "Masuk & Gabung" on the join modal
  useEffect(() => {
    if (!userId) return;

    let shouldAutoJoin = false;
    let codeToJoin: string | null = null;
    if (typeof window !== "undefined") {
      try {
        shouldAutoJoin = localStorage.getItem("biarfokus.pending_auto_join") === "true";
        codeToJoin =
          localStorage.getItem("biarfokus.pending_kanban_invite") ||
          new URL(window.location.href).searchParams.get("kanbanInvite") ||
          new URL(window.location.href).searchParams.get("invite");
      } catch {}
    }

    if (!shouldAutoJoin || !codeToJoin || autoJoinAttempted.current === codeToJoin) return;
    autoJoinAttempted.current = codeToJoin;

    void joinBoardViaInviteApi(codeToJoin).then((res) => {
      if (res.ok && res.board) {
        joinBoard(res.board);
        setPendingInviteCode(null);
        setPreviewBoard(null);
        setAutoJoinNotice(`🎉 Berhasil bergabung ke papan "${res.board.title}"!`);
        setTimeout(() => setAutoJoinNotice(null), 5000);

        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem("biarfokus.pending_auto_join");
            localStorage.removeItem("biarfokus.pending_kanban_invite");
            document.cookie = "bf_pending_invite=; path=/; max-age=0";
            if (window.history.replaceState) {
              const url = new URL(window.location.href);
              url.searchParams.delete("kanbanInvite");
              url.searchParams.delete("invite");
              window.history.replaceState({}, "", url.toString());
            }
          } catch {}
        }
      }
    });
  }, [userId, joinBoard]);



  const [activeCardData, setActiveCardData] = useState<{ card: KanbanCard; listId: string } | null>(null);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [isEditingBoardTitle, setIsEditingBoardTitle] = useState(false);
  const [boardTitleInput, setBoardTitleInput] = useState(activeBoard.title);
  const [bgMenuOpen, setBgMenuOpen] = useState(false);

  // Outside click dismiss for wallpaper dropdown
  const bgMenuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(bgMenuRef, () => setBgMenuOpen(false), bgMenuOpen);

  // Auto open create board modal if user has 0 boards and no pending invite
  // Dismiss invite modal immediately if user is already the owner of the board
  useEffect(() => {
    if (!pendingInviteCode) return;
    let targetBoardId: string | null = null;
    if (pendingInviteCode.startsWith("bf_inv_")) {
      try {
        let p = pendingInviteCode.slice("bf_inv_".length);
        if (p.startsWith("viewer_")) p = p.slice("viewer_".length);
        else if (p.startsWith("editor_")) p = p.slice("editor_".length);
        const json = JSON.parse(atob(p.replace(/-/g, "+").replace(/_/g, "/")));
        if (json?.b) targetBoardId = json.b;
      } catch {}
    }

    const matchingBoard = boards.find((b) => b.id === targetBoardId);
    const isOwnerOfInvited = matchingBoard
      ? Boolean(userId && (matchingBoard.userId === userId || matchingBoard.role === "owner"))
      : Boolean(activeBoard.id === targetBoardId && userId && (activeBoard.userId === userId || activeBoard.role === "owner"));

    if (isOwnerOfInvited) {
      console.log("[Kanban] User is owner of invited board; clearing invite code.");
      setPendingInviteCode(null);
      if (targetBoardId) selectBoard(targetBoardId);
      if (typeof window !== "undefined" && window.history.replaceState) {
        try {
          const url = new URL(window.location.href);
          url.searchParams.delete("kanbanInvite");
          url.searchParams.delete("invite");
          window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
        } catch {}
      }
    }
  }, [pendingInviteCode, boards, activeBoard, userId, selectBoard]);

  const hasAutoOpenedModal = useRef(false);
  useEffect(() => {
    if (boards.length === 0 && !pendingInviteCode && !hasAutoOpenedModal.current) {
      hasAutoOpenedModal.current = true;
      setBoardModalOpen(true);
    }
  }, [boards.length, pendingInviteCode]);

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

  const currentBoard: KanbanBoard = previewBoard || activeBoard;

  // Current background
  const currentBg = useMemo(() => {
    return (
      BOARD_BACKGROUNDS.find((b) => b.id === currentBoard.background) || BOARD_BACKGROUNDS[0]
    );
  }, [currentBoard.background]);

  const isLightBg = Boolean(
    currentBg.isLight ||
    currentBg.textColor === "#0f172a" ||
    currentBg.textColor === "#111111"
  );

  // Month and Year format for Catatan-style headline
  const [currentMonthYear, setCurrentMonthYear] = useState("Bulan Ini");
  useEffect(() => {
    try {
      setCurrentMonthYear(
        new Intl.DateTimeFormat("id-ID", {
          month: "long",
          year: "numeric",
        }).format(new Date()),
      );
    } catch {}
  }, []);

  const totalCardsCount = useMemo(() => {
    return currentBoard.lists.reduce((acc: number, l: KanbanList) => acc + (Array.isArray(l.cards) ? l.cards.length : 0), 0);
  }, [currentBoard.lists]);

  const isOwner = Boolean(
    userId &&
      ((currentBoard.userId && currentBoard.userId === userId) ||
        (!currentBoard.isShared && currentBoard.role === "owner") ||
        (currentBoard.role === "owner"))
  );

  // Permission check: read-only unless user is owner, editor, or private board
  const canEdit = useMemo(() => {
    if (isOwner) return true;
    if (previewBoard) return false;
    if (pendingInviteCode) return false;
    if (currentBoard.role === "viewer") return false;
    if (currentBoard.role === "editor") return true;
    return !currentBoard.isShared;
  }, [previewBoard, pendingInviteCode, isOwner, currentBoard.role, currentBoard.isShared]);

  // Filtered lists if search query is active
  const displayedLists = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentBoard.lists;

    return currentBoard.lists.map((list: KanbanList) => ({
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
  }, [currentBoard.lists, searchQuery]);

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
            linkedNoteTitle: `Kanban: ${currentBoard.title}`,
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
        onOpenShare={handleOpenShareModal}
        dark={dark}
        onToggleDark={onToggleDark}
      />

      {/* Mobile Backdrop for Expanded Sidebar */}
      {!sidebarCollapsed && (
        <div
          className="kanban-sidebar-mobile-backdrop"
          onClick={toggleSidebar}
          aria-label="Tutup menu navigasi"
        />
      )}

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

            {/* Breadcrumb Indicator (Desktop) */}
            <div className="kanban-breadcrumb-row">
              <span className="kanban-breadcrumb-root">Project Kanban</span>
              {boards.length > 0 && (
                <>
                  <span className="kanban-breadcrumb-sep">/</span>
                  <span className="kanban-breadcrumb-current">{currentBoard.title}</span>
                </>
              )}
            </div>

            {/* Mobile Board Title Pill (Click to open boards modal) */}
            {boards.length > 0 && (
              <button
                type="button"
                className="kanban-mobile-board-pill"
                onClick={() => setBoardModalOpen(true)}
                title="Ganti atau kelola papan"
              >
                <span className="mobile-board-title">🎯 {activeBoard.title}</span>
                <span className="mobile-board-caret">▾</span>
              </button>
            )}

            {/* Switch Boards Button (Desktop) */}
            <button
              type="button"
              className="kanban-bar-btn kanban-desktop-only-btn"
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
                className="kanban-bar-btn kanban-desktop-only-btn"
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
            {/* Desktop Search Box */}
            <div className="kanban-search-box kanban-desktop-search">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Cari kartu..."
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

            {/* Mobile Search Toggle Button */}
            <button
              type="button"
              className={`kanban-bar-btn kanban-mobile-search-toggle ${mobileSearchOpen ? "active" : ""}`}
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              title="Cari kartu"
              aria-label="Cari kartu"
            >
              🔍
            </button>

            {/* Realtime Cloud Sync Status Badge */}
            <button
              type="button"
              className={`kanban-sync-status-badge ${syncStatus}`}
              onClick={() => {
                if (!userId && onRequireLogin) {
                  onRequireLogin();
                } else {
                  void forceSync();
                }
              }}
              title={
                syncStatus === "synced"
                  ? "Tersinkron dengan cloud Supabase (Klik untuk perbarui data)"
                  : syncStatus === "saving"
                    ? "Sedang menyimpan ke cloud..."
                    : syncStatus === "offline"
                      ? "Mode Lokal / Belum login (Klik untuk login & sinkronkan)"
                      : "Gagal tersambung ke cloud (Klik untuk coba lagi)"
              }
            >
              <span className="sync-status-icon">
                {syncStatus === "synced" && "☁️"}
                {syncStatus === "saving" && "⏳"}
                {syncStatus === "offline" && "💻"}
                {syncStatus === "error" && "⚠️"}
              </span>
              <span className="sync-status-text">
                {syncStatus === "synced" && "Tersinkron"}
                {syncStatus === "saving" && "Menyimpan..."}
                {syncStatus === "offline" && "Mode Lokal"}
                {syncStatus === "error" && "Coba Lagi"}
              </span>
            </button>

            {/* Share & Invite Button */}
            <button
              type="button"
              className="kanban-bar-btn kanban-share-bar-btn"
              onClick={handleOpenShareModal}
              title="Bagikan papan atau undang teman"
            >
              <span className="share-btn-icon">👥</span>
              <span className="share-btn-text">Bagikan</span>
            </button>

            {/* Fullscreen Button */}
            <button
              type="button"
              className="kanban-bar-btn kanban-fullscreen-btn kanban-desktop-only-btn"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Keluar layar penuh (Esc)" : "Mode layar penuh"}
            >
              {isFullscreen ? "⤓" : "⛶"}
            </button>

            {/* Theme Toggle Button (matching homepage image 2) */}
            {onToggleDark && (
              <button
                type="button"
                className="icon-button modern-theme-btn kanban-topbar-icon-btn"
                onClick={onToggleDark}
                aria-label="Ganti mode gelap/terang"
                title={dark ? "Mode Terang" : "Mode Gelap"}
              >
                {dark ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>
            )}

            {/* Settings Button */}
            {onOpenSettings && (
              <button
                type="button"
                className="icon-button modern-shortcut-btn kanban-topbar-icon-btn"
                onClick={onOpenSettings}
                aria-label="Pengaturan"
                title="Pengaturan"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
            )}

            {/* Profile Avatar Dropdown Menu (Consistent across Kanban, Calendar, and Notes) */}
            <div className="cal-topbar-profile-wrap" ref={profileMenuRef}>
              {user ? (
                <div className="cal-topbar-profile-btn-row">
                  {isPro && <ProBadge size="sm" />}
                  <button
                    type="button"
                    className="cal-topbar-avatar-btn"
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    title={`Menu Akun: ${userName || "Pengguna"}`}
                    aria-label="Menu akun"
                  >
                    {userAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={userAvatar} alt="" className="cal-topbar-avatar-img" />
                    ) : (
                      <span className="cal-topbar-avatar-initial">
                        {(userName || "U").charAt(0).toUpperCase()}
                      </span>
                    )}
                    {isPro && <span className="profile-pro-dot" title="Pro Aktif" />}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="cal-topbar-login-btn"
                  onClick={onRequireLogin || onOpenProfile}
                  title="Masuk ke Akun BiarFokus"
                >
                  Masuk
                </button>
              )}

              {profileMenuOpen && (
                <div className="cal-topbar-profile-menu">
                  <div className="cal-profile-menu-header">
                    <strong>{userName || "Akun Saya"}</strong>
                    <span className="cal-profile-menu-sub">BiarFokus Workspace</span>
                  </div>
                  <button
                    type="button"
                    className="cal-profile-menu-item"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onOpenProfile?.();
                    }}
                  >
                    👤 Profil &amp; Akun
                  </button>
                  <button
                    type="button"
                    className="cal-profile-menu-item"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onNavigate?.("stats");
                    }}
                  >
                    📊 Statistik
                  </button>
                  {onOpenSettings && (
                    <button
                      type="button"
                      className="cal-profile-menu-item"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        onOpenSettings();
                      }}
                    >
                      ⚙️ Pengaturan
                    </button>
                  )}
                  {isPro ? (
                    <button
                      type="button"
                      className="cal-profile-menu-item"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        onNavigate?.("pricing");
                      }}
                    >
                      👑 BiarFokus Pro (Aktif)
                    </button>
                  ) : onNavigate && (
                    <button
                      type="button"
                      className="cal-profile-menu-item"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        onNavigate("pricing");
                      }}
                    >
                      💎 Upgrade Pro
                    </button>
                  )}
                  {handleLogout && (
                    <button
                      type="button"
                      className="cal-profile-menu-item danger"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        void handleLogout();
                      }}
                    >
                      🚪 Keluar
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview Mode Top Banner */}
        {previewBoard && (
          <div className="kanban-preview-banner">
            <div className="kanban-preview-banner-left">
              <span className="kanban-preview-badge">👁️ Mode Pratinjau</span>
              <span>
                Kamu sedang melihat papan <strong>{previewBoard.title}</strong>
                {previewOwnerName ? ` milik ${previewOwnerName}` : ""} sebagai tamu.
              </span>
            </div>
            <div className="kanban-preview-banner-actions">
              <button
                type="button"
                className="kanban-preview-join-btn"
                onClick={() => {
                  if (userId && pendingInviteCode) {
                    void joinBoardViaInviteApi(pendingInviteCode).then((res) => {
                      if (res.ok && res.board) {
                        joinBoard(res.board);
                        setPreviewBoard(null);
                        setPendingInviteCode(null);
                        setAutoJoinNotice(`🎉 Berhasil bergabung ke papan "${res.board.title}"!`);
                        setTimeout(() => setAutoJoinNotice(null), 5000);
                      }
                    });
                  } else {
                    if (pendingInviteCode) {
                      try {
                        localStorage.setItem("biarfokus.pending_kanban_invite", pendingInviteCode);
                        document.cookie = `bf_pending_invite=${encodeURIComponent(pendingInviteCode)}; path=/; max-age=86400; SameSite=Lax`;
                      } catch {}
                    }
                    onRequireLogin?.();
                  }
                }}
              >
                🚀 {userId ? "Gabung ke Papan" : "Login & Bergabung ke Projek"}
              </button>
              <button
                type="button"
                className="kanban-preview-close-btn"
                onClick={() => {
                  setPreviewBoard(null);
                  if (typeof window !== "undefined" && window.history.replaceState) {
                    const url = new URL(window.location.href);
                    url.searchParams.delete("kanbanInvite");
                    url.searchParams.delete("invite");
                    window.history.replaceState({}, "", url.toString());
                  }
                }}
              >
                ✕ Tutup Pratinjau
              </button>
            </div>
          </div>
        )}

        {/* Auto Join Toast Notification */}
        {autoJoinNotice && (
          <div className="kanban-autojoin-toast" role="alert">
            <span>{autoJoinNotice}</span>
            <button type="button" onClick={() => setAutoJoinNotice(null)}>✕</button>
          </div>
        )}

        {/* Mobile Search Input Bar */}
        {mobileSearchOpen && (
          <div className="kanban-mobile-search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Cari kartu di board..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="kanban-search-input"
              autoFocus
            />
            <button
              type="button"
              className="kanban-clear-search-btn"
              onClick={() => {
                setSearchQuery("");
                setMobileSearchOpen(false);
              }}
              aria-label="Tutup pencarian"
            >
              ✕
            </button>
          </div>
        )}

        {/* If no boards exist yet: show onboarding empty state */}
        {boards.length === 0 && !previewBoard ? (
          <div className="kanban-empty-workspace-state">
            <div className="kanban-empty-workspace-card">
              <span className="kanban-empty-workspace-icon" aria-hidden="true">
                📋
              </span>
              <h2 className="kanban-empty-workspace-title">Belum Ada Ruang Kerja / Papan Kanban</h2>
              <p className="kanban-empty-workspace-desc">
                Mulai atur pekerjaan, tugas harian, dan kolaborasi tim dengan membuat ruang kerja atau papan proyek pertamamu.
              </p>
              <button
                type="button"
                className="kanban-primary-btn kanban-empty-create-btn"
                onClick={() => setBoardModalOpen(true)}
              >
                ✨ + Buat Workspace / Papan Baru
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Notion / Catatan-Style Headline Section (Streamlined & Ramping) */}
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
                            setBoardTitleInput(currentBoard.title);
                            setIsEditingBoardTitle(true);
                          }
                        }}
                        title={canEdit ? "Klik untuk mengubah nama proyek" : currentBoard.title}
                        style={{ cursor: canEdit ? "pointer" : "default", color: currentBg.textColor }}
                      >
                        {currentBoard.title}
                        {canEdit && (
                          <span className="kanban-headline-edit-icon" aria-hidden="true">
                            ✏️
                          </span>
                        )}
                      </h1>
                    )}

                    {currentBoard.isShared && (
                      <span className="kanban-role-badge editor" title="Papan kolaborasi bersama tim">
                        👥 Tim
                      </span>
                    )}
                    {!isOwner && (!canEdit || currentBoard.role === "viewer") && (
                      <span className="kanban-role-badge viewer" title="Izin hanya lihat">
                        👁️ Viewer
                      </span>
                    )}
                  </div>

                  {/* Subtitle / Month & Year Badge & Stats (Catatan / Notion style, single line) */}
                  <div className="kanban-headline-meta-pills">
                    <span className="kanban-meta-pill date-pill">
                      📅 {currentMonthYear}
                    </span>
                    <span className="kanban-meta-pill count-pill">
                      📋 {currentBoard.lists.length} Kolom • 🗂️ {totalCardsCount} Kartu • 👥 {boardMembers.length > 0 ? boardMembers.length : 1} Anggota
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Read-Only Mode Banner */}
            {!canEdit && !isOwner && !previewBoard && (
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
                    onDirectMoveCard={moveCard}
                    allLists={displayedLists.map((l) => ({ id: l.id, title: l.title }))}
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
          </>
        )}
      </div>

      {/* Card Detail Dialog Modal */}
      {currentCardDetail && (
        <KanbanCardDialog
          card={currentCardDetail.card}
          listTitle={currentCardDetail.listTitle}
          currentListId={currentCardDetail.listId}
          boardLists={activeBoard.lists.map((l) => ({ id: l.id, title: l.title }))}
          onMoveToList={(destListId) => {
            if (destListId !== currentCardDetail.listId) {
              const cardId = currentCardDetail.card.id;
              const sourceList = activeBoard.lists.find((l) => l.id === currentCardDetail.listId);
              const sourceIndex = sourceList ? sourceList.cards.findIndex((c) => c.id === cardId) : 0;
              moveCard(currentCardDetail.listId, destListId, sourceIndex, 9999);
              setActiveCardData({ card: currentCardDetail.card, listId: destListId });
            }
          }}
          boardMembers={boardMembers}
          currentUserId={userId}
          boardLabels={activeBoard.labels}
          onUpdateBoardLabels={(newLabels) => updateBoard(activeBoard.id, { labels: newLabels })}
          readOnly={!canEdit}
          isLight={isLightBg}
          onUpdate={(updates) =>
            updateCard(currentCardDetail.listId, currentCardDetail.card.id, updates)
          }
          onDelete={() => deleteCard(currentCardDetail.listId, currentCardDetail.card.id)}
          onClose={() => setActiveCardData(null)}
          onSendToFrog={(card) => handleSendCardToFrog(card)}
          onScheduleToCalendar={handleScheduleCardToCalendar}
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
          isGuest={!userId}
          onRequireLogin={onRequireLogin}
          onRefreshBoards={forceSync}
        />
      )}

      {/* Share & Invite Modal */}
      {shareModalOpen && (
        <KanbanShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          board={activeBoard}
          userId={userId}
          userName={userName}
          userAvatar={userAvatar}
          userEmail={user?.email}
          onOpenCreateBoard={() => setBoardModalOpen(true)}
        />
      )}

      {/* Join Board Modal via Invite Link */}
      {pendingInviteCode && !previewBoard && (
        <KanbanJoinModal
          inviteCode={pendingInviteCode}
          userId={userId}
          userName={userName}
          onClose={() => setPendingInviteCode(null)}
          onJoined={(joinedBoard) => {
            joinBoard(joinedBoard);
            setPendingInviteCode(null);
            setPreviewBoard(null);
            setAutoJoinNotice(`🎉 Berhasil bergabung ke papan "${joinedBoard.title}"!`);
            setTimeout(() => setAutoJoinNotice(null), 5000);
          }}
          onPreview={(board, owner) => {
            setPreviewBoard(board);
            if (owner) setPreviewOwnerName(owner);
          }}
          onRequireLogin={onRequireLogin}
        />
      )}
    </div>
  );
}
