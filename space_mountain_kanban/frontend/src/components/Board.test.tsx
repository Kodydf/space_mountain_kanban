import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Board } from "./Board";
import { BoardProvider } from "@/lib/board-context";
import { seedBoard } from "@/lib/seed-data";

describe("Board", () => {
  it("renders all seeded columns and cards", () => {
    render(
      <BoardProvider>
        <Board />
      </BoardProvider>
    );

    for (const column of seedBoard.columns) {
      expect(screen.getByText(column.title)).toBeInTheDocument();
    }
    for (const card of seedBoard.cards) {
      expect(screen.getByText(card.title)).toBeInTheDocument();
    }
  });
});
