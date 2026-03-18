"use client";

import { useState, useEffect, Dispatch, SetStateAction } from "react";

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

export function useLocalStorage<T>(
  key: string,
  initial: T
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => readFromStorage(key, initial));

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
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore write errors
    }
  }, [key, value]);

  return [value, setValue];
}
