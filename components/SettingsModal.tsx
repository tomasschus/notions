"use client";

import { useState, useEffect } from "react";
import { useNotesContext } from "@/context/NotesContext";
import type { Provider } from "@/types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROVIDERS: { value: Provider; label: string; description: string }[] = [
  {
    value: "off",
    label: "Sin autocompletado",
    description: "No sugerencias al escribir",
  },
  {
    value: "browser",
    label: "Modelo local (navegador)",
    description: "WebLLM · WebGPU · sin clave",
  },
  {
    value: "openai",
    label: "OpenAI",
    description: "Clave API · platform.openai.com",
  },
];

const BROWSER_MODELS = [
  {
    value: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    label: "Llama 3.2 1B (~0.9GB, rápido)",
  },
  {
    value: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
    label: "Llama 3.2 3B (~2GB, mejor)",
  },
  {
    value: "Phi-3.5-mini-instruct-q4f16_1-MLC",
    label: "Phi 3.5 mini (~2.2GB)",
  },
  {
    value: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
    label: "Qwen 2.5 1.5B (~1GB)",
  },
];

const OPENAI_MODELS = [
  { value: "gpt-4o-mini", label: "GPT-4o mini" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4.1-mini", label: "GPT-4.1 mini" },
];

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useNotesContext();
  const [provider, setProvider] = useState<Provider>("off");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-4o-mini");
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setProvider(settings.provider ?? "off");
      setApiKey(settings.openaiApiKey);
      setModel(settings.model);
    }
  }, [isOpen, settings]);

  const handleProviderChange = (p: Provider) => {
    setProvider(p);
    if (p === "browser") {
      setModel(BROWSER_MODELS[0].value);
    } else if (p === "openai") {
      setModel(OPENAI_MODELS[0].value);
    }
  };

  if (!isOpen) return null;

  const handleSave = () => {
    updateSettings({ openaiApiKey: apiKey.trim(), model, provider });
    onClose();
  };

  const needsKey = provider === "openai";
  const showModel = provider === "browser" || provider === "openai";
  const modelOptions = provider === "browser" ? BROWSER_MODELS : OPENAI_MODELS;

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
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-2">Autocompletado (IA)</label>
            <div className="space-y-1.5">
              {PROVIDERS.map((p) => (
                <button
                  key={p.value}
                  type="button"
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

          {needsKey && (
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">API Key OpenAI</label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
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

          {provider === "browser" && (
            <div className="bg-neutral-800 rounded-lg px-3 py-2.5 text-xs text-neutral-400 space-y-1">
              <p>Corre en el navegador con <span className="text-neutral-300">WebGPU</span>.</p>
              <p>La primera vez descarga el modelo (aprox. 0.9–2GB) y queda en caché. Usá <span className="text-neutral-300">Chrome o Edge</span>.</p>
            </div>
          )}

          {showModel && (
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">Modelo</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-neutral-800 text-neutral-200 text-sm px-3 py-2 rounded-lg border border-neutral-700 focus:outline-none focus:border-neutral-500"
              >
                {modelOptions.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200 border border-neutral-700 rounded-lg transition-colors hover:bg-neutral-800"
          >
            Cancelar
          </button>
          <button
            type="button"
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
