"use client";

import { useState, type KeyboardEvent } from "react";
import { CalendarClock } from "lucide-react";
import { useBoard } from "@/lib/board-context";

export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const today = new Date().toISOString().slice(0, 10);
  return today > dueDate;
}

function formatDueDate(dueDate: string): string {
  const [year, month, day] = dueDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DueDateBadge({ cardId, dueDate }: { cardId: string; dueDate: string | null }) {
  const { dispatch } = useBoard();
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(dueDate ?? "");

  function commit() {
    dispatch({ type: "UPDATE_CARD", cardId, dueDate: value || null });
    setIsEditing(false);
  }

  function cancel() {
    setValue(dueDate ?? "");
    setIsEditing(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    e.stopPropagation();
    if (e.key === "Enter") commit();
    if (e.key === "Escape") cancel();
  }

  if (isEditing) {
    return (
      <input
        autoFocus
        type="date"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        onPointerDown={(e) => e.stopPropagation()}
        className="mt-2 text-xs text-dark-navy rounded-md border border-gray-200 px-2 py-1 outline-none focus:border-blue-primary"
      />
    );
  }

  const overdue = isOverdue(dueDate);

  return (
    <button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      onClick={() => setIsEditing(true)}
      data-testid="due-date"
      data-overdue={overdue}
      className={`mt-2 inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 transition-colors ${
        overdue
          ? "bg-red-100 text-red-700 border border-red-400 font-semibold"
          : dueDate
            ? "bg-gray-100 text-gray-text border border-gray-200 hover:border-blue-primary"
            : "text-gray-text border border-dashed border-gray-300 hover:border-blue-primary"
      }`}
    >
      <CalendarClock size={12} />
      {dueDate ? formatDueDate(dueDate) : "Set due date"}
    </button>
  );
}
