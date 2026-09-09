import { describe, it, expect } from "vitest";
import { seedBoard } from "./seed-data";

describe("seedBoard", () => {
  it("has exactly 5 columns with unique ids", () => {
    expect(seedBoard.columns).toHaveLength(5);
    const ids = seedBoard.columns.map((c) => c.id);
    expect(new Set(ids).size).toBe(5);
  });

  it("has cards with unique ids that each reference a valid column", () => {
    const columnIds = new Set(seedBoard.columns.map((c) => c.id));
    const cardIds = seedBoard.cards.map((c) => c.id);
    expect(new Set(cardIds).size).toBe(cardIds.length);
    for (const card of seedBoard.cards) {
      expect(columnIds.has(card.columnId)).toBe(true);
    }
  });

  it("gives every card a valid due date or null", () => {
    const isoDate = /^\d{4}-\d{2}-\d{2}$/;
    for (const card of seedBoard.cards) {
      expect(card.dueDate === null || isoDate.test(card.dueDate)).toBe(true);
    }
  });
});
