"use client";

import { useState, useEffect, useRef } from "react";
import { useNotesContext } from "@/context/NotesContext";
import { RichEditor } from "./RichEditor";

interface EditorProps {
  noteId: string;
}

export function Editor({ noteId }: EditorProps) {
  const { notes, updateNote, settings, isSyncing } = useNotesContext();
  const note = notes.find((n) => n.id === noteId);
  const [localTitle, setLocalTitle] = useState("");
  const [localBody, setLocalBody] = useState("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInitialized = useRef(false);

  // Initialize local state once when note data first becomes available
  useEffect(() => {
    if (note && !hasInitialized.current) {
      setLocalTitle(note.title);
      setLocalBody(note.body);
      hasInitialized.current = true;
    }
  }, [note]);

  // Autosave — noteId is stable for this component instance (URL-based routing)
  useEffect(() => {
    if (!hasInitialized.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      updateNote(noteId, { title: localTitle, body: localBody });
    }, 400);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [localTitle, localBody]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-600 select-none">
        <div className="text-center">
          <div className="text-4xl mb-3">✦</div>
          <p className="text-sm">
            {isSyncing ? "Cargando…" : "Nota no encontrada"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Title */}
      <div className="px-12 pt-8 pb-2 flex-shrink-0">
        <input
          type="text"
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          placeholder="Sin título"
          className="w-full bg-transparent text-3xl font-bold text-neutral-100 placeholder:text-neutral-700 border-none outline-none"
        />
      </div>

      {/* Rich editor */}
      <RichEditor
        content={localBody}
        onChange={setLocalBody}
        noteId={noteId}
        title={localTitle}
        apiKey={settings.openaiApiKey}
        model={settings.model}
        provider={settings.provider ?? "groq"}
      />
    </div>
  );
}
