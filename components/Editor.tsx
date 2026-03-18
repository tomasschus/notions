"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useNotesContext } from "@/context/NotesContext";
import { RichEditor } from "./RichEditor";

const AUTOSAVE_MS = 400;

interface EditorProps {
  noteId: string;
}

function EditorEmpty({ isSyncing }: { isSyncing: boolean }) {
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

export function Editor({ noteId }: EditorProps) {
  const { notes, updateNote, settings, isSyncing } = useNotesContext();
  const note = useMemo(
    () => notes.find((n) => n.id === noteId),
    [notes, noteId]
  );
  const [localTitle, setLocalTitle] = useState("");
  const [localBody, setLocalBody] = useState("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncedNoteIdRef = useRef<string | null>(null);

  // Sincronizar estado local cuando cambia la nota (por ID) o cuando llega del contexto
  useEffect(() => {
    if (!note || note.id !== noteId) return;
    if (lastSyncedNoteIdRef.current === noteId) return;
    lastSyncedNoteIdRef.current = noteId;
    setLocalTitle(note.title);
    setLocalBody(note.body);
  }, [note, noteId]);

  // Autosave con debounce
  useEffect(() => {
    if (lastSyncedNoteIdRef.current !== noteId) return;
    const timer = setTimeout(() => {
      updateNote(noteId, { title: localTitle, body: localBody });
    }, AUTOSAVE_MS);
    saveTimerRef.current = timer;
    return () => {
      clearTimeout(timer);
      saveTimerRef.current = null;
    };
  }, [noteId, localTitle, localBody, updateNote]);

  if (!note) return <EditorEmpty isSyncing={isSyncing} />;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Title */}
      <div className="px-12 pt-8 pb-2 shrink-0">
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
