"use client";

import { useRef, useCallback, useEffect } from "react";
import { useAutocomplete } from "@/hooks/useAutocomplete";
import { useWebLLM } from "@/hooks/useWebLLM";
import { Provider } from "@/types";

interface GhostTextareaProps {
  value: string;
  onChange: (v: string) => void;
  title?: string;
  apiKey: string;
  model: string;
  provider: Provider;
  placeholder?: string;
}

export function GhostTextarea({
  value,
  onChange,
  title,
  apiKey,
  model,
  provider,
  placeholder,
}: GhostTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { state: webllmState, load, complete } = useWebLLM();

  // Load WebLLM engine when provider is "browser"
  useEffect(() => {
    if (provider === "browser" && webllmState.status === "idle") {
      load(model);
    }
  }, [provider, model, webllmState.status, load]);

  const webllmComplete = provider === "browser" && webllmState.status === "ready"
    ? complete
    : undefined;

  // Build full context: title + body
  const fullContext = title ? `# ${title}\n\n${value}` : value;

  const { ghost, dismissGhost } = useAutocomplete(
    fullContext, apiKey, model, provider, webllmComplete
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab" && ghost) {
        e.preventDefault();
        onChange(value + ghost);
        dismissGhost();
      } else if (e.key === "Escape") {
        dismissGhost();
      }
    },
    [ghost, value, onChange, dismissGhost]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      dismissGhost();
      onChange(e.target.value);
    },
    [onChange, dismissGhost]
  );

  const sharedStyle: React.CSSProperties = {
    fontFamily: "inherit",
    fontSize: "inherit",
    lineHeight: "1.7",
    letterSpacing: "inherit",
    padding: "0",
    margin: "0",
    border: "none",
    outline: "none",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    overflowWrap: "break-word",
  };

  return (
    <div className="relative flex-1 min-h-0">
      {/* WebLLM loading bar */}
      {provider === "browser" && webllmState.status === "loading" && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-neutral-500 mb-1.5">
            <span>Descargando modelo ({webllmState.progress}%)</span>
            <span className="text-neutral-600 truncate max-w-[200px]">
              {webllmState.progressText}
            </span>
          </div>
          <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-neutral-400 rounded-full transition-all duration-300"
              style={{ width: `${webllmState.progress}%` }}
            />
          </div>
          <p className="text-xs text-neutral-600 mt-1">
            Se cachea en el navegador — solo se descarga una vez.
          </p>
        </div>
      )}

      {/* WebLLM error */}
      {provider === "browser" && webllmState.status === "error" && (
        <div className="mb-4 text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-lg px-3 py-2">
          Error: {webllmState.error}. Necesitás Chrome/Edge con WebGPU activado.
        </div>
      )}

      {/* Ghost text layer */}
      <div
        aria-hidden
        style={{
          ...sharedStyle,
          position: "absolute",
          inset: 0,
          color: "transparent",
          pointerEvents: "none",
          userSelect: "none",
          top: provider === "browser" && webllmState.status === "loading" ? "auto" : 0,
        }}
      >
        <span style={{ color: "transparent" }}>{value}</span>
        <span style={{ color: "#6b7280" }}>{ghost}</span>
      </div>

      {/* Input layer */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        spellCheck={false}
        style={{
          ...sharedStyle,
          position: "relative",
          width: "100%",
          height: "100%",
          background: "transparent",
          color: "inherit",
          resize: "none",
          caretColor: "#e5e7eb",
          minHeight: "300px",
        }}
        className="placeholder:text-neutral-600 focus:outline-none"
      />

      {ghost && (
        <div className="absolute bottom-2 right-2 text-xs text-neutral-600 bg-neutral-800 px-2 py-1 rounded pointer-events-none">
          Tab para aceptar
        </div>
      )}
    </div>
  );
}
