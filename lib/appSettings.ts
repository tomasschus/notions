import type { AppSettings, Provider } from "@/types";

const LEGACY_PROVIDERS = ["groq", "ollama"] as const;

export function normalizeProvider(p: string): Provider {
  if (p === "browser" || p === "openai" || p === "off") return p;
  if (LEGACY_PROVIDERS.includes(p as (typeof LEGACY_PROVIDERS)[number])) return "off";
  return "off";
}

/** Acepta valores legacy en localStorage (groq, ollama). */
export function normalizeAppSettings(s: AppSettings): AppSettings {
  return {
    ...s,
    provider: normalizeProvider(String(s.provider)),
  };
}
