"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useNotesContext } from "@/context/NotesContext";

export default function HomePage() {
  const { notes, isSyncing } = useNotesContext();
  const router = useRouter();

  useEffect(() => {
    if (!isSyncing && notes.length > 0) {
      router.replace(`/notes/${notes[0].id}`);
    }
  }, [notes, isSyncing, router]);

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
