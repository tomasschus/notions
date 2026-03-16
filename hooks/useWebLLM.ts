"use client";

import { useState, useCallback, useRef } from "react";

type EngineStatus = "idle" | "loading" | "ready" | "error";

interface WebLLMState {
  status: EngineStatus;
  progress: number;   // 0-100
  progressText: string;
  error: string;
}

// Singleton engine shared across hook instances
let engineInstance: import("@mlc-ai/web-llm").MLCEngine | null = null;
let engineModel: string | null = null;
let enginePromise: Promise<import("@mlc-ai/web-llm").MLCEngine> | null = null;

export function useWebLLM() {
  const [state, setState] = useState<WebLLMState>({
    status: engineInstance ? "ready" : "idle",
    progress: 0,
    progressText: "",
    error: "",
  });
  const abortRef = useRef(false);

  const load = useCallback(async (model: string) => {
    // Already loaded with same model
    if (engineInstance && engineModel === model) {
      setState((s) => ({ ...s, status: "ready" }));
      return engineInstance;
    }

    // In-flight load for the same model
    if (enginePromise && engineModel === model) {
      setState((s) => ({ ...s, status: "loading" }));
      return enginePromise;
    }

    abortRef.current = false;
    engineModel = model;
    engineInstance = null;

    setState({ status: "loading", progress: 0, progressText: "Iniciando...", error: "" });

    enginePromise = (async () => {
      const { MLCEngine } = await import("@mlc-ai/web-llm");
      const engine = new MLCEngine();

      engine.setInitProgressCallback((report) => {
        if (abortRef.current) return;
        setState({
          status: "loading",
          progress: Math.round(report.progress * 100),
          progressText: report.text,
          error: "",
        });
      });

      await engine.reload(model);

      engineInstance = engine;
      if (!abortRef.current) {
        setState({ status: "ready", progress: 100, progressText: "", error: "" });
      }
      return engine;
    })().catch((err) => {
      enginePromise = null;
      engineInstance = null;
      const msg = err instanceof Error ? err.message : String(err);
      setState({ status: "error", progress: 0, progressText: "", error: msg });
      throw err;
    });

    return enginePromise;
  }, []);

  const complete = useCallback(async (text: string): Promise<string> => {
    if (!engineInstance) return "";
    try {
      const res = await engineInstance.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are an autocomplete assistant. Continue the user's text naturally. Output only the continuation, nothing else. Maximum 1-2 sentences.",
          },
          { role: "user", content: text },
        ],
        max_tokens: 80,
        temperature: 0.7,
      });
      return res.choices[0]?.message?.content ?? "";
    } catch {
      return "";
    }
  }, []);

  const summarize = useCallback(async (text: string): Promise<string> => {
    if (!engineInstance) return "";
    try {
      const res = await engineInstance.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are a summarization assistant. Summarize the provided text concisely, preserving the key points. Output only the summary, nothing else.",
          },
          { role: "user", content: text },
        ],
        max_tokens: 300,
        temperature: 0.5,
      });
      return res.choices[0]?.message?.content ?? "";
    } catch {
      return "";
    }
  }, []);

  return { state, load, complete, summarize };
}
