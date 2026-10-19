"use client";

import { useCallback, useEffect, useMemo } from "react";
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

export function useKanban(userId?: string | null) {
  const [boards, updateBoards] = useLocalStoreValue<KanbanBoard[]>(
    getStorageKey(userId),
    parseStoredBoards,
    INITIAL_BOARDS,
  );

  const [activeBoardIdRaw, setActiveBoardIdRaw] = useLocalStoreValue<string>(
    getActiveBoardStorageKey(userId),
    parseStoredBoardId,
    INITIAL_BOARDS[0].id,
  );

  const activeBoardId = useMemo(() => {
    const clean = parseStoredBoardId(activeBoardIdRaw);
    return clean || (boards[0]?.id ?? INITIAL_BOARDS[0].id);
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

  // Cloud sync on mount when authenticated
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    let supabase: ReturnType<typeof getSupabaseBrowserClient>;
    try {
      supabase = getSupabaseBrowserClient();
    } catch {
      return;
    }

    void loadCloudBoards(supabase, userId).then((cloudBoards) => {
      if (cancelled) return;
      if (cloudBoards && cloudBoards.length > 0) {
        updateBoards(() => cloudBoards);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [userId, updateBoards]);

  // Resolve current active board safely
  const activeBoard = useMemo(() => {
    const found = boards.find((b) => b.id === activeBoardId);
    return found || boards[0] || INITIAL_BOARDS[0];
  }, [boards, activeBoardId]);

  const syncBoardToCloud = useCallback(
    (board: KanbanBoard) => {
      if (!userId) return;
      try {
        const supabase = getSupabaseBrowserClient();
        void upsertCloudBoard(supabase, userId, board);
      } catch (err) {
        console.warn("Could not sync kanban board to cloud:", err);
      }
    },
    [userId],
  );

  const createBoard = useCallback(
    (title: string, background?: string, templateKey?: string) => {
      const board = createNewBoard(title, background, templateKey);
      updateBoards((current) => [board, ...current]);
      selectBoard(board.id);
      syncBoardToCloud(board);
      return board;
    },
    [updateBoards, selectBoard, syncBoardToCloud],
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
      if (updatedBoard) syncBoardToCloud(updatedBoard);
    },
    [updateBoards, syncBoardToCloud],
  );

  const deleteBoard = useCallback(
    (boardId: string) => {
      updateBoards((current) => {
        const next = current.filter((b) => b.id !== boardId);
        if (next.length === 0) {
          return INITIAL_BOARDS;
        }
        return next;
      });

      if (activeBoardId === boardId) {
        selectBoard(() => {
          const remaining = boards.filter((b) => b.id !== boardId);
          return remaining[0]?.id || INITIAL_BOARDS[0].id;
        });
      }

      if (userId) {
        try {
          const supabase = getSupabaseBrowserClient();
          void deleteCloudBoard(supabase, userId, boardId);
        } catch {}
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
      if (updatedBoard) syncBoardToCloud(updatedBoard);
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
      if (updatedBoard) syncBoardToCloud(updatedBoard);
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
      if (updatedBoard) syncBoardToCloud(updatedBoard);
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
      if (updatedBoard) syncBoardToCloud(updatedBoard);
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
      if (updatedBoard) syncBoardToCloud(updatedBoard);
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
      if (updatedBoard) syncBoardToCloud(updatedBoard);
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
      if (updatedBoard) syncBoardToCloud(updatedBoard);
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
      if (updatedBoard) syncBoardToCloud(updatedBoard);
    },
    [activeBoard.id, updateBoards, syncBoardToCloud],
  );

  return {
    boards,
    activeBoard,
    activeBoardId,
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
  };
}

export type KanbanApi = ReturnType<typeof useKanban>;
