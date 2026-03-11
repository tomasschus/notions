export interface Note {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
}

export type Provider = "openai" | "groq" | "ollama" | "browser";

export interface AppSettings {
  openaiApiKey: string;
  model: string;
  provider: Provider;
}
