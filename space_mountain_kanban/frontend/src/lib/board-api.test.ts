import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as boardApi from "./board-api";

describe("board-api", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetchBoard GETs /api/board", async () => {
    const board = { columns: [], cards: [] };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: true, status: 200, json: async () => board });

    const result = await boardApi.fetchBoard();

    expect(fetch).toHaveBeenCalledWith("/api/board", expect.objectContaining({ credentials: "include" }));
    expect(result).toEqual(board);
  });

  it("createCard POSTs to /api/board/cards with the right body", async () => {
    const card = { id: "c1", title: "New", details: "", dueDate: null, columnId: "col-1" };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: true, status: 201, json: async () => card });

    const result = await boardApi.createCard("col-1", "New", "", null);

    expect(fetch).toHaveBeenCalledWith(
      "/api/board/cards",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ columnId: "col-1", title: "New", details: "", dueDate: null }),
      })
    );
    expect(result).toEqual(card);
  });

  it("updateCard PATCHes /api/board/cards/:id with only the provided fields", async () => {
    const card = { id: "c1", title: "Updated", details: "", dueDate: null, columnId: "col-1" };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: true, status: 200, json: async () => card });

    await boardApi.updateCard("c1", { title: "Updated" });

    expect(fetch).toHaveBeenCalledWith(
      "/api/board/cards/c1",
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ title: "Updated" }) })
    );
  });

  it("deleteCard DELETEs /api/board/cards/:id and returns undefined on 204", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: true, status: 204 });

    const result = await boardApi.deleteCard("c1");

    expect(fetch).toHaveBeenCalledWith("/api/board/cards/c1", expect.objectContaining({ method: "DELETE" }));
    expect(result).toBeUndefined();
  });

  it("renameColumn PATCHes /api/board/columns/:id", async () => {
    const column = { id: "col-1", title: "Backlog" };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: true, status: 200, json: async () => column });

    const result = await boardApi.renameColumn("col-1", "Backlog");

    expect(fetch).toHaveBeenCalledWith(
      "/api/board/columns/col-1",
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ title: "Backlog" }) })
    );
    expect(result).toEqual(column);
  });

  it("moveCard POSTs to /api/board/cards/:id/move", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: true, status: 204 });

    await boardApi.moveCard("c1", "col-2", 0);

    expect(fetch).toHaveBeenCalledWith(
      "/api/board/cards/c1/move",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ toColumnId: "col-2", toIndex: 0 }) })
    );
  });

  it("throws when the response is not ok", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false, status: 500 });

    await expect(boardApi.fetchBoard()).rejects.toThrow();
  });
});
