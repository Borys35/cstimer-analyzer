import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TimerSession, TimerSolve } from "@/lib/types";
import {
  coalesceOps,
  diffSessions,
  fetchAllSessions,
  isPermanentError,
  rowsToSessions,
  sessionToRow,
  solveToRow,
  SyncQueue,
  type SessionRow,
  type SolveRow,
} from "@/lib/cloud-sync";
import { CloudStorageAdapter } from "@/lib/cloud-adapter";
import { LocalStorageAdapter } from "@/lib/storage";
import { DEFAULT_SETTINGS } from "@/lib/types";

const USER = "user-1";

function solve(id: string, timeMs = 10000, dateSec = 1000): TimerSolve {
  return { id, timeMs, dnf: false, penalty: 0, scramble: "R U", dateSec };
}

function session(id: string, solves: TimerSolve[] = [], extra: Partial<TimerSession> = {}): TimerSession {
  return { id, name: `S ${id}`, puzzleType: "3x3", createdAt: 100, endedAt: null, solves, ...extra };
}

/** In-memory stand-in for the slice of the PostgREST builder cloud-sync uses. */
function fakeSupabase(opts: { pageLimit?: number } = {}) {
  const tables: Record<string, Map<string, Record<string, unknown>>> = {
    timer_sessions: new Map(),
    timer_solves: new Map(),
  };
  const calls: string[] = [];
  let failNext: { error: unknown } | null = null;

  const result = (data: unknown) => {
    if (failNext) {
      const f = failNext;
      failNext = null;
      return Promise.resolve({ data: null, error: f.error });
    }
    return Promise.resolve({ data, error: null });
  };

  const client = {
    from(table: string) {
      const rows = tables[table];
      return {
        upsert(input: Record<string, unknown>[]) {
          calls.push(`upsert ${table} ${input.length}`);
          if (!failNext) for (const r of input) rows.set(`${r.user_id}/${r.id}`, { ...r });
          return result(null);
        },
        delete() {
          return {
            eq(_c: string, user: string) {
              return {
                in(_c2: string, ids: string[]) {
                  calls.push(`delete ${table} ${ids.length}`);
                  if (!failNext) {
                    for (const id of ids) {
                      rows.delete(`${user}/${id}`);
                      if (table === "timer_sessions") {
                        for (const [k, v] of tables.timer_solves) {
                          if (v.user_id === user && v.session_id === id) tables.timer_solves.delete(k);
                        }
                      }
                    }
                  }
                  return result(null);
                },
              };
            },
          };
        },
        select() {
          let user = "";
          let after: string | null = null;
          let limit = Infinity;
          const builder = {
            eq(_c: string, v: string) { user = v; return builder; },
            order() { return builder; },
            limit(n: number) { limit = Math.min(n, opts.pageLimit ?? Infinity); return builder; },
            gt(_c: string, v: string) { after = v; return builder; },
            then(resolve: (v: unknown) => void, reject?: (e: unknown) => void) {
              calls.push(`select ${table}`);
              const data = [...rows.values()]
                .filter((r) => r.user_id === user && (after === null || String(r.id) > after))
                .sort((a, b) => String(a.id).localeCompare(String(b.id)))
                .slice(0, limit);
              return result(data).then(resolve, reject);
            },
          };
          return builder;
        },
      };
    },
  };

  return {
    client: client as unknown as SupabaseClient,
    tables,
    calls,
    failOnce(error: unknown) { failNext = { error }; },
  };
}

function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() { return m.size; },
    clear: () => m.clear(),
    getItem: (k) => m.get(k) ?? null,
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => void m.delete(k),
    setItem: (k, v) => void m.set(k, v),
  };
}

