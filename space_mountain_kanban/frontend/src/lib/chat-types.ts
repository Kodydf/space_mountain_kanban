import type { BoardState } from "./types";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatApiRequest = {
  messages: ChatMessage[];
};

export type ChatApiResponse = { reply: string; board: BoardState } | { error: string };
