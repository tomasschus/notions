"use client";

import dynamic from "next/dynamic";
import {
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { useNotesContext } from "@/context/NotesContext";

const RichEditor = dynamic(
  () => import("./RichEditor").then((m) => ({ default: m.RichEditor })),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center text-neutral-600 text-sm">
        Cargando editor…
      </div>
    ),
  }
);

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

function EditorLoadingNote() {
  return (
    <div className="flex-1 flex items-center justify-center text-neutral-600 select-none">
      <div className="text-center">
        <div className="text-4xl mb-3">✦</div>
        <p className="text-sm">Cargando nota…</p>
      </div>
    </div>
  );
}

export function Editor({ noteId }: EditorProps) {
  const {
    notes,
    updateNote,
    settings,
    isSyncing,
    isLoggedIn,
    loadNoteBody,
  } = useNotesContext();
  const note = useMemo(
    () => notes.find((n) => n.id === noteId),
    [notes, noteId]
  );

  const [localTitle, setLocalTitle] = useState("");
  const [localBody, setLocalBody] = useState("");
  const [draftReady, setDraftReady] = useState(false);
  const lastHydratedNoteIdRef = useRef<string | null>(null);
  const hadBodyLoadedRef = useRef(false);
  const prevRouteNoteIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    const n = notes.find((x) => x.id === noteId);
    if (!n || n.bodyLoaded) return;
    void loadNoteBody(noteId);
  }, [isLoggedIn, noteId, notes, loadNoteBody]);

  useLayoutEffect(() => {
    if (noteId !== prevRouteNoteIdRef.current) {
      prevRouteNoteIdRef.current = noteId;
      lastHydratedNoteIdRef.current = null;
      hadBodyLoadedRef.current = false;
    }

    if (!note || note.id !== noteId) {
      setDraftReady(false);
      return;
    }
    if (isLoggedIn && isSyncing) {
      setDraftReady(false);
      return;
    }
    if (isLoggedIn && !note.bodyLoaded) {
      setDraftReady(false);
      return;
    }

    const shouldHydrate =
      lastHydratedNoteIdRef.current !== noteId ||
      (isLoggedIn && !hadBodyLoadedRef.current && note.bodyLoaded);

    if (!shouldHydrate) {
      // Tras isSyncing u otros estados que pusieron draftReady en false, hay que
      // volver a habilitar el editor sin re-hidratar (shouldHydrate ya fue true).
      setDraftReady(true);
      return;
    }

    const mergedTitle =
      note.title === "" && localTitle !== "" ? localTitle : note.title;
    const mergedBody =
      note.body === "" && localBody !== "" ? localBody : note.body;
    setLocalTitle(mergedTitle);
    setLocalBody(mergedBody);
    lastHydratedNoteIdRef.current = noteId;
    hadBodyLoadedRef.current = note.bodyLoaded;
    setDraftReady(true);
  }, [note, noteId, isLoggedIn, isSyncing, localTitle, localBody]);

  useEffect(() => {
    if (!draftReady) return;
    const timer = setTimeout(() => {
      const next = { title: localTitle, body: localBody };
      if (
        note &&
        note.title === next.title &&
        note.body === next.body
      ) {
        return;
      }
      updateNote(noteId, next);
    }, AUTOSAVE_MS);
    return () => clearTimeout(timer);
  }, [noteId, localTitle, localBody, note, updateNote, draftReady]);

  if (!note) return <EditorEmpty isSyncing={isSyncing} />;

  if (!draftReady) {
    return <EditorLoadingNote />;
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="px-12 pt-8 pb-2 shrink-0">
        <input
          type="text"
          data-testid="note-title-input"
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          placeholder="Sin título"
          className="w-full bg-transparent text-3xl font-bold text-neutral-100 placeholder:text-neutral-700 border-none outline-none"
        />
      </div>

      <RichEditor
        key={noteId}
        content={localBody}
        onChange={setLocalBody}
        noteId={noteId}
        title={localTitle}
        apiKey={settings.openaiApiKey}
        model={settings.model}
        provider={settings.provider ?? "off"}
      />
    </div>
  );
}
