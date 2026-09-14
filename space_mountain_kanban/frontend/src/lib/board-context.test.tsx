import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BoardProvider, useBoard } from "./board-context";

function TestHarness() {
  const { state, dispatch } = useBoard();
  return (
    <div>
      <ul>
        {state.cards.map((c) => (
          <li key={c.id}>{c.title}</li>
        ))}
      </ul>
      <button onClick={() => dispatch({ type: "ADD_CARD", columnId: "col-1", title: "New", details: "" })}>
        add
      </button>
      <button onClick={() => dispatch({ type: "DELETE_CARD", cardId: "card-1" })}>delete</button>
    </div>
  );
}

const initialBoard = {
  columns: [{ id: "col-1", title: "To Do" }],
  cards: [{ id: "card-1", title: "Existing", details: "", dueDate: null, columnId: "col-1" }],
};

describe("BoardProvider", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches the board on mount and hydrates state", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => initialBoard,
    });

    render(
      <BoardProvider>
        <TestHarness />
      </BoardProvider>
    );

    expect(await screen.findByText("Existing")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/api/board", expect.objectContaining({ credentials: "include" }));
  });

  it("ADD_CARD waits for the server and uses its returned id", async () => {
    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => initialBoard })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: "server-id", title: "New", details: "", dueDate: null, columnId: "col-1" }),
      });

    render(
      <BoardProvider>
        <TestHarness />
      </BoardProvider>
    );
    await screen.findByText("Existing");

    await userEvent.click(screen.getByRole("button", { name: "add" }));

    expect(await screen.findByText("New")).toBeInTheDocument();
    expect(fetch).toHaveBeenLastCalledWith("/api/board/cards", expect.objectContaining({ method: "POST" }));
  });

  it("DELETE_CARD updates immediately, then calls the API in the background", async () => {
    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => initialBoard })
      .mockResolvedValueOnce({ ok: true, status: 204 });

    render(
      <BoardProvider>
        <TestHarness />
      </BoardProvider>
    );
    await screen.findByText("Existing");

    await userEvent.click(screen.getByRole("button", { name: "delete" }));

    // Optimistic: removed immediately, without waiting for the request to resolve.
    expect(screen.queryByText("Existing")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(fetch).toHaveBeenLastCalledWith(
        "/api/board/cards/card-1",
        expect.objectContaining({ method: "DELETE" })
      )
    );
  });

  it("resyncs from the server when a mutation fails", async () => {
    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => initialBoard })
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => initialBoard });

    render(
      <BoardProvider>
        <TestHarness />
      </BoardProvider>
    );
    await screen.findByText("Existing");

    await userEvent.click(screen.getByRole("button", { name: "delete" }));

    // The optimistic removal is undone once the resync completes.
    expect(await screen.findByText("Existing")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(3);
  });
});
