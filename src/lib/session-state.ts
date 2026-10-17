import { useState, useCallback, useEffect, useRef } from "react";
import type { StorageAdapter, TimerSession, TimerSolve, TimerSettings, PuzzleType } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/types";
import { importCstimer } from "@/lib/import-export";

export interface SessionContextValue {
  sessions: TimerSession[];
  activeSession: TimerSession | null;
  settings: TimerSettings;
  addSolve: (solve: Omit<TimerSolve, "id">) => void;
  restoreSolve: (sessionId: string, solve: Omit<TimerSolve, "id">) => void;
  createSession: (puzzleType: PuzzleType) => void;
  switchSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  renameSession: (sessionId: string, name: string) => void;
  endSession: (sessionId: string) => void;
  deleteSolve: (sessionId: string, solveId: string) => void;
  updateSolve: (sessionId: string, solveId: string, patch: Partial<Pick<TimerSolve, "penalty" | "dnf">>) => void;
  updateSettings: (patch: Partial<TimerSettings>) => void;
  importSessions: (text: string) => { imported: number; duplicates: number };
  clearAllSessions: () => void;
  /** Append sessions not already present (by id), e.g. local sessions moved to the cloud. */
  mergeSessions: (incoming: TimerSession[], activeId?: string) => void;
  /** False until an async (cloud) adapter has delivered its first data. */
  hydrated: boolean;
}

/** Re-pull from the cloud at most this often when the tab regains focus. */
const REFRESH_INTERVAL_MS = 30_000;

let idCounter = 0;
function uid(): string {
  return `id-${Date.now()}-${++idCounter}`;
}

export function generateSessionName(existing: TimerSession[]): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = String(now.getFullYear()).slice(-2);
  const datePart = `${dd}${mm}${yy}`;

  const todaySessions = existing.filter((s) =>
    s.name.startsWith(`Session_${datePart}`),
  );
  const counter = todaySessions.length + 1;
  return `Session_${datePart}_${String(counter).padStart(2, "0")}`;
}

function createDefaultSession(): TimerSession {
  const now = Math.floor(Date.now() / 1000);
  return {
    id: uid(),
    name: "Session_010170_01",
    puzzleType: "3x3",
    createdAt: now,
    endedAt: null,
    solves: [],
  };
}