describe("diffSessions", () => {
  it("is empty when nothing changed (same references)", () => {
    const s = [session("a", [solve("1")])];
    expect(diffSessions(USER, s, s)).toEqual([]);
  });

  it("is empty for structurally equal copies", () => {
    const s = [session("a", [solve("1")])];
    expect(diffSessions(USER, s, JSON.parse(JSON.stringify(s)))).toEqual([]);
  });

  it("uploads a new session and all its solves, session first", () => {
    const next = [session("a", [solve("1"), solve("2")])];
    const ops = diffSessions(USER, [], next);
    expect(ops.map((o) => o.kind)).toEqual(["upsertSessions", "upsertSolves"]);
    expect(ops[1]).toMatchObject({ rows: [{ id: "1", session_id: "a", user_id: USER }, { id: "2" }] });
  });

  it("only upserts the solve that was added", () => {
    const a = session("a", [solve("1")]);
    const b = { ...a, solves: [...a.solves, solve("2")], endedAt: 1000 };
    const ops = diffSessions(USER, [a], [b]);
    expect(ops).toEqual([
      { kind: "upsertSessions", rows: [sessionToRow(USER, b)] },
      { kind: "upsertSolves", rows: [solveToRow(USER, "a", solve("2"))] },
    ]);
  });

  it("upserts an edited solve without touching session meta", () => {
    const a = session("a", [solve("1")]);
    const b = { ...a, solves: [{ ...a.solves[0], penalty: 1 }] };
    const ops = diffSessions(USER, [a], [b]);
    expect(ops).toEqual([{ kind: "upsertSolves", rows: [{ ...solveToRow(USER, "a", solve("1")), penalty: 1 }] }]);
  });

  it("deletes removed solves and sessions, sessions last", () => {
    const a = session("a", [solve("1"), solve("2")]);
    const b = session("b", [solve("3")]);
    const ops = diffSessions(USER, [a, b], [{ ...a, solves: [a.solves[0]] }]);
    expect(ops).toEqual([
      { kind: "deleteSolves", ids: ["2"] },
      { kind: "deleteSessions", ids: ["b"] },
    ]);
  });

  it("upserts a renamed session", () => {
    const a = session("a");
    expect(diffSessions(USER, [a], [{ ...a, name: "Renamed" }])).toEqual([
      { kind: "upsertSessions", rows: [{ ...sessionToRow(USER, a), name: "Renamed" }] },
    ]);
  });
});

describe("coalesceOps", () => {
  it("merges adjacent same-kind ops, last write wins per id", () => {
    const r1 = solveToRow(USER, "a", solve("1", 1));
    const r1b = solveToRow(USER, "a", solve("1", 2));
    const r2 = solveToRow(USER, "a", solve("2"));
    expect(
      coalesceOps([
        { kind: "upsertSolves", rows: [r1] },
        { kind: "upsertSolves", rows: [r2, r1b] },
        { kind: "deleteSolves", ids: ["9"] },
        { kind: "deleteSolves", ids: ["9", "8"] },
      ]),
    ).toEqual([
      { kind: "upsertSolves", rows: [r1b, r2] },
      { kind: "deleteSolves", ids: ["9", "8"] },
    ]);
  });

  it("keeps order across different kinds", () => {
    const ops = coalesceOps([
      { kind: "upsertSolves", rows: [] },
      { kind: "deleteSolves", ids: ["1"] },
      { kind: "upsertSolves", rows: [] },
    ]);
    expect(ops.map((o) => o.kind)).toEqual(["upsertSolves", "deleteSolves", "upsertSolves"]);
  });
});

