"use client";

import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from "react";
import { boardReducer, type BoardAction } from "./board-reducer";
import { seedBoard } from "./seed-data";
import type { BoardState } from "./types";

type BoardContextValue = {
  state: BoardState;
  dispatch: Dispatch<BoardAction>;
};

const BoardContext = createContext<BoardContextValue | null>(null);

export function BoardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(boardReducer, seedBoard);
  return <BoardContext value={{ state, dispatch }}>{children}</BoardContext>;
}

export function useBoard() {
  const context = useContext(BoardContext);
  if (!context) throw new Error("useBoard must be used within a BoardProvider");
  return context;
}
