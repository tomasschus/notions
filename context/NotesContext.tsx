"use client";

import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { useSession } from "next-auth/react";
import { Note, AppSettings } from "@/types";
import { normalizeAppSettings } from "@/lib/appSettings";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { previewFromBody } from "@/lib/notePreview";
import { mergeIncomingNotes } from "@/lib/mergeIncomingNotes";

interface NotesContextValue {
  notes: Note[];
  settings: AppSettings;
  createNote: () => Promise<string | null>;
  updateNote: (id: string, patch: Partial<Pick<Note, "title" | "body">>) => void;
  deleteNote: (id: string) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  loadNoteBody: (id: string) => Promise<void>;
  isSyncing: boolean;
  isLoggedIn: boolean;
}

const NotesContext = createContext<NotesContextValue | null>(null);

type ServerNoteListItem = {
  id: string;
  title: string;
  preview: string;
  createdAt: number;
  updatedAt: number;
};

function listItemToNote(item: ServerNoteListItem): Note {
  return {
    ...item,
    body: "",
    bodyLoaded: false,
  };
}

function apiNoteToNote(row: {
  id: string;
  title: string;
  body: string;
  preview: string;
  createdAt: number;
  updatedAt: number;
}): Note {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    preview: row.preview,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    bodyLoaded: true,
  };
}

/** Compatibilidad con notas guardadas antes de preview/bodyLoaded. */
function ensureNoteShape(n: Note): Note {
  if (typeof n.bodyLoaded === "boolean" && typeof n.preview === "string") {
    return n;
  }
  const body = typeof n.body === "string" ? n.body : "";
  return {
    id: n.id,
    title: n.title,
    body,
    preview: previewFromBody(body),
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
    bodyLoaded: true,
  };
}

async function fetchNoteList(): Promise<ServerNoteListItem[]> {
  const res = await fetch("/api/notes");
  if (!res.ok) throw new Error("Failed to fetch notes");
  return res.json();
}

