"use client";

import { memo } from "react";
import { Note } from "@/types";

interface NoteItemProps {
  note: Note;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

function formatDate(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) {
    return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays < 7) {
    return date.toLocaleDateString("es-AR", { weekday: "short" });
  }
  return date.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

function NoteItemComponent({ note, isActive, onSelect, onDelete }: NoteItemProps) {
  const handleClick = () => onSelect(note.id);
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(note.id);
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative flex items-start px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
        isActive
          ? "bg-neutral-700 text-neutral-100"
          : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
      }`}
    >
      <div className="flex-1 min-w-0 pr-6">
        <p className="text-sm font-medium truncate">
          {note.title || "Sin título"}
        </p>
        <p className="text-xs mt-0.5 truncate opacity-60">
          {note.body
            ? note.body.replace(/\n/g, " ").slice(0, 40) || "Nota vacía"
            : "Nota vacía"}
        </p>
        <p className="text-xs mt-0.5 opacity-40">{formatDate(note.updatedAt)}</p>
      </div>

      <button
        onClick={handleDelete}
        className="absolute right-2 top-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-500 hover:text-red-400 p-0.5 rounded"
        title="Eliminar nota"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M2 2l10 10M12 2L2 12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}

export const NoteItem = memo(NoteItemComponent);
