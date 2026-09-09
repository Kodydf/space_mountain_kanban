import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ColumnHeader } from "./ColumnHeader";

const dispatch = vi.fn();

vi.mock("@/lib/board-context", () => ({
  useBoard: () => ({ state: { columns: [], cards: [] }, dispatch }),
}));

describe("ColumnHeader", () => {
  it("enters edit mode on click and saves on Enter", async () => {
    dispatch.mockClear();
    render(<ColumnHeader columnId="col-1" title="To Do" />);

    await userEvent.click(screen.getByText("To Do"));
    const input = screen.getByDisplayValue("To Do");
    await userEvent.clear(input);
    await userEvent.type(input, "Backlog{Enter}");

    expect(dispatch).toHaveBeenCalledWith({
      type: "RENAME_COLUMN",
      columnId: "col-1",
      title: "Backlog",
    });
  });

  it("cancels edits on Escape without dispatching", async () => {
    dispatch.mockClear();
    render(<ColumnHeader columnId="col-1" title="To Do" />);

    await userEvent.click(screen.getByText("To Do"));
    const input = screen.getByDisplayValue("To Do");
    await userEvent.type(input, "Something{Escape}");

    expect(dispatch).not.toHaveBeenCalled();
    expect(screen.getByText("To Do")).toBeInTheDocument();
  });
});
