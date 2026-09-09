"use client";

import { useState, type FormEvent } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, Pencil } from "lucide-react";
import { useBoard } from "@/lib/board-context";
import { DueDateBadge } from "./DueDateBadge";
import type { CardData } from "@/lib/types";

export function Card({ card }: { card: CardData }) {
  const { dispatch } = useBoard();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [details, setDetails] = useState(card.details);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  function startEditing() {
    setTitle(card.title);
    setDetails(card.details);
    setIsEditing(true);
  }

  function handleSave(e: FormEvent) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    dispatch({ type: "UPDATE_CARD", cardId: card.id, title: trimmedTitle, details: details.trim() });
    setIsEditing(false);
  }

  function handleCancel() {
    setTitle(card.title);
    setDetails(card.details);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <form
        ref={setNodeRef}
        style={style}
        onSubmit={handleSave}
        data-testid="card"
        className="flex flex-col gap-2 bg-gradient-to-br from-white to-yellow-50 rounded-xl border border-accent-yellow/40 p-4 shadow-sm"
      >
        <input
          autoFocus
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="text-sm text-dark-navy rounded-md border border-gray-200 px-2 py-1 outline-none focus:border-blue-primary"
        />
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Details"
          rows={2}
          className="text-sm text-dark-navy rounded-md border border-gray-200 px-2 py-1 outline-none focus:border-blue-primary resize-none"
        />
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={handleCancel}
            className="text-sm text-gray-text hover:text-dark-navy px-3 py-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim()}
            className="text-sm bg-purple-secondary text-white rounded-lg px-3 py-1 ring-1 ring-accent-yellow/50 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </form>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      data-testid="card"
      className="group bg-gradient-to-br from-white to-yellow-50 rounded-xl shadow-sm hover:shadow-[0_4px_18px_rgba(236,173,10,0.45)] transition-shadow border border-accent-yellow/40 p-4 touch-none cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-dark-navy">{card.title}</h3>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            type="button"
            aria-label="Edit card"
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            onClick={startEditing}
            className="text-gray-text hover:text-dark-navy"
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            aria-label="Delete card"
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            onClick={() => dispatch({ type: "DELETE_CARD", cardId: card.id })}
            className="text-gray-text hover:text-dark-navy"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      {card.details && <p className="mt-1 text-sm text-gray-text">{card.details}</p>}
      <DueDateBadge cardId={card.id} dueDate={card.dueDate} />
    </div>
  );
}
