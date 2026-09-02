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
}

let idCounter = 0;
function uid(): string {
  return `id-${Date.now()}-${++idCounter}`;
}

function generateSessionName(existing: TimerSession[]): string {
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
  const loaded = adapter.load();
  const [sessions, setSessions] = useState<TimerSession[]>(
    loaded?.sessions ?? [],
  );
  const [activeSessionId, setActiveSessionId] = useState<string>(
    loaded?.activeSessionId ?? "",
  );
  const [settings, setSettings] = useState<TimerSettings>(
    loaded?.settings ?? DEFAULT_SETTINGS,
  );
  const initRef = useRef(false);

  const initDefaultSession = useCallback(() => {
    const defaultSession = createDefaultSession();
    defaultSession.name = generateSessionName([]);
    setSessions([defaultSession]);
    setActiveSessionId(defaultSession.id);
  }, []);

  // Initialize default session on first mount if empty
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    if (sessions.length === 0) {
      initDefaultSession();
    } else if (!sessions.find((s) => s.id === activeSessionId)) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions, activeSessionId, initDefaultSession]);

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
  };
}
