export interface Note {
  id: string;
  title: string;
  /** HTML completo; vacío hasta cargar detalle si `bodyLoaded` es false. */
  body: string;
  /** Texto plano corto para lista y búsqueda. */
  preview: string;
  createdAt: number;
  updatedAt: number;
  /** En cuenta con sesión: false hasta GET /api/notes/[id]. En local siempre true. */
  bodyLoaded: boolean;
}

/** off = sin sugerencias; browser = WebLLM local; openai = API con clave */
export type Provider = "off" | "browser" | "openai";

export interface AppSettings {
  openaiApiKey: string;
  model: string;
  provider: Provider;
}
