import { describe, it, expect } from "vitest";
import { mergeIncomingNotes } from "./mergeIncomingNotes";
import type { Note } from "@/types";

function n(
  partial: Omit<Note, "id" | "createdAt" | "updatedAt"> & {
    id: string;
    createdAt?: number;
    updatedAt?: number;
  }
): Note {
  const t = Date.now();
  return {
    createdAt: partial.createdAt ?? t,
    updatedAt: partial.updatedAt ?? t,
    ...partial,
  };
}

describe("mergeIncomingNotes", () => {
  it("conserva cuerpo cuando el servidor manda listado sin body", () => {
    const prev = [
      n({
        id: "a",
        title: "T",
        body: "<p>x</p>",
        preview: "x",
        bodyLoaded: true,
      }),
    ];
    const incoming = [
      n({
        id: "a",
        title: "T2",
        body: "",
        preview: "p",
        bodyLoaded: false,
      }),
    ];
    const out = mergeIncomingNotes(prev, incoming);
    expect(out).toHaveLength(1);
    expect(out[0].body).toBe("<p>x</p>");
    expect(out[0].title).toBe("T2");
    expect(out[0].bodyLoaded).toBe(true);
  });

  it("no pisa título local si el listado del servidor aún trae título vacío", () => {
    const prev = [
      n({
        id: "a",
        title: "BD Nota 1",
        body: "",
        preview: "",
        bodyLoaded: true,
        updatedAt: 2000,
      }),
    ];
    const incoming = [
      n({
        id: "a",
        title: "",
        body: "",
        preview: "",
        bodyLoaded: false,
        updatedAt: 1000,
      }),
    ];
    const out = mergeIncomingNotes(prev, incoming);
    expect(out[0].title).toBe("BD Nota 1");
  });

  it("no pierde nota local que aún no está en el servidor", () => {
    const prev = [
      n({
        id: "local-only",
        title: "Nueva",
        body: "",
        preview: "",
        bodyLoaded: true,
      }),
    ];
    const incoming = [
      n({
        id: "other",
        title: "O",
        body: "",
        preview: "",
        bodyLoaded: false,
      }),
    ];
    const out = mergeIncomingNotes(prev, incoming);
    expect(out.map((x) => x.id).sort()).toEqual(["local-only", "other"]);
  });
});
