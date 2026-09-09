import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DueDateBadge, isOverdue } from "./DueDateBadge";

const dispatch = vi.fn();

vi.mock("@/lib/board-context", () => ({
  useBoard: () => ({ state: { columns: [], cards: [] }, dispatch }),
}));

describe("isOverdue", () => {
  it("is false when there is no due date", () => {
    expect(isOverdue(null)).toBe(false);
  });

  it("is true when the due date is before today", () => {
    expect(isOverdue("2000-01-01")).toBe(true);
  });

  it("is false when the due date is today or later", () => {
    expect(isOverdue("2999-01-01")).toBe(false);
  });
});

describe("DueDateBadge", () => {
  it("shows a prompt to set a due date when there is none", () => {
    render(<DueDateBadge cardId="card-1" dueDate={null} />);
    expect(screen.getByText("Set due date")).toBeInTheDocument();
  });

  it("commits a new due date on click, edit, and Enter", async () => {
    dispatch.mockClear();
    render(<DueDateBadge cardId="card-1" dueDate="2026-01-01" />);

    await userEvent.click(screen.getByTestId("due-date"));
    const input = screen.getByDisplayValue("2026-01-01");
    fireEvent.change(input, { target: { value: "2026-06-15" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(dispatch).toHaveBeenCalledWith({
      type: "UPDATE_CARD",
      cardId: "card-1",
      dueDate: "2026-06-15",
    });
  });

  it("cancels edits on Escape without dispatching", async () => {
    dispatch.mockClear();
    render(<DueDateBadge cardId="card-1" dueDate="2026-01-01" />);

    await userEvent.click(screen.getByTestId("due-date"));
    await userEvent.keyboard("{Escape}");

    expect(dispatch).not.toHaveBeenCalled();
    expect(screen.getByTestId("due-date")).toBeInTheDocument();
  });
});
