import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addCardToList,
  addList,
  createDefaultGrowthBoard,
  createNewBoard,
  deleteCard,
  deleteList,
  moveCard,
  moveList,
  parseStoredBoards,
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
    assert.equal(parsedNull[0].id, "board-gt-growth");

    const parsedCorrupt = parseStoredBoards("not-json-at-all");
    assert.equal(parsedCorrupt[0].id, "board-gt-growth");

    const customBoard = createNewBoard("Saved Board");
    const parsedValid = parseStoredBoards(JSON.stringify([customBoard]));
    assert.equal(parsedValid.length, 1);
    assert.equal(parsedValid[0].title, "Saved Board");
  });
});
