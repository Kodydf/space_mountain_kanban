import type { ChatApiRequest } from "./chat-types";

export const CHAT_TOOLS = [
  {
    type: "function",
    function: {
      name: "add_card",
      description: "Add a new card (task) to a column on the board.",
      parameters: {
        type: "object",
        properties: {
          columnId: { type: "string", description: "The id of the column to add the card to." },
          title: { type: "string", description: "Short title of the task." },
          details: { type: "string", description: "Longer description of the task." },
          dueDate: {
            type: "string",
            description: "Due date in YYYY-MM-DD format. Omit if the user didn't give one.",
          },
        },
        required: ["columnId", "title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_card",
      description: "Change an existing card's title, description, and/or due date.",
      parameters: {
        type: "object",
        properties: {
          cardId: { type: "string", description: "The id of the card to update." },
          title: { type: "string" },
          details: { type: "string", description: "The new description for the card." },
          dueDate: {
            type: "string",
            description: "New due date in YYYY-MM-DD format, or an empty string to clear it.",
          },
        },
        required: ["cardId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "move_card",
      description: "Move a card to a different column, e.g. from To Do to Done.",
      parameters: {
        type: "object",
        properties: {
          cardId: { type: "string" },
          toColumnId: { type: "string", description: "The id of the destination column." },
        },
        required: ["cardId", "toColumnId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_card",
      description: "Permanently delete a card from the board.",
      parameters: {
        type: "object",
        properties: { cardId: { type: "string" } },
        required: ["cardId"],
      },
    },
  },
] as const;

export function buildSystemPrompt(board: ChatApiRequest["board"]): string {
  const today = new Date().toISOString().slice(0, 10);
  return `You are the digital assistant embedded in a Kanban board app called "Space Mountain Task Tracker". You help the user manage their tasks: adding cards, changing a card's description or due date, moving cards between columns, deleting cards, and answering questions about tasks using their descriptions.

Today's date is ${today}.

Current board state as JSON (columns and cards, each with its id):
${JSON.stringify(board)}

Rules:
- Always reference existing cards and columns by the "id" fields from the board state above. Never invent an id.
- If a request is ambiguous (e.g. more than one card could match), ask a short clarifying question instead of guessing.
- Use the provided tools to make any change to the board. Never claim to have made a change without calling a tool.
- For questions about a task (e.g. "what's card X about", "when is Y due"), answer directly from the board state above. No tool call is needed for questions.
- Keep replies brief and friendly.`;
}
