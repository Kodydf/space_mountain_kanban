import type { BoardState } from "./types";

export type BoardAction =
  | { type: "ADD_CARD"; columnId: string; title: string; details: string; dueDate?: string | null; id?: string }
  | {
      type: "UPDATE_CARD";
      cardId: string;
      title?: string;
      details?: string;
      dueDate?: string | null;
    }
  | { type: "DELETE_CARD"; cardId: string }
  | { type: "RENAME_COLUMN"; columnId: string; title: string }
  | { type: "MOVE_CARD"; cardId: string; toColumnId: string; toIndex: number }
  | { type: "HYDRATE_BOARD"; board: BoardState };

export function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case "ADD_CARD": {
      const newCard = {
        id: action.id ?? crypto.randomUUID(),
        title: action.title,
        details: action.details,
        columnId: action.columnId,
        dueDate: action.dueDate ?? null,
      };
      return { ...state, cards: [...state.cards, newCard] };
    }

    case "UPDATE_CARD": {
      return {
        ...state,
        cards: state.cards.map((c) =>
          c.id === action.cardId
            ? {
                ...c,
                ...(action.title !== undefined ? { title: action.title } : {}),
                ...(action.details !== undefined ? { details: action.details } : {}),
                ...(action.dueDate !== undefined ? { dueDate: action.dueDate } : {}),
              }
            : c
        ),
      };
    }

    case "DELETE_CARD": {
      return { ...state, cards: state.cards.filter((c) => c.id !== action.cardId) };
    }

    case "RENAME_COLUMN": {
      return {
        ...state,
        columns: state.columns.map((col) =>
          col.id === action.columnId ? { ...col, title: action.title } : col
        ),
      };
    }

    case "MOVE_CARD": {
      const card = state.cards.find((c) => c.id === action.cardId);
      if (!card) return state;

      const withoutCard = state.cards.filter((c) => c.id !== action.cardId);
      const columnCards = withoutCard.filter((c) => c.columnId === action.toColumnId);
      const index = Math.max(0, Math.min(action.toIndex, columnCards.length));
      const movedCard = { ...card, columnId: action.toColumnId };

      let insertAt = withoutCard.length;
      if (columnCards.length > 0) {
        if (index === columnCards.length) {
          insertAt = withoutCard.indexOf(columnCards[index - 1]) + 1;
        } else {
          insertAt = withoutCard.indexOf(columnCards[index]);
        }
      }

      const cards = [...withoutCard.slice(0, insertAt), movedCard, ...withoutCard.slice(insertAt)];
      return { ...state, cards };
    }

    case "HYDRATE_BOARD": {
      return action.board;
    }

    default:
      return state;
  }
}
