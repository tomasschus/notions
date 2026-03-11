"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Provider } from "@/types";

export function useAutocomplete(
  text: string,
  apiKey: string,
  model: string,
  provider: Provider,
  webllmComplete?: (text: string) => Promise<string>
) {
  const [ghost, setGhost] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const runningRef = useRef(false);

  const dismissGhost = useCallback(() => {
    setGhost("");
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    runningRef.current = false;
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setGhost("");
    runningRef.current = false;

    const needsKey = provider !== "ollama" && provider !== "browser";
    if (needsKey && !apiKey) return;
    if (provider === "browser" && !webllmComplete) return;
    if (text.trim().length < 10) return;

    timerRef.current = setTimeout(async () => {
      runningRef.current = true;

      // Local providers get full text; remote providers get last 2000 chars
      const isLocal = provider === "browser" || provider === "ollama";
      const contextText = isLocal ? text : text.slice(-2000);

      if (provider === "browser" && webllmComplete) {
        try {
          const completion = await webllmComplete(contextText);
          if (runningRef.current && completion) setGhost(completion);
        } catch {
          // ignore
        }
        runningRef.current = false;
        return;
      }

      // Remote providers via API route
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/autocomplete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ text: contextText, model, provider }),
          signal: controller.signal,
        });

        const data = await res.json();
        if (!res.ok) {
          console.warn("[autocomplete] error:", data.error ?? res.status);
          return;
        }
        if (data.completion && !controller.signal.aborted) {
          setGhost(data.completion);
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.warn("[autocomplete] fetch error:", err.message);
        }
      }
      runningRef.current = false;
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      runningRef.current = false;
    };
  }, [text, apiKey, model, provider, webllmComplete]);

  return { ghost, dismissGhost };
}
