"use client";

import { createContext, useContext, useMemo } from "react";
import { useSessionState } from "@/lib/session-state";
import type { SessionContextValue } from "@/lib/session-state";
import type { StorageAdapter } from "@/lib/types";
import { LocalStorageAdapter } from "@/lib/storage";

const SessionContext = createContext<SessionContextValue | null>(null);

const defaultAdapter = new LocalStorageAdapter();

export function SessionProvider({
  children,
  adapter = defaultAdapter,
}: {
  children: React.ReactNode;
  adapter?: StorageAdapter;
}) {
  const value = useSessionState(adapter);
  const memoized = useMemo(() => value, [value]);
  return (
    <SessionContext.Provider value={memoized}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return ctx;
}
