import { describe, it, expect, beforeEach } from "vitest";
import { LocalStorageAdapter } from "@/lib/storage";
import type { AppData, TimerSession, TimerSolve } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/types";

function makeSolve(overrides: Partial<TimerSolve> = {}): TimerSolve {
  return {
    id: "s1",
    timeMs: 12345,
    dnf: false,
    penalty: 0,
    scramble: "R U R' U'",
    dateSec: 1725148800,
    ...overrides,
  };
}

function makeSession(overrides: Partial<TimerSession> = {}): TimerSession {
  return {
    id: "session-1",
    name: "Session_310826_01",
    puzzleType: "3x3",
    createdAt: 1725148800,
    endedAt: null,
    solves: [makeSolve()],
    ...overrides,
  };
}

function makeData(overrides: Partial<AppData> = {}): AppData {
  const session = makeSession();
  return {
    sessions: [session],
    activeSessionId: session.id,
    settings: DEFAULT_SETTINGS,
    ...overrides,
  };
}

// Minimal localStorage mock for node environment
function createLocalStorageMock(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    get length() {
      return store.size;
    },
    key: (index: number) => [...store.keys()][index] ?? null,
  };
}

describe("LocalStorageAdapter", () => {
  let adapter: LocalStorageAdapter;
  let mockStorage: Storage;

  beforeEach(() => {
    mockStorage = createLocalStorageMock();
    // @ts-expect-error – setting mock window for SSR guard
    globalThis.window = { localStorage: mockStorage };
    adapter = new LocalStorageAdapter();
  });

  describe("load / save round-trip", () => {
    it("returns null when nothing is stored", () => {
      expect(adapter.load()).toBeNull();
    });

    it("saves and loads data back identically", () => {
      const data = makeData();
      adapter.save(data);
      expect(adapter.load()).toEqual(data);
    });

    it("returns null on corrupted JSON", () => {
      mockStorage.setItem("cstimer-analyzer", "{bad json");
      expect(adapter.load()).toBeNull();
    });
  });

  describe("session CRUD", () => {
    it("updateSession adds a new session when id not found", () => {
      const data = makeData({ sessions: [] });
      adapter.save(data);

      const newSession = makeSession({ id: "new-1", name: "New Session" });
      adapter.updateSession(newSession);

      const loaded = adapter.load()!;
      expect(loaded.sessions).toHaveLength(1);
      expect(loaded.sessions[0].id).toBe("new-1");
    });

    it("updateSession replaces existing session by id", () => {
      const data = makeData();
      adapter.save(data);

      const updated = makeSession({ name: "Renamed" });
      adapter.updateSession(updated);

      const loaded = adapter.load()!;
      expect(loaded.sessions[0].name).toBe("Renamed");
    });

    it("deleteSession removes the session", () => {
      const s1 = makeSession({ id: "s1" });
      const s2 = makeSession({ id: "s2", name: "Session_310826_02" });
      const data = makeData({ sessions: [s1, s2], activeSessionId: "s1" });
      adapter.save(data);

      adapter.deleteSession("s2");

      const loaded = adapter.load()!;
      expect(loaded.sessions).toHaveLength(1);
      expect(loaded.sessions[0].id).toBe("s1");
    });

    it("deleteSession switches active to first remaining session when deleting active", () => {
      const s1 = makeSession({ id: "s1" });
      const s2 = makeSession({ id: "s2", name: "Session_310826_02" });
      const data = makeData({ sessions: [s1, s2], activeSessionId: "s1" });
      adapter.save(data);

      adapter.deleteSession("s1");

      const loaded = adapter.load()!;
      expect(loaded.activeSessionId).toBe("s2");
    });

    it("deleteSession sets empty activeSessionId when no sessions remain", () => {
      const session = makeSession({ id: "only-one" });
      const data = makeData({ sessions: [session], activeSessionId: "only-one" });
      adapter.save(data);

      adapter.deleteSession("only-one");

      const loaded = adapter.load()!;
      expect(loaded.activeSessionId).toBe("");
    });
  });

  describe("active session management", () => {
    it("getActiveSession returns the active session", () => {
      const session = makeSession();
      const data = makeData({ sessions: [session], activeSessionId: session.id });
      adapter.save(data);

      expect(adapter.getActiveSession()?.id).toBe(session.id);
    });

    it("getActiveSession returns null when no data stored", () => {
      expect(adapter.getActiveSession()).toBeNull();
    });

    it("getActiveSession returns null when activeSessionId references missing session", () => {
      const data = makeData({ sessions: [], activeSessionId: "nonexistent" });
      adapter.save(data);

      expect(adapter.getActiveSession()).toBeNull();
    });

    it("setActiveSession changes the active session", () => {
      const s1 = makeSession({ id: "s1" });
      const s2 = makeSession({ id: "s2", name: "Session_310826_02" });
      const data = makeData({ sessions: [s1, s2], activeSessionId: "s1" });
      adapter.save(data);

      adapter.setActiveSession("s2");

      const loaded = adapter.load()!;
      expect(loaded.activeSessionId).toBe("s2");
    });
  });
});
