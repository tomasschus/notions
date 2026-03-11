"use client";

import { useState, useEffect, useRef } from "react";
import { useNotesContext } from "@/context/NotesContext";
import { RichEditor } from "./RichEditor";

export function Editor() {
  const { activeNote, updateNote, settings } = useNotesContext();
  const [localTitle, setLocalTitle] = useState("");
  const [localBody, setLocalBody] = useState("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset when switching notes
  useEffect(() => {
    setLocalTitle(activeNote?.title ?? "");
    setLocalBody(activeNote?.body ?? "");
  }, [activeNote?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Autosave
  useEffect(() => {
    if (!activeNote) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      updateNote(activeNote.id, { title: localTitle, body: localBody });
    }, 400);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [localTitle, localBody]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!activeNote) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-600 select-none">
        <div className="text-center">
          <div className="text-4xl mb-3">✦</div>
          <p className="text-sm">Seleccioná o creá una nota</p>
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
        noteId={activeNote.id}
        title={localTitle}
        apiKey={settings.openaiApiKey}
        model={settings.model}
        provider={settings.provider ?? "groq"}
      />
    </div>
  );
}
