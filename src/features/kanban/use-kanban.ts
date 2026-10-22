"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KanbanBoard, KanbanCard } from "@/types/domain";
import { useLocalStoreValue } from "@/lib/storage/local-store";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  addCardToList as serviceAddCard,
  addList as serviceAddList,
  createNewBoard,
  deleteCard as serviceDeleteCard,
  deleteList as serviceDeleteList,
  getActiveBoardStorageKey,
  getStorageKey,
  INITIAL_BOARDS,
  moveCard as serviceMoveCard,
  moveList as serviceMoveList,
  parseStoredBoardId,
  parseStoredBoards,
  updateCard as serviceUpdateCard,
  updateListTitle as serviceUpdateListTitle,
} from "./kanban-service";
import { deleteCloudBoard, loadCloudBoards, upsertCloudBoard } from "./kanban-cloud";

export type KanbanSyncStatus = "synced" | "saving" | "offline" | "error";

const DELETED_BOARDS_PREFIX = "biarfokus.kanban.deleted";

function getDeletedBoardIds(userId?: string | null): Set<string> {
  if (typeof window === "undefined" || !userId) return new Set();
  try {
    const raw = window.localStorage.getItem(`${DELETED_BOARDS_PREFIX}.${userId}`);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {}
  return new Set();
}

function markBoardDeleted(boardId: string, userId?: string | null): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    const set = getDeletedBoardIds(userId);
    set.add(boardId);
    const arr = Array.from(set).slice(-100);
    window.localStorage.setItem(`${DELETED_BOARDS_PREFIX}.${userId}`, JSON.stringify(arr));
  } catch {}
}

const EMPTY_FALLBACK_BOARD: KanbanBoard = {
  id: "",
  title: "Ruang Kerja Baru",
  description: "",
  background: "biarfokus-white",
  starred: false,
  createdAt: "",
  updatedAt: "",
  lists: [],
};

