"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useBoard } from "@/lib/board-context";

export function AddCardForm({ columnId }: { columnId: string }) {
  const { dispatch } = useBoard();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [dueDate, setDueDate] = useState("");

  function reset() {
    setTitle("");
    setDetails("");
    setDueDate("");
    setIsOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    dispatch({
      type: "ADD_CARD",
      columnId,
      title: trimmedTitle,
      details: details.trim(),
      dueDate: dueDate || null,
    });
    reset();
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 text-sm font-medium text-green-400 hover:text-green-300 transition-colors px-1 py-1"
      >
        <Plus size={16} />
        Add card
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 bg-gradient-to-br from-white to-yellow-50 rounded-xl border border-accent-yellow/40 p-3 shadow-sm"
    >
      <input
        autoFocus
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="text-sm text-dark-navy rounded-md border border-gray-200 px-2 py-1 outline-none focus:border-blue-primary"
      />
      <textarea
        placeholder="Details"
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        rows={2}
        className="text-sm text-dark-navy rounded-md border border-gray-200 px-2 py-1 outline-none focus:border-blue-primary resize-none"
      />
      <label className="flex items-center gap-2 text-xs text-gray-text">
        Due date
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="text-sm text-dark-navy rounded-md border border-gray-200 px-2 py-1 outline-none focus:border-blue-primary"
        />
      </label>
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={reset}
          className="text-sm text-gray-text hover:text-dark-navy px-3 py-1"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!title.trim()}
          className="text-sm bg-purple-secondary text-white rounded-lg px-3 py-1 ring-1 ring-accent-yellow/50 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>
    </form>
  );
}
