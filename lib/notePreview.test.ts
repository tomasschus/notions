import { describe, it, expect } from "vitest";
import { stripHtml, previewFromBody } from "./notePreview";

describe("stripHtml", () => {
  it("elimina etiquetas simples", () => {
    expect(stripHtml("<p>Hola</p>")).toBe("Hola");
  });

  it("colapsa espacios", () => {
    expect(stripHtml("a  <b>b</b>  c")).toBe("a b c");
  });
});

describe("previewFromBody", () => {
  it("acorta texto largo", () => {
    const long = "x".repeat(250);
    const p = previewFromBody(`<p>${long}</p>`, 200);
    expect(p.length).toBeLessThanOrEqual(202);
    expect(p.endsWith("…")).toBe(true);
  });

  it("no trunca si cabe", () => {
    expect(previewFromBody("Hola mundo", 200)).toBe("Hola mundo");
  });
});