export function useSessionState(adapter: StorageAdapter): SessionContextValue {
  const [loaded] = useState(() => adapter.load());
  const [hydrated, setHydrated] = useState(!adapter.hydrate);
  const [sessions, setSessions] = useState<TimerSession[]>(
    loaded?.sessions ?? [],
  );
  const [activeSessionId, setActiveSessionId] = useState<string>(
    loaded?.activeSessionId ?? "",
  );
  const [settings, setSettings] = useState<TimerSettings>(
    { ...DEFAULT_SETTINGS, ...loaded?.settings },
  );
  const initRef = useRef(false);

  const initDefaultSession = useCallback(() => {
    const defaultSession = createDefaultSession();
    defaultSession.name = generateSessionName([]);
    setSessions([defaultSession]);
    setActiveSessionId(defaultSession.id);
  }, []);

  // Pull from an async source (cloud), then on tab focus. The adapter returns
  // null when it can't or shouldn't replace local state.
  const pull = useCallback(async () => {
    const data = await adapter.hydrate?.();
    if (!data) return;
    setSessions(data.sessions);
    setActiveSessionId((current) =>
      data.sessions.some((s) => s.id === current)
        ? current
        : data.activeSessionId || (data.sessions[data.sessions.length - 1]?.id ?? ""),
    );
  }, [adapter]);

  useEffect(() => {
    if (!adapter.hydrate) return;
    let cancelled = false;
    let lastPull = Date.now();
    void pull().finally(() => {
      if (!cancelled) setHydrated(true);
    });

    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastPull < REFRESH_INTERVAL_MS) return;
      lastPull = Date.now();
      void pull();
    };
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("online", refresh);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("online", refresh);
    };
  }, [adapter, pull]);

  // Initialize default session once data is in, if empty. Waiting for the
  // cloud matters: otherwise every new device would upload an empty session.
  useEffect(() => {
    if (!hydrated || initRef.current) return;
    initRef.current = true;
    if (sessions.length === 0) {
      initDefaultSession();
    } else if (!sessions.find((s) => s.id === activeSessionId)) {
      setActiveSessionId(sessions[0].id);
    }
  }, [hydrated, sessions, activeSessionId, initDefaultSession]);

  // Auto-save on every state change (skip first render since initial state comes from adapter)
  const initialSaveSkipped = useRef(false);
  useEffect(() => {
    if (!initialSaveSkipped.current) {
      initialSaveSkipped.current = true;
      return;
    }
    if (sessions.length === 0 && activeSessionId === "") return;
    adapter.save({ sessions, activeSessionId, settings });
  }, [sessions, activeSessionId, settings, adapter]);

  const activeSession =
    sessions.find((s) => s.id === activeSessionId) ?? null;

  const addSolve = useCallback(
    (solve: Omit<TimerSolve, "id">) => {
      const newSolve: TimerSolve = { ...solve, id: uid() };
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, solves: [...s.solves, newSolve], endedAt: solve.dateSec }
            : s,
        ),
      );
    },
    [activeSessionId],
  );

  const restoreSolve = useCallback(
    (sessionId: string, solve: Omit<TimerSolve, "id">) => {
      const newSolve: TimerSolve = { ...solve, id: uid() };
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== sessionId) return s;
          const solves = [...s.solves, newSolve].sort((a, b) => a.dateSec - b.dateSec);
          return { ...s, solves, endedAt: Math.max(...solves.map((x) => x.dateSec)) };
        }),
      );
    },
    [],
  );

  const createSession = useCallback(
    (puzzleType: PuzzleType) => {
      setSessions((prev) => {
        const now = Math.floor(Date.now() / 1000);
        const newSession: TimerSession = {
          id: uid(),
          name: generateSessionName(prev),
          puzzleType,
          createdAt: now,
          endedAt: null,
          solves: [],
        };
        setActiveSessionId(newSession.id);
        return [...prev, newSession];
      });
    },
    [],
  );

  const switchSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
  }, []);

  const deleteSession = useCallback(
    (sessionId: string) => {
      setSessions((prev) => {
        const next = prev.filter((s) => s.id !== sessionId);
        if (activeSessionId === sessionId) {
          setActiveSessionId(next[0]?.id ?? "");
        }
        return next;
      });
    },
    [activeSessionId],
  );

  const renameSession = useCallback((sessionId: string, name: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, name } : s)),
    );
  }, []);

  const endSession = useCallback((sessionId: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, endedAt: s.endedAt ?? Math.floor(Date.now() / 1000) }
          : s,
      ),
    );
  }, []);

  const deleteSolve = useCallback((sessionId: string, solveId: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, solves: s.solves.filter((sol) => sol.id !== solveId) }
          : s,
      ),
    );
  }, []);

  const updateSolve = useCallback(
    (sessionId: string, solveId: string, patch: Partial<Pick<TimerSolve, "penalty" | "dnf">>) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                solves: s.solves.map((sol) =>
                  sol.id === solveId ? { ...sol, ...patch } : sol,
                ),
              }
            : s,
        ),
      );
    },
    [],
  );

  const updateSettings = useCallback((patch: Partial<TimerSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const importSessions = useCallback(
    (text: string) => {
      const result = importCstimer(text, sessions);
      if (result.imported.length > 0) {
        setSessions((prev) => [...prev, ...result.imported]);
      }
      return { imported: result.imported.length, duplicates: result.duplicates };
    },
    [sessions],
  );

  const clearAllSessions = useCallback(() => {
    initDefaultSession();
  }, [initDefaultSession]);

  const mergeSessions = useCallback((incoming: TimerSession[], activeId?: string) => {
    setSessions((prev) => {
      const have = new Set(prev.map((s) => s.id));
      const added = incoming.filter((s) => !have.has(s.id));
      if (!added.length) return prev;
      // A brand-new account holds just the auto-created empty session; drop it
      // rather than leave a stray placeholder next to the real ones.
      const base = prev.length === 1 && prev[0].solves.length === 0 ? [] : prev;
      return [...base, ...added];
    });
    // Carry on in the merged (local) session; this also covers the dropped placeholder.
    const nextActive = activeId ?? incoming[incoming.length - 1]?.id;
    if (nextActive) setActiveSessionId(nextActive);
  }, []);

  return {
    sessions,
    activeSession,
    settings,
    addSolve,
    restoreSolve,
    createSession,
    switchSession,
    deleteSession,
    renameSession,
    endSession,
    deleteSolve,
    updateSolve,
    updateSettings,
    importSessions,
    clearAllSessions,
    mergeSessions,
    hydrated,
  };
}