export function NotesProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const isLoggedIn = !!session?.user;

  const [rawLocalNotes, setLocalNotes] = useLocalStorage<Note[]>(
    "notions:notes",
    []
  );

  const localNotes = useMemo(
    () => rawLocalNotes.map(ensureNoteShape),
    [rawLocalNotes]
  );

  const [syncedNotes, setSyncedNotes] = useState<Note[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const [rawSettings, setSettings] = useLocalStorage<AppSettings>(
    "notions:settings",
    { openaiApiKey: "", model: "gpt-4o-mini", provider: "off" }
  );

  const settings = useMemo(
    () => normalizeAppSettings(rawSettings),
    [rawSettings]
  );

  // Sesión puede parpadear; si syncedNotes tiene datos, seguir mostrándolos.
  const notesRaw =
    session?.user || syncedNotes.length > 0 ? syncedNotes : localNotes;

  const notes = useMemo(() => {
    const byId = new Map<string, Note>();
    for (const n of notesRaw) {
      const cur = byId.get(n.id);
      if (!cur) {
        byId.set(n.id, n);
        continue;
      }
      const preferCur =
        cur.updatedAt > n.updatedAt ||
        (cur.updatedAt === n.updatedAt &&
          cur.title.trim() !== "" &&
          n.title.trim() === "");
      byId.set(n.id, preferCur ? cur : n);
    }
    return Array.from(byId.values());
  }, [notesRaw]);

  useEffect(() => {
    if (status === "loading") {
      setIsSyncing(true);
      return;
    }
    if (status !== "authenticated") {
      setIsSyncing(false);
      return;
    }
    let cancelled = false;
    setIsSyncing(true);
    fetchNoteList()
      .then((data) => {
        if (!cancelled) {
          const incoming = data.map(listItemToNote);
          setSyncedNotes((prev) => mergeIncomingNotes(prev, incoming));
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

  const loadNoteBody = useCallback(async (id: string) => {
    const res = await fetch(`/api/notes/${id}`);
    if (!res.ok) return;
    const data = (await res.json()) as {
      id: string;
      title: string;
      body: string;
      preview: string;
      createdAt: number;
      updatedAt: number;
    };
    const incoming = apiNoteToNote(data);
    setSyncedNotes((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n;
        // GET puede llegar antes que el PATCH y traer título/cuerpo vacíos aunque el
        // estado local ya tenga la edición optimista — no pisar esos campos.
        const title =
          incoming.title.trim() === "" && n.title.trim() !== ""
            ? n.title
            : incoming.title;
        const body =
          n.body.length > 0 && incoming.body.length === 0 ? n.body : incoming.body;
        const preview = previewFromBody(body);
        const updatedAt = Math.max(n.updatedAt, incoming.updatedAt);
        return {
          ...incoming,
          title,
          body,
          preview,
          updatedAt,
          bodyLoaded: true,
        };
      })
    );
  }, []);

  const createNote = useCallback(async (): Promise<string | null> => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: "",
      body: "",
      preview: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      bodyLoaded: true,
    };
    if (isLoggedIn) {
      try {
        const res = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "", body: "" }),
        });
        if (!res.ok) throw new Error("Create failed");
        const created = (await res.json()) as {
          id: string;
          title: string;
          body: string;
          preview: string;
          createdAt: number;
          updatedAt: number;
        };
        const note = apiNoteToNote(created);
        setSyncedNotes((prev) => {
          const rest = prev.filter((n) => n.id !== note.id);
          return [note, ...rest];
        });
        return note.id;
      } catch {
        setSyncedNotes((prev) => [newNote, ...prev]);
        return newNote.id;
      }
    } else {
      setLocalNotes((prev) => [...prev.map(ensureNoteShape), newNote]);
      return newNote.id;
    }
  }, [isLoggedIn, setLocalNotes]);

  const updateNote = useCallback(
    async (id: string, patch: Partial<Pick<Note, "title" | "body">>) => {
      const ts = Date.now();
      let wroteSynced = false;
      setSyncedNotes((prev) => {
        if (!prev.some((n) => n.id === id)) return prev;
        wroteSynced = true;
        return prev.map((n) => {
          if (n.id !== id) return n;
          const nextTitle = patch.title !== undefined ? patch.title : n.title;
          const nextBody = patch.body !== undefined ? patch.body : n.body;
          return {
            ...n,
            ...patch,
            preview:
              patch.body !== undefined
                ? previewFromBody(patch.body)
                : n.preview,
            title: nextTitle,
            body: nextBody,
            updatedAt: ts,
          };
        });
      });
      if (!wroteSynced) {
        setLocalNotes((prev) =>
          prev.map((n) => {
            if (n.id !== id) return n;
            const nextBody = patch.body !== undefined ? patch.body : n.body;
            const nextTitle = patch.title !== undefined ? patch.title : n.title;
            return {
              ...n,
              ...patch,
              title: nextTitle,
              body: nextBody,
              preview:
                patch.body !== undefined
                  ? previewFromBody(patch.body)
                  : n.preview,
              updatedAt: ts,
            };
          })
        );
      }
      if (wroteSynced) {
        try {
          await fetch(`/api/notes/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
          });
        } catch {
          // keep optimistic update
        }
      }
    },
    [setLocalNotes]
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
      } else {
        setLocalNotes((prev) => prev.filter((n) => n.id !== id));
      }
    },
    [isLoggedIn, setLocalNotes]
  );

  const updateSettings = useCallback(
    (patch: Partial<AppSettings>) => {
      setSettings((prev) => normalizeAppSettings({ ...prev, ...patch }));
    },
    [setSettings]
  );

  const value = useMemo(
    () => ({
      notes,
      settings,
      createNote,
      updateNote,
      deleteNote,
      updateSettings,
      loadNoteBody,
      isSyncing,
      isLoggedIn,
    }),
    [
      notes,
      settings,
      createNote,
      updateNote,
      deleteNote,
      updateSettings,
      loadNoteBody,
      isSyncing,
      isLoggedIn,
    ]
  );

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  );
}

export function useNotesContext() {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error("useNotesContext must be used inside NotesProvider");
  return ctx;
}
