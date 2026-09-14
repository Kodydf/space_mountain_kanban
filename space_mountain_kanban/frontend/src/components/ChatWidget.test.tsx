import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatWidget } from "./ChatWidget";

const dispatch = vi.fn();

vi.mock("@/lib/board-context", () => ({
  useBoard: () => ({ state: { columns: [], cards: [] }, dispatch }),
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

  it("sends a message, hydrates the board, and shows the reply", async () => {
    const board = {
      columns: [{ id: "col-1", title: "To Do" }],
      cards: [{ id: "card-1", title: "Write docs", details: "", dueDate: null, columnId: "col-1" }],
    };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reply: "Added the card.", board }),
    });

    render(<ChatWidget />);
    await openChat();

    await userEvent.type(screen.getByPlaceholderText(/ask the assistant/i), "Add a card");
    await userEvent.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith({ type: "HYDRATE_BOARD", board });
    });
    expect(await screen.findByText("Added the card.")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      "/api/chat",
      expect.objectContaining({ method: "POST", credentials: "include" })
    );
  });

  it("shows the server's error message and does not touch the board", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Server is missing the OpenRouter API key." }),
    });

    render(<ChatWidget />);
    await openChat();

    await userEvent.type(screen.getByPlaceholderText(/ask the assistant/i), "Hello");
    await userEvent.click(screen.getByRole("button", { name: /send message/i }));

    expect(await screen.findByText(/openrouter api key/i)).toBeInTheDocument();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("shows a network error message when the request fails", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("network down"));

    render(<ChatWidget />);
    await openChat();

    await userEvent.type(screen.getByPlaceholderText(/ask the assistant/i), "Hello");
    await userEvent.click(screen.getByRole("button", { name: /send message/i }));

    expect(await screen.findByText(/couldn't reach the assistant/i)).toBeInTheDocument();
  });
});