describe("rowsToSessions", () => {
  it("rebuilds sessions oldest-first with solves in time order", () => {
    const sessions: SessionRow[] = [
      { user_id: USER, id: "b", name: "B", puzzle_type: "2x2", created_at: 200, ended_at: null },
      { user_id: USER, id: "a", name: "A", puzzle_type: "3x3", created_at: 100, ended_at: 150 },
    ];
    const solves: SolveRow[] = [
      { ...solveToRow(USER, "a", solve("id-5-2", 1, 120)) },
      { ...solveToRow(USER, "a", solve("id-5-10", 1, 120)) },
      { ...solveToRow(USER, "a", solve("x", 1, 110)) },
    ];
    const out = rowsToSessions(sessions, solves);
    expect(out.map((s) => s.id)).toEqual(["a", "b"]);
    expect(out[0].solves.map((s) => s.id)).toEqual(["x", "id-5-2", "id-5-10"]);
    expect(out[0]).toMatchObject({ name: "A", puzzleType: "3x3", createdAt: 100, endedAt: 150 });
    expect(out[1].solves).toEqual([]);
  });
});

describe("isPermanentError", () => {
  it.each([
    [{ code: "23505" }, true],
    [{ code: "42501" }, true],
    [{ code: "PGRST204" }, true],
    [{ code: "" , message: "TypeError: Failed to fetch" }, false],
    [{ message: "network" }, false],
    [{ code: "PGRST301" }, false],
    [{ code: "40001" }, false],
    [{ code: "08006" }, false],
    [null, false],
  ])("%j → %s", (err, expected) => {
    expect(isPermanentError(err)).toBe(expected);
  });
});

describe("fetchAllSessions", () => {
  it("pages through more rows than one page holds", async () => {
    const fake = fakeSupabase({ pageLimit: 2 });
    const sessions = [session("a", [solve("1"), solve("2"), solve("3")]), session("b", [solve("4")])];
    const queue = new SyncQueue(fake.client, USER, memoryStorage());
    queue.enqueue(diffSessions(USER, [], sessions));
    expect(await queue.flush()).toBe(true);

    const out = await fetchAllSessions(fake.client, USER);
    expect(out.map((s) => [s.id, s.solves.map((x) => x.id)])).toEqual([
      ["a", ["1", "2", "3"]],
      ["b", ["4"]],
    ]);
  });

  it("never returns another user's rows", async () => {
    const fake = fakeSupabase();
    const q = new SyncQueue(fake.client, "other", memoryStorage());
    q.enqueue(diffSessions("other", [], [session("a", [solve("1")])]));
    await q.flush();
    expect(await fetchAllSessions(fake.client, USER)).toEqual([]);
  });
});

describe("SyncQueue", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("persists ops that fail with a network error and retries them", async () => {
    const fake = fakeSupabase();
    const storage = memoryStorage();
    const q = new SyncQueue(fake.client, USER, storage);
    const statuses: string[] = [];
    q.subscribe((s) => statuses.push(s));

    fake.failOnce({ message: "TypeError: Failed to fetch", code: "" });
    q.enqueue(diffSessions(USER, [], [session("a", [solve("1")])]));
    await vi.waitFor(() => expect(q.getStatus()).toBe("offline"));
    expect(q.pending).toBe(2);
    expect(storage.getItem(SyncQueue.storageKey(USER))).not.toBeNull();

    // A fresh queue (page reload) picks the ops back up.
    const reloaded = new SyncQueue(fake.client, USER, storage);
    expect(reloaded.pending).toBe(2);

    await vi.advanceTimersByTimeAsync(2000);
    await vi.waitFor(() => expect(q.getStatus()).toBe("synced"));
    expect(q.pending).toBe(0);
    expect(fake.tables.timer_solves.size).toBe(1);
    expect(storage.getItem(SyncQueue.storageKey(USER))).toBeNull();
    expect(statuses).toEqual(["syncing", "offline", "syncing", "synced"]);
  });

  it("drops an op the server rejects instead of blocking the queue", async () => {
    const fake = fakeSupabase();
    const q = new SyncQueue(fake.client, USER, memoryStorage());
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    fake.failOnce({ code: "23514", message: "check constraint" });
    q.enqueue([{ kind: "upsertSessions", rows: [sessionToRow(USER, session("bad"))] }]);
    q.enqueue([{ kind: "deleteSolves", ids: ["x"] }]);
    expect(await q.flush()).toBe(true);
    expect(q.pending).toBe(0);
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });
});

