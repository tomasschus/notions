"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useNotesContext } from "@/context/NotesContext";

export default function HomePage() {
  const { notes, isSyncing } = useNotesContext();
  const router = useRouter();

  const redirectNoteId = useMemo(() => {
    if (isSyncing || notes.length === 0) return null;
    const sorted = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
    return sorted[0]?.id ?? null;
  }, [notes, isSyncing]);

  useEffect(() => {
    if (redirectNoteId) router.replace(`/notes/${redirectNoteId}`);
  }, [redirectNoteId, router]);

  return (
    <div className="flex-1 flex items-center justify-center text-neutral-600 select-none">
      <div className="text-center">
        <div className="text-4xl mb-3">✦</div>
        <p className="text-sm">
          {isSyncing ? "Cargando…" : "Seleccioná o creá una nota"}
        </p>
      </div>
    </div>
  );
}
