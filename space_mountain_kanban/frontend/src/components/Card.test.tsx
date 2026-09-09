import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Card } from "./Card";
import type { CardData } from "@/lib/types";

const dispatch = vi.fn();

vi.mock("@/lib/board-context", () => ({
  useBoard: () => ({ state: { columns: [], cards: [] }, dispatch }),
}));

const card: CardData = {
  id: "card-1",
  title: "My Task",
  details: "Some details",
  columnId: "col-1",
  dueDate: null,
};

describe("Card", () => {
  it("renders title and details", () => {
    render(<Card card={card} />);
    expect(screen.getByText("My Task")).toBeInTheDocument();
    expect(screen.getByText("Some details")).toBeInTheDocument();
  });

  it("dispatches DELETE_CARD with the card id when delete is clicked", async () => {
    dispatch.mockClear();
    render(<Card card={card} />);
    await userEvent.click(screen.getByRole("button", { name: /delete card/i }));
    expect(dispatch).toHaveBeenCalledWith({ type: "DELETE_CARD", cardId: "card-1" });
  });

  it("edits title and details, dispatching UPDATE_CARD on save", async () => {
    dispatch.mockClear();
    render(<Card card={card} />);

    await userEvent.click(screen.getByRole("button", { name: /edit card/i }));
    const titleInput = screen.getByDisplayValue("My Task");
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, "Updated Task");
    const detailsInput = screen.getByDisplayValue("Some details");
    await userEvent.clear(detailsInput);
    await userEvent.type(detailsInput, "Updated details");
    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(dispatch).toHaveBeenCalledWith({
      type: "UPDATE_CARD",
      cardId: "card-1",
      title: "Updated Task",
      details: "Updated details",
    });
    // The mocked dispatch doesn't mutate the card prop, so the form simply
    // closes; a real dispatch would re-render with the updated title.
    expect(screen.queryByDisplayValue("Updated Task")).not.toBeInTheDocument();
  });

  it("cancels editing without dispatching", async () => {
    dispatch.mockClear();
    render(<Card card={card} />);

    await userEvent.click(screen.getByRole("button", { name: /edit card/i }));
    const titleInput = screen.getByDisplayValue("My Task");
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, "Should not save");
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(dispatch).not.toHaveBeenCalled();
    expect(screen.getByText("My Task")).toBeInTheDocument();
  });

  it("disables save while the title is blank", async () => {
    render(<Card card={card} />);
    await userEvent.click(screen.getByRole("button", { name: /edit card/i }));
    const titleInput = screen.getByDisplayValue("My Task");
    await userEvent.clear(titleInput);
    expect(screen.getByRole("button", { name: /^save$/i })).toBeDisabled();
  });

  it("flags a past due date as overdue", () => {
    render(<Card card={{ ...card, dueDate: "2000-01-01" }} />);
    expect(screen.getByTestId("due-date")).toHaveAttribute("data-overdue", "true");
  });

  it("does not flag a future due date as overdue", () => {
    render(<Card card={{ ...card, dueDate: "2999-01-01" }} />);
    expect(screen.getByTestId("due-date")).toHaveAttribute("data-overdue", "false");
  });
});