export function useKanban(userId?: string | null) {
  const [boards, updateBoards] = useLocalStoreValue<KanbanBoard[]>(
    getStorageKey(userId),
    parseStoredBoards,
    INITIAL_BOARDS,
  );

  const [activeBoardIdRaw, setActiveBoardIdRaw] = useLocalStoreValue<string>(
    getActiveBoardStorageKey(userId),
    parseStoredBoardId,
    "",
  );

  const [syncStatus, setSyncStatus] = useState<KanbanSyncStatus>(userId ? "saving" : "offline");
  const syncInProgressRef = useRef(false);

  const activeBoardId = useMemo(() => {
    const clean = parseStoredBoardId(activeBoardIdRaw);
    return clean || (boards[0]?.id ?? "");
  }, [activeBoardIdRaw, boards]);

  const selectBoard = useCallback(
    (target: string | ((prev: string) => string)) => {
      if (typeof target === "function") {
        setActiveBoardIdRaw((prev) => {
          const cleanPrev = parseStoredBoardId(prev);
          const next = target(cleanPrev);
          return parseStoredBoardId(next);
        });
      } else {
        const clean = parseStoredBoardId(target);
        setActiveBoardIdRaw(() => clean);
      }
    },
    [setActiveBoardIdRaw],
  );

  // Core Bidirectional Cloud Sync
  const performCloudSync = useCallback(async () => {
    if (!userId) {
      setSyncStatus("offline");
      return;
    }
    if (syncInProgressRef.current) return;
    syncInProgressRef.current = true;
    setSyncStatus("saving");

    try {
      const supabase = getSupabaseBrowserClient();
      const cloudBoards = await loadCloudBoards(supabase, userId);
      const deletedIds = getDeletedBoardIds(userId);
      const cloudIds = new Set(cloudBoards.map((b) => b.id));

      // Read current local boards from storage safely
      const storageKey = getStorageKey(userId);
      let localBoards: KanbanBoard[] = [];
      if (typeof window !== "undefined") {
        try {
          const raw = window.localStorage.getItem(storageKey);
          if (raw) localBoards = parseStoredBoards(raw);
        } catch {}
      }

      // Also migrate any guest or legacy boards
      if (typeof window !== "undefined") {
        const potentialKeys = ["biarfokus.kanban.guest.boards", "biarfokus.kanban.boards"];
        for (const pk of potentialKeys) {
          try {
            const raw = window.localStorage.getItem(pk);
            if (raw) {
              const extraBoards = parseStoredBoards(raw);
              for (const eb of extraBoards) {
                if (eb.id && !localBoards.some((b) => b.id === eb.id)) {
                  localBoards.push({ ...eb, userId, role: "owner" });
                }
              }
              if (pk.includes("guest")) {
                window.localStorage.removeItem(pk);
              }
            }
          } catch {}
        }
      }

      // Build a comprehensive board map preserving all boards
      const boardMap = new Map<string, KanbanBoard>();

      // 1. First add all local boards (user-created boards are NEVER lost)
      for (const lb of localBoards) {
        if (lb.id && !deletedIds.has(lb.id)) {
          boardMap.set(lb.id, {
            ...lb,
            userId: lb.userId || userId,
            role: lb.role || "owner",
          });
        }
      }

      // 2. Merge cloud boards
      for (const cb of cloudBoards) {
        if (cb.id && !deletedIds.has(cb.id)) {
          const local = boardMap.get(cb.id);
          const isOwner = cb.userId === userId;
          const role = isOwner ? ("owner" as const) : cb.role;
          const resolved = { ...cb, role };

          if (!local) {
            boardMap.set(cb.id, resolved);
          } else {
            // Keep local lists if local has more cards or cloud lists are empty
            const localCardCount = local.lists?.reduce((sum, l) => sum + (l.cards?.length || 0), 0) || 0;
            const cloudCardCount = cb.lists?.reduce((sum, l) => sum + (l.cards?.length || 0), 0) || 0;
            if (localCardCount > cloudCardCount) {
              boardMap.set(cb.id, { ...resolved, lists: local.lists });
            } else {
              boardMap.set(cb.id, resolved);
            }
          }
        }
      }

      // 3. Find any boards missing in Supabase cloud and upload them
      const missingInCloud: KanbanBoard[] = [];
      for (const [id, board] of boardMap.entries()) {
        if (!cloudIds.has(id)) {
          if (!board.isShared || board.userId === userId || !board.userId || board.userId === "guest") {
            missingInCloud.push({ ...board, userId, role: "owner" });
          }
        }
      }

      if (missingInCloud.length > 0) {
        await Promise.allSettled(
          missingInCloud.map((b) => upsertCloudBoard(supabase, userId, b))
        );
      }

      const merged = Array.from(boardMap.values());
      updateBoards(() => merged);
      setSyncStatus("synced");
    } catch (err) {
      console.warn("[BiarFokus Kanban] Cloud sync error:", err);
      setSyncStatus("error");
    } finally {
      syncInProgressRef.current = false;
    }
  }, [userId, updateBoards]);

  // Real-time synchronization + Mount + Window/Tab Focus
  useEffect(() => {
    if (!userId) {
      setSyncStatus("offline");
      return;
    }

    let isCancelled = false;
    let supabase: ReturnType<typeof getSupabaseBrowserClient>;
    try {
      supabase = getSupabaseBrowserClient();
    } catch {
      setSyncStatus("offline");
      return;
    }

    // 1. Initial sync on mount or auth change
    void performCloudSync();

    // 2. Real-time Supabase postgres_changes channel
    const channelName = `kanban_realtime_${userId}_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "kanban_boards",
        },
        () => {
          if (!isCancelled) {
            void performCloudSync();
          }
        },
      )
      .subscribe();

    // 3. Tab visibility and window focus listeners (e.g. mobile browser returns from sleep/background)
    function handleFocusOrVisibility() {
      if (document.visibilityState === "visible" && !isCancelled) {
        void performCloudSync();
      }
    }

    window.addEventListener("focus", handleFocusOrVisibility);
    document.addEventListener("visibilitychange", handleFocusOrVisibility);

    return () => {
      isCancelled = true;
      void supabase.removeChannel(channel);
      window.removeEventListener("focus", handleFocusOrVisibility);
      document.removeEventListener("visibilitychange", handleFocusOrVisibility);
    };
  }, [userId, performCloudSync]);

  // Resolve current active board safely
  const activeBoard = useMemo(() => {
    const found = boards.find((b) => b.id === activeBoardId);
    const resolved = found || boards[0] || EMPTY_FALLBACK_BOARD;
    // CRITICAL: An owner can never be locked out as viewer on their own board
    if (userId && resolved.userId === userId && resolved.role !== "owner") {
      return { ...resolved, role: "owner" as const };
    }
    return resolved;
  }, [boards, activeBoardId, userId]);

  const syncBoardToCloud = useCallback(
    async (board: KanbanBoard) => {
      if (!userId) return;
      setSyncStatus("saving");
      try {
        const supabase = getSupabaseBrowserClient();
        const ok = await upsertCloudBoard(supabase, userId, board);
        setSyncStatus(ok ? "synced" : "error");
      } catch (err) {
        console.warn("Could not sync kanban board to cloud:", err);
        setSyncStatus("error");
      }
    },
    [userId],
  );

  const createBoard = useCallback(
    (title: string, background?: string, templateKey?: string) => {
      const board = createNewBoard(title, background, templateKey);
      if (userId) {
        board.userId = userId;
        board.role = "owner";
      }
      updateBoards((current) => [board, ...current]);
      selectBoard(board.id);
      void syncBoardToCloud(board);
      return board;
    },
    [updateBoards, selectBoard, syncBoardToCloud, userId],
  );

  const updateBoard = useCallback(
    (boardId: string, updates: Partial<KanbanBoard>) => {
      let updatedBoard: KanbanBoard | null = null;
      updateBoards((current) =>
        current.map((b) => {
          if (b.id === boardId) {
            updatedBoard = { ...b, ...updates };
            return updatedBoard;
          }
          return b;
        }),
      );
      if (updatedBoard) void syncBoardToCloud(updatedBoard);
    },
    [updateBoards, syncBoardToCloud],
  );

  const deleteBoard = useCallback(
    (boardId: string) => {
      markBoardDeleted(boardId, userId);

      updateBoards((current) => {
        const next = current.filter((b) => b.id !== boardId);
        return next;
      });

      if (activeBoardId === boardId) {
        selectBoard(() => {
          const remaining = boards.filter((b) => b.id !== boardId);
          return remaining[0]?.id || "";
        });
      }

      // Also clean up from guest storage if any ghost copy remains
      if (typeof window !== "undefined") {
        try {
          const guestKey = "biarfokus.kanban.guest.boards";
          const raw = window.localStorage.getItem(guestKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              window.localStorage.setItem(
                guestKey,
                JSON.stringify(parsed.filter((b: { id?: string }) => b?.id !== boardId)),
              );
            }
          }
        } catch {}
      }

      if (userId) {
        try {
          const supabase = getSupabaseBrowserClient();
          void deleteCloudBoard(supabase, userId, boardId);
        } catch (err) {
          console.warn("Gagal menghapus papan dari cloud:", err);
        }
      }
    },
    [updateBoards, activeBoardId, selectBoard, boards, userId],
  );

  const addCard = useCallback(
    (listId: string, title: string, meta?: Partial<KanbanCard>) => {
      let updatedBoard: KanbanBoard | null = null;
      updateBoards((current) =>
        current.map((b) => {
          if (b.id === activeBoard.id) {
            updatedBoard = serviceAddCard(b, listId, title, meta);
            return updatedBoard;
          }
          return b;
        }),
      );
      if (updatedBoard) void syncBoardToCloud(updatedBoard);
    },
    [activeBoard.id, updateBoards, syncBoardToCloud],
  );

  const updateCard = useCallback(
    (listId: string, cardId: string, updates: Partial<KanbanCard>) => {
      let updatedBoard: KanbanBoard | null = null;
      updateBoards((current) =>
        current.map((b) => {
          if (b.id === activeBoard.id) {
            updatedBoard = serviceUpdateCard(b, listId, cardId, updates);
            return updatedBoard;
          }
          return b;
        }),
      );
      if (updatedBoard) void syncBoardToCloud(updatedBoard);
    },
    [activeBoard.id, updateBoards, syncBoardToCloud],
  );

  const deleteCard = useCallback(
    (listId: string, cardId: string) => {
      let updatedBoard: KanbanBoard | null = null;
      updateBoards((current) =>
        current.map((b) => {
          if (b.id === activeBoard.id) {
            updatedBoard = serviceDeleteCard(b, listId, cardId);
            return updatedBoard;
          }
          return b;
        }),
      );
      if (updatedBoard) void syncBoardToCloud(updatedBoard);
    },
    [activeBoard.id, updateBoards, syncBoardToCloud],
  );

  const moveCard = useCallback(
    (sourceListId: string, destListId: string, sourceIndex: number, destIndex: number) => {
      let updatedBoard: KanbanBoard | null = null;
      updateBoards((current) =>
        current.map((b) => {
          if (b.id === activeBoard.id) {
            updatedBoard = serviceMoveCard(b, sourceListId, destListId, sourceIndex, destIndex);
            return updatedBoard;
          }
          return b;
        }),
      );
      if (updatedBoard) void syncBoardToCloud(updatedBoard);
    },
    [activeBoard.id, updateBoards, syncBoardToCloud],
  );

  const addList = useCallback(
    (title: string) => {
      let updatedBoard: KanbanBoard | null = null;
      updateBoards((current) =>
        current.map((b) => {
          if (b.id === activeBoard.id) {
            updatedBoard = serviceAddList(b, title);
            return updatedBoard;
          }
          return b;
        }),
      );
      if (updatedBoard) void syncBoardToCloud(updatedBoard);
    },
    [activeBoard.id, updateBoards, syncBoardToCloud],
  );

  const updateList = useCallback(
    (listId: string, title: string) => {
      let updatedBoard: KanbanBoard | null = null;
      updateBoards((current) =>
        current.map((b) => {
          if (b.id === activeBoard.id) {
            updatedBoard = serviceUpdateListTitle(b, listId, title);
            return updatedBoard;
          }
          return b;
        }),
      );
      if (updatedBoard) void syncBoardToCloud(updatedBoard);
    },
    [activeBoard.id, updateBoards, syncBoardToCloud],
  );

  const deleteList = useCallback(
    (listId: string) => {
      let updatedBoard: KanbanBoard | null = null;
      updateBoards((current) =>
        current.map((b) => {
          if (b.id === activeBoard.id) {
            updatedBoard = serviceDeleteList(b, listId);
            return updatedBoard;
          }
          return b;
        }),
      );
      if (updatedBoard) void syncBoardToCloud(updatedBoard);
    },
    [activeBoard.id, updateBoards, syncBoardToCloud],
  );

  const moveList = useCallback(
    (sourceIndex: number, destIndex: number) => {
      let updatedBoard: KanbanBoard | null = null;
      updateBoards((current) =>
        current.map((b) => {
          if (b.id === activeBoard.id) {
            updatedBoard = serviceMoveList(b, sourceIndex, destIndex);
            return updatedBoard;
          }
          return b;
        }),
      );
      if (updatedBoard) void syncBoardToCloud(updatedBoard);
    },
    [activeBoard.id, updateBoards, syncBoardToCloud],
  );

  const joinBoard = useCallback(
    (newBoard: KanbanBoard) => {
      updateBoards((current) => {
        const existing = current.find((b) => b.id === newBoard.id);
        const isOwner = Boolean(
          userId && (newBoard.userId === userId || existing?.userId === userId || existing?.role === "owner")
        );

        const safeBoard: KanbanBoard = isOwner
          ? { ...newBoard, role: "owner", isShared: newBoard.isShared }
          : newBoard;

        if (existing) {
          return current.map((b) =>
            b.id === safeBoard.id ? { ...b, ...safeBoard, role: isOwner ? "owner" : safeBoard.role } : b,
          );
        }
        return [safeBoard, ...current];
      });
      selectBoard(newBoard.id);
    },
    [updateBoards, selectBoard, userId],
  );

  return {
    boards,
    activeBoard,
    activeBoardId,
    syncStatus,
    forceSync: performCloudSync,
    selectBoard,
    setActiveBoardId: selectBoard,
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
    moveList,
    joinBoard,
  };
}

export type KanbanApi = ReturnType<typeof useKanban>;
