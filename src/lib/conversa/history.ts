import { useCallback, useEffect, useState } from "react";
import type { HistoryEntry } from "./options";

const KEY = "conversa-quente-history-v1";

function load(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setEntries(load());
  }, []);

  const persist = useCallback((next: HistoryEntry[]) => {
    setEntries(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next.slice(0, 60)));
    } catch {
      /* ignore quota */
    }
  }, []);

  const add = useCallback(
    (entry: Omit<HistoryEntry, "id" | "createdAt" | "favorite">) => {
      persist([
        {
          ...entry,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          favorite: false,
        },
        ...load(),
      ]);
    },
    [persist],
  );

  const toggleFavorite = useCallback(
    (id: string) => persist(load().map((e) => (e.id === id ? { ...e, favorite: !e.favorite } : e))),
    [persist],
  );

  const remove = useCallback((id: string) => persist(load().filter((e) => e.id !== id)), [persist]);

  const clear = useCallback(() => persist([]), [persist]);

  return { entries, add, toggleFavorite, remove, clear };
}
