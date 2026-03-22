"use client";

import { useState, useMemo, useCallback } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useNotesContext } from "@/context/NotesContext";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { NoteItem } from "./NoteItem";

interface SidebarProps {
  onOpenSettings: () => void;
}

const NOTES_PATH_PREFIX = "/notes/";

export function Sidebar({ onOpenSettings }: SidebarProps) {
  const { notes, createNote, deleteNote, isSyncing, isLoggedIn } =
    useNotesContext();
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const activeNoteId = useMemo(
    () =>
      pathname.startsWith(NOTES_PATH_PREFIX)
        ? pathname.slice(NOTES_PATH_PREFIX.length)
        : null,
    [pathname]
  );

  const filteredNotes = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return [...notes]
      .filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.preview.toLowerCase().includes(q)
      )
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes, debouncedSearch]);

  const handleCreateNote = useCallback(async () => {
    const id = await createNote();
    if (id) {
      // Dar un tick para que el estado (nueva nota en la lista) se commit antes de navegar
      setTimeout(() => router.push(`/notes/${id}`), 50);
    }
  }, [createNote, router]);

  const handleSelectNote = useCallback(
    (id: string) => router.push(`/notes/${id}`),
    [router]
  );

  const handleDeleteNote = useCallback(
    async (id: string) => {
      const remaining = notes.filter((n) => n.id !== id);
      await deleteNote(id);
      if (id === activeNoteId) {
        router.push(remaining.length > 0 ? `/notes/${remaining[0].id}` : "/");
      }
    },
    [notes, activeNoteId, deleteNote, router]
  );

  return (
    <div
      data-testid="notes-sidebar"
      className="w-60 flex flex-col h-full bg-neutral-900 border-r border-neutral-800"
    >
      {/* Header */}
      <div className="px-3 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-neutral-300">Notas</span>
          <button
            type="button"
            onClick={handleCreateNote}
            className="text-neutral-400 hover:text-neutral-100 transition-colors p-1 rounded hover:bg-neutral-800"
            title="Nueva nota"
            data-testid="sidebar-new-note"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 2v12M2 8h12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar..."
          className="w-full bg-neutral-800 text-neutral-300 text-xs px-3 py-1.5 rounded-md placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600"
        />
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
        {filteredNotes.length === 0 && (
          <p className="text-xs text-neutral-700 text-center mt-8 px-4">
            {search ? "Sin resultados" : "Creá tu primera nota"}
          </p>
        )}
        {filteredNotes.map((note) => (
          <NoteItem
            key={note.id}
            note={note}
            isActive={note.id === activeNoteId}
            onSelect={handleSelectNote}
            onDelete={handleDeleteNote}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 pb-4 pt-2 border-t border-neutral-800 space-y-1">
        {isLoggedIn && (
          <div className="text-xs text-neutral-500 px-2 py-1 truncate" title="Sincronizado con la nube">
            {isSyncing ? "Sincronizando…" : "✓ Sincronizado"}
          </div>
        )}
        <div className="flex gap-1 flex-wrap">
          {isLoggedIn ? (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors px-2 py-1.5 rounded hover:bg-neutral-800"
            >
              Cerrar sesión
            </button>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors px-2 py-1.5 rounded hover:bg-neutral-800"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/auth/signup"
                className="flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors px-2 py-1.5 rounded hover:bg-neutral-800"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors w-full px-2 py-1.5 rounded hover:bg-neutral-800"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.2" />
            <path
              d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.6 2.6l1.1 1.1M10.3 10.3l1.1 1.1M2.6 11.4l1.1-1.1M10.3 3.7l1.1-1.1"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
          Configuración
        </button>
      </div>
    </div>
  );
}
