import { useEffect, useState } from "react";
import { logger } from "@/lib/logger";

const safeParseJson = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    logger.warn("Failed to parse localStorage value", error);
    return fallback;
  }
};

export const useLocalStorageState = <T,>(key: string, initialValue: T) => {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    return safeParseJson<T>(localStorage.getItem(key), initialValue);
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      logger.warn("Failed to write localStorage value", error);
    }
  }, [key, state]);

  return [state, setState] as const;
};
