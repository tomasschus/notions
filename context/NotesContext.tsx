"use client";

import {
  createContext,
  useContext,
  useCallback,
  ReactNode,
  useMemo,
} from "react";
import { Note, AppSettings } from "@/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface NotesContextValue {
  notes: Note[];
  activeNoteId: string | null;
  activeNote: Note | undefined;
  settings: AppSettings;
  createNote: () => void;
  updateNote: (id: string, patch: Partial<Pick<Note, "title" | "body">>) => void;
  deleteNote: (id: string) => void;
  setActiveNoteId: (id: string | null) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
}

const NotesContext = createContext<NotesContextValue | null>(null);

export function NotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useLocalStorage<Note[]>("notions:notes", []);
  const [activeNoteId, setActiveNoteId] = useLocalStorage<string | null>(
    "notions:activeNoteId",
    null
  );
  const [settings, setSettings] = useLocalStorage<AppSettings>(
    "notions:settings",
    { openaiApiKey: "", model: "llama-3.1-8b-instant", provider: "groq" }
  );

  const activeNote = useMemo(
    () => notes.find((n) => n.id === activeNoteId),
    [notes, activeNoteId]
  );

  const createNote = useCallback(() => {
    const note: Note = {
      id: crypto.randomUUID(),
      title: "",
      body: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setNotes((prev) => [note, ...prev]);
    setActiveNoteId(note.id);
  }, [setNotes, setActiveNoteId]);

  const updateNote = useCallback(
    (id: string, patch: Partial<Pick<Note, "title" | "body">>) => {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n
        )
      );
    },
    [setNotes]
  );

  const deleteNote = useCallback(
    (id: string) => {
      setNotes((prev) => {
        const remaining = prev.filter((n) => n.id !== id);
        return remaining;
      });
      setActiveNoteId((prev) => {
        if (prev !== id) return prev;
        const remaining = notes.filter((n) => n.id !== id);
        return remaining[0]?.id ?? null;
      });
    },
    [setNotes, setActiveNoteId, notes]
  );

  const updateSettings = useCallback(
    (patch: Partial<AppSettings>) => {
      setSettings((prev) => ({ ...prev, ...patch }));
    },
    [setSettings]
  );

  return (
    <NotesContext.Provider
      value={{
        notes,
        activeNoteId,
        activeNote,
        settings,
        createNote,
        updateNote,
        deleteNote,
        setActiveNoteId,
        updateSettings,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}

export function useNotesContext() {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error("useNotesContext must be used inside NotesProvider");
  return ctx;
}
