export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ToolCall = {
  name: "add_card" | "update_card" | "move_card" | "delete_card";
  arguments: Record<string, string>;
};

export type ChatApiRequest = {
  messages: ChatMessage[];
  board: {
    columns: { id: string; title: string }[];
    cards: {
      id: string;
      title: string;
      details: string;
      dueDate: string | null;
      columnId: string;
    }[];
  };
};

export type ChatApiResponse =
  | { content: string | null; toolCalls: ToolCall[] }
  | { error: string };
