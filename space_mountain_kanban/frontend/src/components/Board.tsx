"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useBoard } from "@/lib/board-context";
import { playWoo } from "@/lib/play-woo";
import { Column } from "./Column";
import { Card } from "./Card";

export function Board() {
  const { state, dispatch } = useBoard();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const overId = over.id as string;
    const isOverColumn = state.columns.some((col) => col.id === overId);

    const toColumnId = isOverColumn
      ? overId
      : state.cards.find((c) => c.id === overId)?.columnId;
    if (!toColumnId) return;

    const columnCards = state.cards.filter((c) => c.columnId === toColumnId);
    const toIndex = isOverColumn
      ? columnCards.length
      : columnCards.findIndex((c) => c.id === overId);

    dispatch({ type: "MOVE_CARD", cardId: active.id as string, toColumnId, toIndex });
    playWoo();
  }

  const activeCard = activeId ? state.cards.find((c) => c.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 p-6 overflow-x-auto flex-1">
        {state.columns.map((column) => (
          <Column
            key={column.id}
            column={column}
            cards={state.cards.filter((c) => c.columnId === column.id)}
          />
        ))}
      </div>
      <DragOverlay>
        {activeCard ? (
          <div className="rotate-3 drop-shadow-[0_8px_24px_rgba(236,173,10,0.6)]">
            <Card card={activeCard} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
