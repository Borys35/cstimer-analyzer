// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSessionState } from "@/lib/session-state";
import type { StorageAdapter, AppData, TimerSession } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/types";

function makeSession(overrides: Partial<TimerSession> = {}): TimerSession {
  return {
    id: "s1",
    name: "Session_310826_01",
    puzzleType: "3x3",
    createdAt: 1725148800,
    endedAt: null,
    solves: [],
    ...overrides,
  };
}

function createMockAdapter(initial: AppData | null = null): StorageAdapter & {
  saved: AppData | null;
} {
  let data = initial;
  const adapter: StorageAdapter & { saved: AppData | null } = {
    saved: null,
    load: vi.fn(() => data),
    save: vi.fn((d: AppData) => {
      data = d;
      adapter.saved = d;
    }),
    deleteSession: vi.fn((id: string) => {
      if (!data) return;
      data.sessions = data.sessions.filter((s) => s.id !== id);
      if (data.activeSessionId === id) {
        data.activeSessionId = data.sessions[0]?.id ?? "";
      }
      adapter.saved = data;
    }),
    updateSession: vi.fn((session: TimerSession) => {
      if (!data) return;
      const idx = data.sessions.findIndex((s) => s.id === session.id);
      if (idx >= 0) {
        data.sessions[idx] = session;
      } else {
        data.sessions.push(session);
      }
      adapter.saved = data;
    }),
    getActiveSession: vi.fn(() => {
      if (!data) return null;
      const d = data;
      return d.sessions.find((s) => s.id === d.activeSessionId) ?? null;
    }),
    setActiveSession: vi.fn((id: string) => {
      if (!data) return;
      data.activeSessionId = id;
      adapter.saved = data;
    }),
  };
  return adapter;
}

describe("useSessionState", () => {
  let adapter: ReturnType<typeof createMockAdapter>;

  beforeEach(() => {
    adapter = createMockAdapter();
  });

  describe("initialization", () => {
    it("creates a default 3x3 session when no data exists", () => {
      const { result } = renderHook(() => useSessionState(adapter));

      expect(result.current.sessions).toHaveLength(1);
      expect(result.current.sessions[0].puzzleType).toBe("3x3");
      expect(result.current.activeSession).not.toBeNull();
    });

    it("loads existing sessions from adapter", () => {
      const existing = makeSession({ id: "existing", name: "Existing" });
      adapter = createMockAdapter({
        sessions: [existing],
        activeSessionId: "existing",
        settings: DEFAULT_SETTINGS,
      });

      const { result } = renderHook(() => useSessionState(adapter));

      expect(result.current.sessions).toHaveLength(1);
      expect(result.current.sessions[0].id).toBe("existing");
    });
  });

  describe("session naming", () => {
    it("generates Session_DDMMYY_01 for first session of the day", () => {
      const { result } = renderHook(() => useSessionState(adapter));
      const name = result.current.sessions[0].name;
      expect(name).toMatch(/^Session_\d{6}_\d{2}$/);
    });

    it("increments daily counter for subsequent sessions", () => {
      const { result } = renderHook(() => useSessionState(adapter));

      act(() => {
        result.current.createSession("2x2");
      });

      expect(result.current.sessions).toHaveLength(2);
      const names = result.current.sessions.map((s) => s.name);
      expect(names[0]).not.toBe(names[1]);
    });
  });

  describe("createSession", () => {
    it("creates a new session with the given puzzle type", () => {
      const { result } = renderHook(() => useSessionState(adapter));

      act(() => {
        result.current.createSession("2x2");
      });

      expect(result.current.sessions).toHaveLength(2);
      const newSession = result.current.sessions.find(
        (s) => s.puzzleType === "2x2",
      );
      expect(newSession).toBeDefined();
    });

    it("makes the new session active", () => {
      const { result } = renderHook(() => useSessionState(adapter));

      act(() => {
        result.current.createSession("Pyraminx");
      });

      expect(result.current.activeSession?.puzzleType).toBe("Pyraminx");
    });
  });

  describe("switchSession", () => {
    it("switches to a different session", () => {
      const { result } = renderHook(() => useSessionState(adapter));

      act(() => {
        result.current.createSession("2x2");
      });

      const firstSession = result.current.sessions[0];

      act(() => {
        result.current.switchSession(firstSession.id);
      });

      expect(result.current.activeSession?.id).toBe(firstSession.id);
    });
  });

  describe("addSolve", () => {
    it("adds a solve to the active session", () => {
      const { result } = renderHook(() => useSessionState(adapter));

      act(() => {
        result.current.addSolve({
          timeMs: 12345,
          dnf: false,
          penalty: 0,
          scramble: "R U R' U'",
          dateSec: 1725148800,
        });
      });

      expect(result.current.activeSession?.solves).toHaveLength(1);
      expect(result.current.activeSession?.solves[0].timeMs).toBe(12345);
    });

    it("generates a unique id for each solve", () => {
      const { result } = renderHook(() => useSessionState(adapter));

      act(() => {
        result.current.addSolve({
          timeMs: 10000,
          dnf: false,
          penalty: 0,
          scramble: "R",
          dateSec: 1725148800,
        });
      });

      act(() => {
        result.current.addSolve({
          timeMs: 11000,
          dnf: false,
          penalty: 0,
          scramble: "U",
          dateSec: 1725148800,
        });
      });

      const solves = result.current.activeSession?.solves ?? [];
      expect(solves[0].id).not.toBe(solves[1].id);
    });
  });

  describe("deleteSession", () => {
    it("removes a session", () => {
      const { result } = renderHook(() => useSessionState(adapter));

      act(() => {
        result.current.createSession("2x2");
      });

      const toDelete = result.current.sessions.find(
        (s) => s.puzzleType === "2x2",
      )!;

      act(() => {
        result.current.deleteSession(toDelete.id);
      });

      expect(
        result.current.sessions.find((s) => s.id === toDelete.id),
      ).toBeUndefined();
    });
  });

  describe("renameSession", () => {
    it("renames a session", () => {
      const { result } = renderHook(() => useSessionState(adapter));
      const sessionId = result.current.sessions[0].id;

      act(() => {
        result.current.renameSession(sessionId, "My Practice");
      });

      expect(
        result.current.sessions.find((s) => s.id === sessionId)?.name,
      ).toBe("My Practice");
    });
  });

  describe("endSession", () => {
    it("sets endedAt timestamp on the session", () => {
      const { result } = renderHook(() => useSessionState(adapter));
      const sessionId = result.current.sessions[0].id;

      act(() => {
        result.current.endSession(sessionId);
      });

      const ended = result.current.sessions.find((s) => s.id === sessionId);
      expect(ended?.endedAt).toBeTypeOf("number");
    });
  });

  describe("updateSettings", () => {
    it("updates a setting value", () => {
      const { result } = renderHook(() => useSessionState(adapter));

      act(() => {
        result.current.updateSettings({ soundEnabled: true });
      });

      expect(result.current.settings.soundEnabled).toBe(true);
    });
  });

  describe("persistence", () => {
    it("saves to adapter on every state change", () => {
      const { result } = renderHook(() => useSessionState(adapter));

      act(() => {
        result.current.addSolve({
          timeMs: 10000,
          dnf: false,
          penalty: 0,
          scramble: "R",
          dateSec: 1725148800,
        });
      });

      expect(adapter.save).toHaveBeenCalled();
      expect(adapter.saved).not.toBeNull();
      expect(adapter.saved?.sessions[0].solves).toHaveLength(1);
    });
  });
});
