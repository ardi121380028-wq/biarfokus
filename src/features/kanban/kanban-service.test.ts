import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addCardToList,
  addList,
  archiveCard,
  createDefaultGrowthBoard,
  createNewBoard,
  deleteBoardLabel,
  deleteCard,
  deleteList,
  LABEL_PALETTE,
  moveCard,
  moveList,
  normalizeBoard,
  parseStoredBoardId,
  parseStoredBoards,
  resolveBoardAvailableLabels,
  restoreCard,
  TEMPLATES,
  updateCard,
  updateListTitle,
} from "./kanban-service.ts";

describe("kanban-service", () => {
  it("creates default growth board with expected columns and cards", () => {
    const board = createDefaultGrowthBoard();
    assert.equal(board.id, "board-gt-growth");
    assert.equal(board.title, "GT - Growth");
    assert.equal(board.lists.length, 6);

    const listTitles = board.lists.map((l) => l.title);
    assert.deepEqual(listTitles, [
      "Project Resources",
      "Questions For Next Meeting",
      "101 Crucial",
      "To Do",
      "Blocked",
      "Done",
    ]);

    const todoList = board.lists.find((l) => l.title === "To Do");
    assert.ok(todoList);
    assert.ok(todoList.cards.length >= 4);

    const nameCompanyCard = todoList.cards.find((c) => c.title === "Name Company");
    assert.ok(nameCompanyCard);
    assert.equal(nameCompanyCard.checklists.length, 1);
    assert.equal(nameCompanyCard.checklists[0].items.length, 3);
  });

  it("adds a card to a list and prevents blank titles", () => {
    const board = createDefaultGrowthBoard();
    const listId = board.lists[0].id;
    const initialCount = board.lists[0].cards.length;

    const updated = addCardToList(board, listId, "   ");
    assert.equal(updated.lists[0].cards.length, initialCount);

    const added = addCardToList(board, listId, "Fitur Baru");
    assert.equal(added.lists[0].cards.length, initialCount + 1);
    assert.equal(added.lists[0].cards[initialCount].title, "Fitur Baru");
  });

  it("updates and deletes a card correctly", () => {
    const board = createDefaultGrowthBoard();
    const list = board.lists[0];
    const cardId = list.cards[0].id;

    const updated = updateCard(board, list.id, cardId, {
      description: "Deskripsi diperbarui",
      frog: true,
      pomodoros: 4,
    });

    const targetCard = updated.lists[0].cards.find((c) => c.id === cardId);
    assert.ok(targetCard);
    assert.equal(targetCard.description, "Deskripsi diperbarui");
    assert.equal(targetCard.frog, true);
    assert.equal(targetCard.pomodoros, 4);

    const deleted = deleteCard(updated, list.id, cardId);
    assert.equal(deleted.lists[0].cards.some((c) => c.id === cardId), false);
  });

  it("archives and restores a card correctly", () => {
    const board = createDefaultGrowthBoard();
    const list = board.lists[0];
    const cardId = list.cards[0].id;

    const archived = archiveCard(board, list.id, cardId);
    const archivedCard = archived.lists[0].cards.find((c) => c.id === cardId);
    assert.ok(archivedCard);
    assert.equal(archivedCard.archived, true);

    // Verify normalizeBoard preserves the archived flag (e.g. after storage / cloud sync)
    const normalized = normalizeBoard(archived);
    const normalizedCard = normalized.lists[0].cards.find((c) => c.id === cardId);
    assert.ok(normalizedCard);
    assert.equal(normalizedCard.archived, true);

    const restored = restoreCard(archived, list.id, cardId);
    const restoredCard = restored.lists[0].cards.find((c) => c.id === cardId);
    assert.ok(restoredCard);
    assert.equal(restoredCard.archived, false);
  });

  it("moves a card within the same list (reordering)", () => {
    const board = createDefaultGrowthBoard();
    const list = board.lists[2]; // 101 Crucial (4 cards)
    const card0 = list.cards[0].id;
    const card1 = list.cards[1].id;

    const moved = moveCard(board, list.id, list.id, 0, 1);
    const movedList = moved.lists.find((l) => l.id === list.id);
    assert.ok(movedList);
    assert.equal(movedList.cards[0].id, card1);
    assert.equal(movedList.cards[1].id, card0);
  });

  it("moves a card from one list to another list", () => {
    const board = createDefaultGrowthBoard();
    const sourceList = board.lists[3]; // To Do
    const destList = board.lists[5]; // Done
    const cardToMove = sourceList.cards[0];

    const moved = moveCard(board, sourceList.id, destList.id, 0, 0);

    const newSource = moved.lists.find((l) => l.id === sourceList.id);
    const newDest = moved.lists.find((l) => l.id === destList.id);

    assert.ok(newSource && newDest);
    assert.equal(newSource.cards.some((c) => c.id === cardToMove.id), false);
    assert.equal(newDest.cards[0].id, cardToMove.id);
  });

  it("adds, renames and deletes columns / lists", () => {
    const board = createDefaultGrowthBoard();

    const withNewList = addList(board, "Archived / Icebox");
    const lastList = withNewList.lists[withNewList.lists.length - 1];
    assert.equal(lastList.title, "Archived / Icebox");

    const renamed = updateListTitle(withNewList, lastList.id, "Cold Storage");
    const renamedList = renamed.lists.find((l) => l.id === lastList.id);
    assert.ok(renamedList);
    assert.equal(renamedList.title, "Cold Storage");

    const deleted = deleteList(renamed, lastList.id);
    assert.equal(deleted.lists.some((l) => l.id === lastList.id), false);
  });

  it("reorders lists with moveList", () => {
    const board = createDefaultGrowthBoard();
    const firstListId = board.lists[0].id;
    const secondListId = board.lists[1].id;

    const moved = moveList(board, 0, 1);
    assert.equal(moved.lists[0].id, secondListId);
    assert.equal(moved.lists[1].id, firstListId);
  });

  it("creates new board from templates correctly", () => {
    const custom = createNewBoard("Proyek Klien X", "emerald-forest");
    assert.equal(custom.title, "Proyek Klien X");
    assert.equal(custom.background, "emerald-forest");
    assert.equal(custom.lists.length, 3);

    const scrum = createNewBoard("Sprint 42", "purple-haze", "scrum");
    assert.equal(scrum.title, "Sprint 42");
    assert.equal(scrum.background, "purple-haze");
    assert.ok(scrum.lists.some((l) => l.title === "Code Review / QA"));

    assert.equal(TEMPLATES.length, 4);
  });

  it("parses stored boards safely with fallback on corrupt JSON", () => {
    const parsedNull = parseStoredBoards(null);
    assert.ok(Array.isArray(parsedNull));
    assert.equal(parsedNull.length, 0);

    const parsedCorrupt = parseStoredBoards("not-json-at-all");
    assert.ok(Array.isArray(parsedCorrupt));
    assert.equal(parsedCorrupt.length, 0);

    const customBoard = createNewBoard("Saved Board");
    const parsedValid = parseStoredBoards(JSON.stringify([customBoard]));
    assert.equal(parsedValid.length, 1);
    assert.equal(parsedValid[0].title, "Saved Board");
  });

  it("parses stored active board ID cleanly across JSON-quotes and plain strings", () => {
    assert.equal(parseStoredBoardId(null), "");
    assert.equal(parseStoredBoardId(""), "");
    assert.equal(parseStoredBoardId("board-growth"), "board-growth");
    // Handled JSON stringified string with quotes
    assert.equal(parseStoredBoardId(JSON.stringify("board-growth")), "board-growth");
    assert.equal(parseStoredBoardId('"board-growth"'), "board-growth");
    assert.equal(parseStoredBoardId("'board-growth'"), "board-growth");
  });

  it("normalizes incomplete board payloads defensively", () => {
    const rawIncomplete = {
      id: "board-custom",
      title: "Incomplete Board",
      lists: [
        {
          id: "list-1",
          title: "To Do",
          cards: [
            {
              id: "card-1",
              title: "Card without checklists or labels",
            },
          ],
        },
      ],
    };

    const normalized = normalizeBoard(rawIncomplete);
    assert.equal(normalized.id, "board-custom");
    assert.equal(normalized.title, "Incomplete Board");
    assert.ok(Array.isArray(normalized.lists));
    assert.ok(Array.isArray(normalized.lists[0].cards));
    assert.ok(Array.isArray(normalized.lists[0].cards[0].checklists));
    assert.ok(Array.isArray(normalized.lists[0].cards[0].labels));
    assert.ok(Array.isArray(normalized.lists[0].cards[0].comments));
  });

  it("maps database board with collaborative owner and shared role properly", async () => {
    const { mapDbKanbanBoard } = await import("./kanban-cloud.ts");
    const rawDbBoard = {
      id: "board-1",
      user_id: "user-owner-123",
      title: "Shared Project",
      description: "Tim project",
      background: "wave-blue",
      lists: [],
      starred: true,
      created_at: "2026-10-19T10:00:00.000Z",
      updated_at: "2026-10-19T11:00:00.000Z",
    };

    const ownedBoard = mapDbKanbanBoard(rawDbBoard, "user-owner-123");
    assert.equal(ownedBoard.role, "owner");
    assert.equal(ownedBoard.isShared, false);
    assert.equal(ownedBoard.userId, "user-owner-123");

    const sharedEditorBoard = mapDbKanbanBoard(rawDbBoard, "user-teammate-456", "editor");
    assert.equal(sharedEditorBoard.role, "editor");
    assert.equal(sharedEditorBoard.isShared, true);

    const sharedViewerBoard = mapDbKanbanBoard(rawDbBoard, "user-teammate-456", "viewer");
    assert.equal(sharedViewerBoard.role, "viewer");
    assert.equal(sharedViewerBoard.isShared, true);

    const defaultSharedBoard = mapDbKanbanBoard(rawDbBoard, "user-teammate-456");
    assert.equal(defaultSharedBoard.role, "viewer");
    assert.equal(defaultSharedBoard.isShared, true);
  });

  it("handles createBoardInviteApi payload with board snapshot gracefully", async () => {
    const { createBoardInviteApi } = await import("./kanban-cloud.ts");

    let capturedUrl = "";
    let capturedBody: Record<string, unknown> | null = null;
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      capturedUrl = String(url);
      capturedBody = JSON.parse(String(init?.body || "{}"));
      return new Response(JSON.stringify({ ok: true, inviteCode: "bf_inv_test123", role: "editor" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    try {
      const board = createNewBoard("Bismillah Project", "biarfokus-white");
      const res = await createBoardInviteApi(board, "editor");

      assert.equal(res.ok, true);
      assert.equal(res.inviteCode, "bf_inv_test123");
      assert.equal(capturedUrl, "/api/kanban/invite");
      assert.ok(capturedBody);
      const body = capturedBody as {
        boardId: string;
        role: string;
        board: { title: string; background: string; lists: unknown[] };
      };
      assert.equal(body.boardId, board.id);
      assert.equal(body.role, "editor");
      assert.equal(body.board.title, "Bismillah Project");
      assert.equal(body.board.background, "biarfokus-white");
      assert.ok(Array.isArray(body.board.lists));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("resolves available labels across all cards on the board and prevents duplicate names", () => {
    const rawBoard = createNewBoard("Startup Board", "biarfokus-white");
    const board = addCardToList(rawBoard, rawBoard.lists[0].id, "First Card");
    const cardId = board.lists[0].cards[0]?.id;
    assert.ok(cardId);

    const updated = updateCard(board, board.lists[0].id, cardId, {
      labels: [{ id: "lbl-custom-1", name: "meeting", color: "#eb5a46" }],
    });

    const labels = resolveBoardAvailableLabels(updated);
    // Base palette (8) + 1 custom ("meeting")
    assert.ok(labels.length >= LABEL_PALETTE.length + 1);
    const meetingLabel = labels.find((l) => l.name.toLowerCase() === "meeting");
    assert.ok(meetingLabel);
    assert.equal(meetingLabel.color, "#eb5a46");

    // Case-insensitive deduplication when resolving with extra labels
    const deduplicated = resolveBoardAvailableLabels(updated, [
      { id: "lbl-custom-2", name: "MEETING", color: "#123456" },
      { id: "lbl-custom-3", name: "Design Sprint", color: "#a855f7" },
    ]);
    const meetingMatches = deduplicated.filter((l) => l.name.toLowerCase() === "meeting");
    assert.equal(meetingMatches.length, 1);
    assert.ok(deduplicated.some((l) => l.name === "Design Sprint"));
  });

  it("deletes a label board-wide and removes it from all cards", () => {
    const rawBoard = createNewBoard("Operations Board", "biarfokus-white");
    const board = addCardToList(rawBoard, rawBoard.lists[0].id, "Card with Labels");
    const card1Id = board.lists[0].cards[0]?.id;
    assert.ok(card1Id);

    const withLabels = updateCard(board, board.lists[0].id, card1Id, {
      labels: [
        { id: "lbl-meeting", name: "meeting", color: "#eb5a46" },
        { id: "lbl-urgent", name: "Urgent", color: "#ef4444" },
      ],
    });

    const boardWithDef = {
      ...withLabels,
      labels: [{ id: "lbl-meeting", name: "meeting", color: "#eb5a46" }],
    };

    const cleaned = deleteBoardLabel(boardWithDef, "lbl-meeting");
    assert.equal(cleaned.labels?.some((l) => l.name.toLowerCase() === "meeting"), false);
    const targetCard = cleaned.lists[0].cards.find((c) => c.id === card1Id);
    assert.ok(targetCard);
    assert.equal(targetCard.labels.some((l) => l.name.toLowerCase() === "meeting"), false);
    assert.equal(targetCard.labels.some((l) => l.name === "Urgent"), true);
  });
});


