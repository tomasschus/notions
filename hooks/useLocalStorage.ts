"use client";

import { useState, useEffect, useRef, Dispatch, SetStateAction } from "react";
import { debounce } from "@/lib/debounce";

function readFromStorage<T>(key: string, initial: T): T {
  if (typeof window === "undefined") return initial;
  try {
    const stored = localStorage.getItem(key);
    if (stored !== null) return JSON.parse(stored) as T;
  } catch {
    // ignore parse errors
  }
  return initial;
}

const WRITE_MS = 400;

export function useLocalStorage<T>(
  key: string,
  initial: T
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => readFromStorage(key, initial));
  const debouncedWriteRef = useRef(
    debounce((k: string, v: T) => {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch {
        // ignore write errors
      }
    }, WRITE_MS)
  );

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        setValue(JSON.parse(stored));
      }
    } catch {
      // ignore parse errors
    }
  }, [key]);

  useEffect(() => {
    debouncedWriteRef.current(key, value);
    return () => {
      debouncedWriteRef.current.cancel();
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // ignore
      }
    };
  }, [key, value]);

  return [value, setValue];
}
