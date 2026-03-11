"use client";

import {
  createContext,
  useContext,
  useCallback,
  ReactNode,
  useMemo,
  useState,
  useEffect,
} from "react";
import { useSession } from "next-auth/react";
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
  isSyncing: boolean;
  isLoggedIn: boolean;
}

const NotesContext = createContext<NotesContextValue | null>(null);

async function fetchNotes(): Promise<Note[]> {
  const res = await fetch("/api/notes");
  if (!res.ok) throw new Error("Failed to fetch notes");
  const data = await res.json();
  return data;
}

export function NotesProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const isLoggedIn = !!session?.user;

  const [localNotes, setLocalNotes] = useLocalStorage<Note[]>("notions:notes", []);
  const [localActiveId, setLocalActiveId] = useLocalStorage<string | null>(
    "notions:activeNoteId",
    null
  );

  const [syncedNotes, setSyncedNotes] = useState<Note[]>([]);
  const [syncedActiveId, setSyncedActiveId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [settings, setSettings] = useLocalStorage<AppSettings>(
    "notions:settings",
    { openaiApiKey: "", model: "llama-3.1-8b-instant", provider: "groq" }
  );

  const notes = isLoggedIn ? syncedNotes : localNotes;
  const activeNoteId = isLoggedIn ? syncedActiveId : localActiveId;
  const setActiveNoteId = isLoggedIn ? setSyncedActiveId : setLocalActiveId;
  const setNotes = isLoggedIn ? setSyncedNotes : setLocalNotes;

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    setIsSyncing(true);
    fetchNotes()
      .then((data) => {
        if (!cancelled) {
          setSyncedNotes(data);
          setSyncedActiveId(data[0]?.id ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) setSyncedNotes([]);
      })
      .finally(() => {
        if (!cancelled) setIsSyncing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  const activeNote = useMemo(
    () => notes.find((n) => n.id === activeNoteId),
    [notes, activeNoteId]
  );

  const createNote = useCallback(async () => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: "",
      body: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    if (isLoggedIn) {
      try {
        const res = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "", body: "" }),
        });
        if (!res.ok) throw new Error("Create failed");
        const created = await res.json();
        setSyncedNotes((prev) => [created, ...prev]);
        setSyncedActiveId(created.id);
      } catch {
        setSyncedNotes((prev) => [newNote, ...prev]);
        setSyncedActiveId(newNote.id);
      }
    } else {
      setLocalNotes((prev) => [newNote, ...prev]);
      setLocalActiveId(newNote.id);
    }
  }, [isLoggedIn, setLocalNotes, setLocalActiveId]);

  const updateNote = useCallback(
    async (id: string, patch: Partial<Pick<Note, "title" | "body">>) => {
      const ts = Date.now();
      if (isLoggedIn) {
        setSyncedNotes((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, ...patch, updatedAt: ts } : n
          )
        );
        try {
          await fetch(`/api/notes/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
          });
        } catch {
          // revert on error if desired; for now we keep optimistic update
        }
      } else {
        setLocalNotes((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, ...patch, updatedAt: ts } : n
          )
        );
      }
    },
    [isLoggedIn, setLocalNotes]
  );

  const deleteNote = useCallback(
    async (id: string) => {
      if (isLoggedIn) {
        try {
          await fetch(`/api/notes/${id}`, { method: "DELETE" });
        } catch {
          // ignore
        }
        setSyncedNotes((prev) => prev.filter((n) => n.id !== id));
        setSyncedActiveId((prev) => {
          if (prev !== id) return prev;
          const remaining = syncedNotes.filter((n) => n.id !== id);
          return remaining[0]?.id ?? null;
        });
      } else {
        setLocalNotes((prev) => prev.filter((n) => n.id !== id));
        setLocalActiveId((prev) => {
          if (prev !== id) return prev;
          const remaining = localNotes.filter((n) => n.id !== id);
          return remaining[0]?.id ?? null;
        });
      }
    },
    [isLoggedIn, setLocalNotes, setLocalActiveId, syncedNotes, localNotes]
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
        isSyncing,
        isLoggedIn,
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
