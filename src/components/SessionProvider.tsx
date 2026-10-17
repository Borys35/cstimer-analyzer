"use client";

import { createContext, useContext, useMemo } from "react";
import { useSessionState } from "@/lib/session-state";
import type { SessionContextValue } from "@/lib/session-state";
import type { StorageAdapter } from "@/lib/types";
import { LocalStorageAdapter } from "@/lib/storage";
import { CloudStorageAdapter } from "@/lib/cloud-adapter";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { LocalMergePrompt } from "@/components/LocalMergePrompt";

const SessionContext = createContext<SessionContextValue | null>(null);

const guestAdapter = new LocalStorageAdapter();

function SessionStateHost({
  adapter,
  children,
}: {
  adapter: StorageAdapter;
  children: React.ReactNode;
}) {
  const value = useSessionState(adapter);
  const memoized = useMemo(() => value, [value]);
  return (
    <SessionContext.Provider value={memoized}>{children}</SessionContext.Provider>
  );
}

/**
 * Signed out: sessions live in this browser (localStorage).
 * Signed in: sessions live in Supabase, cached per user on this device.
 * Switching user remounts the state so nothing leaks between the two.
 */
export function SessionProvider({
  children,
  adapter,
}: {
  children: React.ReactNode;
  adapter?: StorageAdapter;
}) {
  const { configured, ready, user, queue } = useAuth();
  const userId = user?.id ?? null;

  const autoAdapter = useMemo<StorageAdapter>(() => {
    const client = getSupabase();
    if (client && userId && queue) return new CloudStorageAdapter(client, userId, queue);
    return guestAdapter;
  }, [userId, queue]);

  if (adapter) {
    return <SessionStateHost adapter={adapter}>{children}</SessionStateHost>;
  }

  // Don't flash guest data (or create a guest session) before we know who is signed in.
  if (configured && !ready) return null;

  return (
    <SessionStateHost key={userId ?? "guest"} adapter={autoAdapter}>
      {children}
      {userId && <LocalMergePrompt />}
    </SessionStateHost>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return ctx;
}
