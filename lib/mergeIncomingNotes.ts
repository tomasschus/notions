import type { Note } from "@/types";

/** Combina lista del servidor con estado local (cuerpo ya cargado, notas aún no listadas). */
export function mergeIncomingNotes(prev: Note[], incoming: Note[]): Note[] {
  const prevById = new Map(prev.map((n) => [n.id, n]));
  const incomingIds = new Set(incoming.map((n) => n.id));
  const merged = new Map<string, Note>();
  for (const n of incoming) {
    const old = prevById.get(n.id);
    if (old?.bodyLoaded) {
      // La lista GET puede llegar antes que el PATCH y traer título/vista previa vacíos.
      const title =
        n.title.trim() === "" && old.title.trim() !== ""
          ? old.title
          : n.title;
      const preview =
        n.preview.trim() === "" && old.preview.trim() !== ""
          ? old.preview
          : n.preview;
      merged.set(n.id, {
        ...old,
        title,
        preview,
        createdAt: n.createdAt,
        updatedAt: Math.max(old.updatedAt, n.updatedAt),
      });
    } else {
      merged.set(n.id, n);
    }
  }
  for (const p of prev) {
    if (!incomingIds.has(p.id)) merged.set(p.id, p);
  }
  return Array.from(merged.values()).sort((a, b) => b.updatedAt - a.updatedAt);
}
