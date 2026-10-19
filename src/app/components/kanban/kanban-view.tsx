"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import type { KanbanCard } from "@/types/domain";
import { BOARD_BACKGROUNDS } from "@/features/kanban/kanban-service";
import { useKanban } from "@/features/kanban/use-kanban";
import { useOutsideClick } from "@/lib/hooks/use-dismiss";
import { KanbanColumn } from "./kanban-column";
import { KanbanCardDialog } from "./kanban-card-dialog";
import { KanbanBoardModal } from "./kanban-board-modal";

type KanbanViewProps = {
  userId?: string | null;
  onSendToFrog?: (cardTitle: string, boardTitle: string) => void;
};

export function KanbanView({ userId, onSendToFrog }: KanbanViewProps) {
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
  } = useKanban(userId);

  const [searchQuery, setSearchQuery] = useState("");
  const [boardModalOpen, setBoardModalOpen] = useState(false);
  const [activeCardData, setActiveCardData] = useState<{ card: KanbanCard; listId: string } | null>(null);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [isEditingBoardTitle, setIsEditingBoardTitle] = useState(false);
  const [boardTitleInput, setBoardTitleInput] = useState(activeBoard.title);
  const [bgMenuOpen, setBgMenuOpen] = useState(false);

  // Outside click dismiss for wallpaper dropdown
  const bgMenuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(bgMenuRef, () => setBgMenuOpen(false), bgMenuOpen);

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
        const checkMatch = card.checklists.some((c) =>
          c.items.some((i) => i.text.toLowerCase().includes(q)),
        );
        return titleMatch || descMatch || labelMatch || checkMatch;
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
    <div className={`kanban-container-frame ${isFullscreen ? "is-fullscreen" : ""}`}>
      <div
        ref={viewportRef}
        className={`kanban-main-viewport ${isLightBg ? "kanban-light-theme" : "kanban-dark-theme"} ${
          isFullscreen ? "is-fullscreen" : ""
        }`}
        style={{
          background: currentBg.value,
          color: currentBg.textColor,
        }}
      >
        {/* Top Header Bar (Screenshot 1) */}
      <div className="kanban-top-bar">
        <div className="kanban-left-controls">
          {/* Board Title */}
          {isEditingBoardTitle ? (
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
              className="kanban-board-title-input"
              autoFocus
            />
          ) : (
            <h1
              className="kanban-board-title"
              onClick={() => {
                setBoardTitleInput(activeBoard.title);
                setIsEditingBoardTitle(true);
              }}
              title="Klik untuk mengubah nama board"
            >
              {activeBoard.title}
            </h1>
          )}

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

        {/* Right Search Box & Actions */}
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

          {/* Fullscreen Button ("ngefulin") */}
          <button
            type="button"
            className="kanban-bar-btn kanban-fullscreen-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Keluar layar penuh (Esc)" : "Mode layar penuh"}
          >
            {isFullscreen ? "⤓ Perkecil" : "⛶ Layar Penuh"}
          </button>

          <button
            type="button"
            className="kanban-new-board-btn"
            onClick={() => setBoardModalOpen(true)}
          >
            + Board Baru
          </button>
        </div>
      </div>

      {/* Horizontal Kanban Columns Canvas */}
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

          {/* "+ Add another list" column (Screenshot 1) */}
          <div className="kanban-add-list-column">
            {isAddingList ? (
              <div className="kanban-add-list-composer">
                <input
                  type="text"
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
                  className="kanban-composer-input"
                  autoFocus
                />
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                  <button
                    type="button"
                    className="kanban-composer-add-btn"
                    onClick={handleAddListSubmit}
                    disabled={!newListTitle.trim()}
                  >
                    Add list
                  </button>
                  <button
                    type="button"
                    className="kanban-composer-cancel-btn"
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
        </div>
      </div>

      {/* Card Detail Dialog Modal */}
      {currentCardDetail && (
        <KanbanCardDialog
          card={currentCardDetail.card}
          listTitle={currentCardDetail.listTitle}
          onUpdate={(updates) => updateCard(currentCardDetail.listId, currentCardDetail.card.id, updates)}
          onDelete={() => {
            deleteCard(currentCardDetail.listId, currentCardDetail.card.id);
            setActiveCardData(null);
          }}
          onClose={() => setActiveCardData(null)}
          onSendToFrog={handleSendCardToFrog}
        />
      )}

      {/* Switch Boards & Templates Modal */}
      {boardModalOpen && (
        <KanbanBoardModal
          boards={boards}
          activeBoardId={activeBoardId}
          onSelectBoard={(id) => {
            selectBoard(id);
            setBoardModalOpen(false);
          }}
          onCreateBoard={createBoard}
          onDeleteBoard={deleteBoard}
          onClose={() => setBoardModalOpen(false)}
        />
      )}
      </div>
    </div>
  );
}
