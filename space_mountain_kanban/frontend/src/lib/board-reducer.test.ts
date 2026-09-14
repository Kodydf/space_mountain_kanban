import { describe, it, expect } from "vitest";
import { boardReducer } from "./board-reducer";
import type { BoardState } from "./types";

function makeState(): BoardState {
  return {
    columns: [
      { id: "col-1", title: "To Do" },
      { id: "col-2", title: "Done" },
    ],
    cards: [
      { id: "card-1", title: "First", details: "d1", columnId: "col-1", dueDate: "2026-09-10" },
      { id: "card-2", title: "Second", details: "d2", columnId: "col-1", dueDate: null },
      { id: "card-3", title: "Third", details: "d3", columnId: "col-2", dueDate: "2026-09-01" },
    ],
  };
}

describe("boardReducer", () => {
  it("ADD_CARD appends a new card to the target column", () => {
    const state = makeState();
    const next = boardReducer(state, {
      type: "ADD_CARD",
      columnId: "col-2",
      title: "New card",
      details: "some details",
      dueDate: "2026-10-01",
    });

    expect(next.cards).toHaveLength(4);
    const added = next.cards.at(-1)!;
    expect(added.title).toBe("New card");
    expect(added.details).toBe("some details");
    expect(added.columnId).toBe("col-2");
    expect(added.dueDate).toBe("2026-10-01");
    expect(added.id).toBeTruthy();
  });

  it("ADD_CARD uses the provided id when given (the server-generated id)", () => {
    const state = makeState();
    const next = boardReducer(state, {
      type: "ADD_CARD",
      id: "server-id-123",
      columnId: "col-1",
      title: "Persisted card",
      details: "",
    });

    expect(next.cards.at(-1)!.id).toBe("server-id-123");
  });

  it("HYDRATE_BOARD replaces the entire state", () => {
    const state = makeState();
    const newBoard: BoardState = {
      columns: [{ id: "col-9", title: "Fresh" }],
      cards: [{ id: "card-9", title: "Fresh card", details: "", columnId: "col-9", dueDate: null }],
    };

    const next = boardReducer(state, { type: "HYDRATE_BOARD", board: newBoard });

    expect(next).toEqual(newBoard);
  });

  it("ADD_CARD defaults dueDate to null when omitted", () => {
    const state = makeState();
    const next = boardReducer(state, {
      type: "ADD_CARD",
      columnId: "col-1",
      title: "No due date",
      details: "",
    });

    expect(next.cards.at(-1)!.dueDate).toBeNull();
  });

  it("UPDATE_CARD changes only the given fields", () => {
    const state = makeState();
    const next = boardReducer(state, {
      type: "UPDATE_CARD",
      cardId: "card-1",
      dueDate: "2026-12-25",
    });

    const updated = next.cards.find((c) => c.id === "card-1")!;
    expect(updated.dueDate).toBe("2026-12-25");
    expect(updated.title).toBe("First");
    expect(updated.details).toBe("d1");
  });

  it("UPDATE_CARD can clear a due date by setting it to null", () => {
    const state = makeState();
    const next = boardReducer(state, {
      type: "UPDATE_CARD",
      cardId: "card-1",
      dueDate: null,
    });

    expect(next.cards.find((c) => c.id === "card-1")!.dueDate).toBeNull();
  });

  it("UPDATE_CARD updates title and details together", () => {
    const state = makeState();
    const next = boardReducer(state, {
      type: "UPDATE_CARD",
      cardId: "card-2",
      title: "Renamed",
      details: "New details",
    });

    const updated = next.cards.find((c) => c.id === "card-2")!;
    expect(updated.title).toBe("Renamed");
    expect(updated.details).toBe("New details");
  });

  it("DELETE_CARD removes only the target card", () => {
    const state = makeState();
    const next = boardReducer(state, { type: "DELETE_CARD", cardId: "card-2" });

    expect(next.cards.map((c) => c.id)).toEqual(["card-1", "card-3"]);
  });

  it("RENAME_COLUMN updates only the target column's title", () => {
    const state = makeState();
    const next = boardReducer(state, {
      type: "RENAME_COLUMN",
      columnId: "col-1",
      title: "Backlog",
    });

    expect(next.columns.find((c) => c.id === "col-1")?.title).toBe("Backlog");
    expect(next.columns.find((c) => c.id === "col-2")?.title).toBe("Done");
  });

  it("MOVE_CARD moves a card into another column at the given index", () => {
    const state = makeState();
    const next = boardReducer(state, {
      type: "MOVE_CARD",
      cardId: "card-1",
      toColumnId: "col-2",
      toIndex: 0,
    });

    const col1Cards = next.cards.filter((c) => c.columnId === "col-1");
    const col2Cards = next.cards.filter((c) => c.columnId === "col-2");
    expect(col1Cards.map((c) => c.id)).toEqual(["card-2"]);
    expect(col2Cards.map((c) => c.id)).toEqual(["card-1", "card-3"]);
  });

  it("MOVE_CARD reorders a card within the same column", () => {
    const state = makeState();
    const next = boardReducer(state, {
      type: "MOVE_CARD",
      cardId: "card-2",
      toColumnId: "col-1",
      toIndex: 0,
    });

    const col1Cards = next.cards.filter((c) => c.columnId === "col-1");
    expect(col1Cards.map((c) => c.id)).toEqual(["card-2", "card-1"]);
  });

  it("MOVE_CARD appends to the end of an empty column", () => {
    const state: BoardState = {
      columns: [
        { id: "col-1", title: "To Do" },
        { id: "col-2", title: "Empty" },
      ],
      cards: [{ id: "card-1", title: "First", details: "", columnId: "col-1", dueDate: null }],
    };
    const next = boardReducer(state, {
      type: "MOVE_CARD",
      cardId: "card-1",
      toColumnId: "col-2",
      toIndex: 0,
    });

    expect(next.cards).toEqual([
      { id: "card-1", title: "First", details: "", columnId: "col-2", dueDate: null },
    ]);
  });
});