describe("CloudStorageAdapter", () => {
  function setup() {
    const fake = fakeSupabase();
    const storage = memoryStorage();
    const queue = new SyncQueue(fake.client, USER, storage);
    const guest = new LocalStorageAdapter();
    vi.spyOn(guest, "load").mockReturnValue({
      sessions: [session("guest")],
      activeSessionId: "guest",
      settings: { ...DEFAULT_SETTINGS, startDelayMs: 900 },
    });
    const guestSave = vi.spyOn(guest, "save").mockImplementation(() => {});
    const adapter = new CloudStorageAdapter(fake.client, USER, queue, storage, guest);
    return { fake, storage, queue, adapter, guestSave };
  }

  it("takes settings from the device, not the account", () => {
    const { adapter } = setup();
    expect(adapter.load()).toEqual({
      sessions: [],
      activeSessionId: "",
      settings: { ...DEFAULT_SETTINGS, startDelayMs: 900 },
    });
  });

  it("queues only the difference on each save and mirrors to the cache", async () => {
    const { adapter, fake, storage, guestSave } = setup();
    const data = adapter.load()!;
    const a = session("a", [solve("1")]);
    adapter.save({ ...data, sessions: [a], activeSessionId: "a" });
    adapter.save({ ...data, sessions: [{ ...a, solves: [...a.solves, solve("2")] }], activeSessionId: "a" });
    await adapter.queue.flush();

    expect(fake.calls.filter((c) => c.startsWith("upsert timer_solves"))).toEqual([
      "upsert timer_solves 2",
    ]);
    expect(JSON.parse(storage.getItem(CloudStorageAdapter.cacheKey(USER))!).sessions[0].solves).toHaveLength(2);
    expect(guestSave).not.toHaveBeenCalled(); // settings unchanged
  });

  it("hydrate returns server data and makes it the diff baseline", async () => {
    const { adapter, fake } = setup();
    const server = [session("a", [solve("1")]), session("b")];
    const seed = new SyncQueue(fake.client, USER, memoryStorage());
    seed.enqueue(diffSessions(USER, [], server));
    await seed.flush();
    fake.calls.length = 0;

    const data = await adapter.hydrate();
    expect(data?.sessions.map((s) => s.id)).toEqual(["a", "b"]);
    expect(data?.activeSessionId).toBe("b");

    adapter.save(data!);
    await adapter.queue.flush();
    expect(fake.calls.filter((c) => !c.startsWith("select"))).toEqual([]);
  });

  it("an empty account gets one starter session even when two tabs load it at once", async () => {
    const fake = fakeSupabase();
    const tab = () => {
      const storage = memoryStorage();
      const guest = new LocalStorageAdapter();
      vi.spyOn(guest, "load").mockReturnValue(null);
      vi.spyOn(guest, "save").mockImplementation(() => {});
      return new CloudStorageAdapter(fake.client, USER, new SyncQueue(fake.client, USER, storage), storage, guest);
    };
    const [a, b] = [tab(), tab()];
    const [da, db] = await Promise.all([a.hydrate(), b.hydrate()]);
    expect(da?.sessions).toHaveLength(1);
    expect(da?.sessions[0].id).toBe(db?.sessions[0].id);
    expect(da?.activeSessionId).toBe(da?.sessions[0].id);

    // Each tab's state hook saves what hydrate returned.
    a.save(da!);
    b.save(db!);
    await Promise.all([a.queue.flush(), b.queue.flush()]);
    expect(fake.tables.timer_sessions.size).toBe(1);
  });

  it("hydrate yields to local edits made while it was fetching", async () => {
    const { adapter } = setup();
    const data = adapter.load()!;
    const pending = adapter.hydrate();
    adapter.save({ ...data, sessions: [session("local")], activeSessionId: "local" });
    expect(await pending).toBeNull();
  });
});
