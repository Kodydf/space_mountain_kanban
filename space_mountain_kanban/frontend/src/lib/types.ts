export type CardData = {
  id: string;
  title: string;
  details: string;
  columnId: string;
  /** ISO date string (YYYY-MM-DD), or null if no due date is set. */
  dueDate: string | null;
};

export type ColumnData = {
  id: string;
  title: string;
};

export type BoardState = {
  columns: ColumnData[];
  cards: CardData[];
};
