import type { BoardState, CardData, ColumnData } from "./types";

const BASE = "/api/board";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    ...init,
  });
  if (!res.ok) {
    throw new Error(`Request to ${path} failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function fetchBoard(): Promise<BoardState> {
  return request<BoardState>("");
}

export function createCard(
  columnId: string,
  title: string,
  details: string,
  dueDate: string | null
): Promise<CardData> {
  return request<CardData>("/cards", {
    method: "POST",
    body: JSON.stringify({ columnId, title, details, dueDate }),
  });
}

export function updateCard(
  cardId: string,
  fields: { title?: string; details?: string; dueDate?: string | null }
): Promise<CardData> {
  return request<CardData>(`/cards/${cardId}`, {
    method: "PATCH",
    body: JSON.stringify(fields),
  });
}

export function deleteCard(cardId: string): Promise<void> {
  return request<void>(`/cards/${cardId}`, { method: "DELETE" });
}

export function renameColumn(columnId: string, title: string): Promise<ColumnData> {
  return request<ColumnData>(`/columns/${columnId}`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
}

export function moveCard(cardId: string, toColumnId: string, toIndex: number): Promise<void> {
  return request<void>(`/cards/${cardId}/move`, {
    method: "POST",
    body: JSON.stringify({ toColumnId, toIndex }),
  });
}
