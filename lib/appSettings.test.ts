import { describe, it, expect } from "vitest";
import { normalizeProvider, normalizeAppSettings } from "./appSettings";
import type { AppSettings } from "@/types";

describe("normalizeProvider", () => {
  it("mapea legacy a off", () => {
    expect(normalizeProvider("groq")).toBe("off");
    expect(normalizeProvider("ollama")).toBe("off");
  });

  it("conserva valores válidos", () => {
    expect(normalizeProvider("off")).toBe("off");
    expect(normalizeProvider("browser")).toBe("browser");
    expect(normalizeProvider("openai")).toBe("openai");
  });
});

describe("normalizeAppSettings", () => {
  it("normaliza provider en objeto settings", () => {
    const legacy = {
      openaiApiKey: "",
      model: "x",
      provider: "groq",
    } as unknown as AppSettings;
    const out = normalizeAppSettings(legacy);
    expect(out.provider).toBe("off");
  });
});
