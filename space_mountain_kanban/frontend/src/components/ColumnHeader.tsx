"use client";

import { useState, type KeyboardEvent } from "react";
import { useBoard } from "@/lib/board-context";

export function ColumnHeader({ columnId, title }: { columnId: string; title: string }) {
  const { dispatch } = useBoard();
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(title);

  function commit() {
    const trimmed = value.trim();
    if (trimmed) {
      dispatch({ type: "RENAME_COLUMN", columnId, title: trimmed });
    } else {
      setValue(title);
    }
    setIsEditing(false);
  }

  function cancel() {
    setValue(title);
    setIsEditing(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") cancel();
  }

  if (isEditing) {
    return (
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className="font-bold text-lg uppercase tracking-wider text-accent-yellow bg-black/40 rounded-md px-2 py-0.5 outline-none border-2 border-accent-yellow w-full"
      />
    );
  }

  return (
    <h2
      onClick={() => setIsEditing(true)}
      className="font-bold text-lg uppercase tracking-wider text-accent-yellow px-2 py-0.5 cursor-text rounded-md hover:bg-white/10 [text-shadow:0_0_10px_rgba(236,173,10,0.5)]"
    >
      {title}
    </h2>
  );
}
