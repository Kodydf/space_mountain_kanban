import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddCardForm } from "./AddCardForm";

const dispatch = vi.fn();

vi.mock("@/lib/board-context", () => ({
  useBoard: () => ({ state: { columns: [], cards: [] }, dispatch }),
}));

describe("AddCardForm", () => {
  it("opens the form, submits trimmed title, details, and due date, then collapses", async () => {
    dispatch.mockClear();
    render(<AddCardForm columnId="col-1" />);

    await userEvent.click(screen.getByRole("button", { name: /add card/i }));
    await userEvent.type(screen.getByPlaceholderText("Title"), "  New card  ");
    await userEvent.type(screen.getByPlaceholderText("Details"), "  some info  ");
    fireEvent.change(screen.getByLabelText("Due date"), { target: { value: "2026-10-01" } });
    await userEvent.click(screen.getByRole("button", { name: /^add$/i }));

    expect(dispatch).toHaveBeenCalledWith({
      type: "ADD_CARD",
      columnId: "col-1",
      title: "New card",
      details: "some info",
      dueDate: "2026-10-01",
    });
    expect(screen.queryByPlaceholderText("Title")).not.toBeInTheDocument();
  });

  it("defaults due date to null when left blank", async () => {
    dispatch.mockClear();
    render(<AddCardForm columnId="col-1" />);

    await userEvent.click(screen.getByRole("button", { name: /add card/i }));
    await userEvent.type(screen.getByPlaceholderText("Title"), "No date");
    await userEvent.click(screen.getByRole("button", { name: /^add$/i }));

    expect(dispatch).toHaveBeenCalledWith({
      type: "ADD_CARD",
      columnId: "col-1",
      title: "No date",
      details: "",
      dueDate: null,
    });
  });

  it("disables submit until a title is entered", async () => {
    render(<AddCardForm columnId="col-1" />);
    await userEvent.click(screen.getByRole("button", { name: /add card/i }));
    expect(screen.getByRole("button", { name: /^add$/i })).toBeDisabled();
    await userEvent.type(screen.getByPlaceholderText("Title"), "x");
    expect(screen.getByRole("button", { name: /^add$/i })).toBeEnabled();
  });

  it("cancel closes the form without dispatching", async () => {
    dispatch.mockClear();
    render(<AddCardForm columnId="col-1" />);
    await userEvent.click(screen.getByRole("button", { name: /add card/i }));
    await userEvent.type(screen.getByPlaceholderText("Title"), "Untitled");
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(dispatch).not.toHaveBeenCalled();
    expect(screen.queryByPlaceholderText("Title")).not.toBeInTheDocument();
  });

  it("shows the add card trigger in green", () => {
    render(<AddCardForm columnId="col-1" />);
    expect(screen.getByRole("button", { name: /add card/i })).toHaveClass("text-green-400");
  });
});
