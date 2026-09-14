import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Board } from "./Board";
import { BoardProvider } from "@/lib/board-context";
import { seedBoard } from "@/lib/seed-data";

describe("Board", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => seedBoard }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders all seeded columns and cards once the board loads", async () => {
    render(
      <BoardProvider>
        <Board />
      </BoardProvider>
    );

    for (const column of seedBoard.columns) {
      expect(await screen.findByText(column.title)).toBeInTheDocument();
    }
    for (const card of seedBoard.cards) {
      expect(await screen.findByText(card.title)).toBeInTheDocument();
    }
  });
});
