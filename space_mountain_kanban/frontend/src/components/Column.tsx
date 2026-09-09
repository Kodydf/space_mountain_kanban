"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ColumnHeader } from "./ColumnHeader";
import { Card } from "./Card";
import { AddCardForm } from "./AddCardForm";
import type { CardData, ColumnData } from "@/lib/types";

export function Column({ column, cards }: { column: ColumnData; cards: CardData[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex flex-col w-72 shrink-0 gap-3" data-testid="column" data-column-id={column.id}>
      <ColumnHeader columnId={column.id} title={column.title} />
      <div
        ref={setNodeRef}
        data-testid="column-drop-area"
        className={`flex flex-col gap-3 bg-white/5 backdrop-blur-sm border border-accent-yellow/25 rounded-2xl p-3 min-h-[60vh] transition-shadow ${
          isOver ? "ring-2 ring-accent-yellow ring-inset shadow-[0_0_20px_rgba(236,173,10,0.4)]" : ""
        }`}
      >
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <Card key={card.id} card={card} />
          ))}
        </SortableContext>
        <AddCardForm columnId={column.id} />
      </div>
    </div>
  );
}
