import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatWidget } from "./ChatWidget";

const dispatch = vi.fn();
const state = {
  columns: [
    { id: "col-1", title: "To Do" },
    { id: "col-2", title: "Done" },
  ],
  cards: [
    { id: "card-1", title: "Write docs", details: "Docs for the API", columnId: "col-1", dueDate: null },
  ],
};

vi.mock("@/lib/board-context", () => ({
  useBoard: () => ({ state, dispatch }),
}));

async function openChat() {
  await userEvent.click(screen.getByRole("button", { name: /open digital assistant/i }));
}

describe("ChatWidget", () => {
  beforeEach(() => {
    dispatch.mockClear();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is closed by default and opens on click", async () => {
    render(<ChatWidget />);
    expect(screen.queryByText(/digital assistant/i)).not.toBeInTheDocument();

    await openChat();
    expect(screen.getByText("Digital Assistant")).toBeInTheDocument();
    expect(screen.getByText(/woooo/i)).toBeInTheDocument();
  });

  it("sends a message and displays a plain text reply", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: "Write docs is due whenever you set it.", toolCalls: [] }),
    });

    render(<ChatWidget />);
    await openChat();

    await userEvent.type(screen.getByPlaceholderText(/ask the assistant/i), "What is Write docs about?");
    await userEvent.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => {
      expect(screen.getByText("Write docs is due whenever you set it.")).toBeInTheDocument();
    });
    expect(fetch).toHaveBeenCalledWith(
      "/api/chat",
      expect.objectContaining({ method: "POST" })
    );
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("applies a move_card tool call and shows a confirmation", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: null,
        toolCalls: [{ name: "move_card", arguments: { cardId: "card-1", toColumnId: "col-2" } }],
      }),
    });

    render(<ChatWidget />);
    await openChat();

    await userEvent.type(screen.getByPlaceholderText(/ask the assistant/i), "Move Write docs to Done");
    await userEvent.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith({
        type: "MOVE_CARD",
        cardId: "card-1",
        toColumnId: "col-2",
        toIndex: 0,
      });
    });
    expect(await screen.findByText(/moved "write docs" to done/i)).toBeInTheDocument();
  });

  it("shows an error message when the request fails", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("network down"));

    render(<ChatWidget />);
    await openChat();

    await userEvent.type(screen.getByPlaceholderText(/ask the assistant/i), "Hello");
    await userEvent.click(screen.getByRole("button", { name: /send message/i }));

    expect(await screen.findByText(/couldn't reach the assistant/i)).toBeInTheDocument();
  });
});
