"use client";

import { useMemo } from "react";
import Dashboard from "@/components/Dashboard";
import { LocalStorageAdapter } from "@/lib/storage";
import { convertTimerSessionsToParseResult } from "@/lib/import-export";

const STORAGE_KEY = "cstimer-analyzer";

export default function Stats() {
  const initialData = useMemo(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return undefined;
      const parsed = JSON.parse(raw);
      if (!parsed.sessions || !Array.isArray(parsed.sessions) || parsed.sessions.length === 0) {
        return undefined;
      }
      return convertTimerSessionsToParseResult(parsed.sessions);
    } catch {
      return undefined;
    }
  }, []);

  return <Dashboard initialData={initialData} />;
}
