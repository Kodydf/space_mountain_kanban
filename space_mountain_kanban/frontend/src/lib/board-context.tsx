"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useState,
  type Dispatch,
  type ReactNode,
} from "react";
import { boardReducer, type BoardAction } from "./board-reducer";
import * as boardApi from "./board-api";
import type { BoardState } from "./types";

type BoardContextValue = {
  state: BoardState;
  dispatch: Dispatch<BoardAction>;
};

const BoardContext = createContext<BoardContextValue | null>(null);

const EMPTY_BOARD: BoardState = { columns: [], cards: [] };

export function BoardProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(boardReducer, EMPTY_BOARD);
  const [isLoading, setIsLoading] = useState(true);

  const resync = useCallback(async () => {
    const board = await boardApi.fetchBoard();
    rawDispatch({ type: "HYDRATE_BOARD", board });
  }, []);

  useEffect(() => {
    resync()
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [resync]);

  const dispatch = useCallback<Dispatch<BoardAction>>(
    (action) => {
      switch (action.type) {
        case "ADD_CARD": {
          // Not optimistic: the server generates the card's id, and every
          // later action on this card needs to reference an id the server
          // actually recognizes.
          boardApi
            .createCard(action.columnId, action.title, action.details, action.dueDate ?? null)
            .then((card) => {
              rawDispatch({
                type: "ADD_CARD",
                id: card.id,
                columnId: card.columnId,
                title: card.title,
                details: card.details,
                dueDate: card.dueDate,
              });
            })
            .catch(() => resync());
          return;
        }

        case "UPDATE_CARD": {
          rawDispatch(action);
          boardApi
            .updateCard(action.cardId, {
              title: action.title,
              details: action.details,
              dueDate: action.dueDate,
            })
            .catch(() => resync());
          return;
        }

        case "DELETE_CARD": {
          rawDispatch(action);
          boardApi.deleteCard(action.cardId).catch(() => resync());
          return;
        }

        case "RENAME_COLUMN": {
          rawDispatch(action);
          boardApi.renameColumn(action.columnId, action.title).catch(() => resync());
          return;
        }

        case "MOVE_CARD": {
          rawDispatch(action);
          boardApi.moveCard(action.cardId, action.toColumnId, action.toIndex).catch(() => resync());
          return;
        }

        default: {
          rawDispatch(action);
        }
      }
    },
    [resync]
  );

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
        Loading board…
      </div>
    );
  }

  return <BoardContext value={{ state, dispatch }}>{children}</BoardContext>;
}

export function useBoard() {
  const context = useContext(BoardContext);
  if (!context) throw new Error("useBoard must be used within a BoardProvider");
  return context;
}
