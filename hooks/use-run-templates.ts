"use client";

import { useState, useCallback } from "react";

const STORAGE_KEY = "fp_run_templates";

export interface RunTemplate {
  id: string;
  name: string;
  objective: string;
  savedAt: string;
}

function readStorage(): RunTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RunTemplate[];
  } catch {
    return [];
  }
}

function writeStorage(templates: RunTemplate[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch {
    // Storage quota exceeded or unavailable — silently ignore.
  }
}

export function useRunTemplates() {
  const [templates, setTemplates] = useState<RunTemplate[]>(() =>
    readStorage(),
  );

  const saveTemplate = useCallback((name: string, objective: string) => {
    const next: RunTemplate = {
      id: crypto.randomUUID(),
      name: name.trim(),
      objective: objective.trim(),
      savedAt: new Date().toISOString(),
    };
    setTemplates((prev) => {
      const updated = [next, ...prev];
      writeStorage(updated);
      return updated;
    });
  }, []);

  const deleteTemplate = useCallback((id: string) => {
    setTemplates((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      writeStorage(updated);
      return updated;
    });
  }, []);

  return { templates, saveTemplate, deleteTemplate };
}
