"use client";

import { useState, useEffect } from "react";
import { useNotesContext } from "@/context/NotesContext";
import { Provider } from "@/types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROVIDERS: { value: Provider; label: string; description: string }[] = [
  {
    value: "browser",
    label: "Navegador (WebLLM)",
    description: "Sin key · corre en el browser · Chrome/Edge",
  },
  {
    value: "groq",
    label: "Groq",
    description: "Gratis · console.groq.com",
  },
  {
    value: "ollama",
    label: "Ollama (local)",
    description: "Gratis · sin key · necesita Ollama corriendo",
  },
  {
    value: "openai",
    label: "OpenAI",
    description: "De pago · platform.openai.com",
  },
];

const MODELS: Record<Provider, { value: string; label: string }[]> = {
  browser: [
    { value: "Llama-3.2-1B-Instruct-q4f16_1-MLC", label: "Llama 3.2 1B (~0.9GB, rápido)" },
    { value: "Llama-3.2-3B-Instruct-q4f16_1-MLC", label: "Llama 3.2 3B (~2GB, mejor)" },
    { value: "Phi-3.5-mini-instruct-q4f16_1-MLC", label: "Phi 3.5 mini (~2.2GB)" },
    { value: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC", label: "Qwen 2.5 1.5B (~1GB)" },
  ],
  groq: [
    { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B (rápido)" },
    { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B (mejor)" },
    { value: "gemma2-9b-it", label: "Gemma 2 9B" },
    { value: "mixtral-8x7b-32768", label: "Mixtral 8x7B" },
  ],
  ollama: [
    { value: "llama3.2", label: "Llama 3.2" },
    { value: "llama3.1", label: "Llama 3.1" },
    { value: "mistral", label: "Mistral" },
    { value: "qwen2.5", label: "Qwen 2.5" },
  ],
  openai: [
    { value: "gpt-4o-mini", label: "GPT-4o mini" },
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4.1-mini", label: "GPT-4.1 mini" },
  ],
};

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useNotesContext();
  const [provider, setProvider] = useState<Provider>("groq");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("llama-3.1-8b-instant");
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setProvider(settings.provider ?? "groq");
      setApiKey(settings.openaiApiKey);
      setModel(settings.model);
    }
  }, [isOpen, settings]);

  const handleProviderChange = (p: Provider) => {
    setProvider(p);
    setModel(MODELS[p][0].value);
  };

  if (!isOpen) return null;

  const handleSave = () => {
    updateSettings({ openaiApiKey: apiKey.trim(), model, provider });
    onClose();
  };

  const needsKey = provider !== "ollama" && provider !== "browser";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-md mx-4 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-neutral-100">Configuración</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300 transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Provider */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-2">Proveedor de IA</label>
            <div className="space-y-1.5">
              {PROVIDERS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => handleProviderChange(p.value)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-colors ${
                    provider === p.value
                      ? "border-neutral-500 bg-neutral-800 text-neutral-100"
                      : "border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:bg-neutral-800/50"
                  }`}
                >
                  <span className="text-sm font-medium">{p.label}</span>
                  <span className="text-xs text-neutral-500">{p.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* API Key */}
          {needsKey && (
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">API Key</label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={provider === "groq" ? "gsk_..." : "sk-..."}
                  className="w-full bg-neutral-800 text-neutral-200 text-sm px-3 py-2 pr-10 rounded-lg border border-neutral-700 focus:outline-none focus:border-neutral-500 placeholder:text-neutral-600"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2"/>
                    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
                    {showKey && <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>}
                  </svg>
                </button>
              </div>
              <p className="text-xs text-neutral-600 mt-1">Se guarda solo en tu navegador (localStorage).</p>
            </div>
          )}

          {/* Hints */}
          {provider === "browser" && (
            <div className="bg-neutral-800 rounded-lg px-3 py-2.5 text-xs text-neutral-400 space-y-1">
              <p>Corre directo en el navegador con <span className="text-neutral-300">WebGPU</span>.</p>
              <p>Primera vez descarga el modelo (0.9–2GB) y queda cacheado. Requiere <span className="text-neutral-300">Chrome o Edge</span>.</p>
            </div>
          )}
          {provider === "ollama" && (
            <div className="bg-neutral-800 rounded-lg px-3 py-2.5 text-xs text-neutral-400 space-y-1">
              <p>Necesitás Ollama corriendo en <code className="text-neutral-300">localhost:11434</code></p>
              <p>Instalá desde <span className="text-neutral-300">ollama.com</span> y corré: <code className="text-neutral-300">ollama run llama3.2</code></p>
            </div>
          )}

          {/* Model */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Modelo</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-neutral-800 text-neutral-200 text-sm px-3 py-2 rounded-lg border border-neutral-700 focus:outline-none focus:border-neutral-500"
            >
              {MODELS[provider].map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200 border border-neutral-700 rounded-lg transition-colors hover:bg-neutral-800"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 text-sm font-medium text-neutral-900 bg-neutral-100 hover:bg-white rounded-lg transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
