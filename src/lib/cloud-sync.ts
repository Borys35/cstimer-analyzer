import type { SupabaseClient } from "@supabase/supabase-js";
import type { PuzzleType, TimerSession, TimerSolve } from "@/lib/types";

// --- Row shapes (see supabase/migrations/*_timer_cloud_sync.sql) ---

export interface SessionRow {
  user_id: string;
  id: string;
  name: string;
  puzzle_type: string;
  created_at: number;
  ended_at: number | null;
}

export interface SolveRow {
  user_id: string;
  id: string;
  session_id: string;
  time_ms: number;
  dnf: boolean;
  penalty: number;
  scramble: string;
  date_sec: number;
}

export const SESSIONS_TABLE = "timer_sessions";
export const SOLVES_TABLE = "timer_solves";

export function sessionToRow(userId: string, s: TimerSession): SessionRow {
  return {
    user_id: userId,
    id: s.id,
    name: s.name,
    puzzle_type: s.puzzleType,
    created_at: Math.round(s.createdAt),
    ended_at: s.endedAt == null ? null : Math.round(s.endedAt),
  };
}

export function solveToRow(userId: string, sessionId: string, s: TimerSolve): SolveRow {
  return {
    user_id: userId,
    id: s.id,
    session_id: sessionId,
    time_ms: Math.round(s.timeMs),
    dnf: s.dnf,
    penalty: s.penalty ?? 0,
    scramble: s.scramble ?? "",
    date_sec: Math.round(s.dateSec),
  };
}

const byIdNumeric = (a: { id: string }, b: { id: string }) =>
  a.id.localeCompare(b.id, undefined, { numeric: true });

/** Rebuild the client model: sessions oldest-first, solves in time order. */
export function rowsToSessions(sessionRows: SessionRow[], solveRows: SolveRow[]): TimerSession[] {
  const solvesBySession = new Map<string, TimerSolve[]>();
  for (const r of [...solveRows].sort((a, b) => a.date_sec - b.date_sec || byIdNumeric(a, b))) {
    const list = solvesBySession.get(r.session_id) ?? [];
    list.push({
      id: r.id,
      timeMs: r.time_ms,
      dnf: r.dnf,
      penalty: r.penalty,
      scramble: r.scramble,
      dateSec: r.date_sec,
    });
    solvesBySession.set(r.session_id, list);
  }
  return [...sessionRows]
    .sort((a, b) => a.created_at - b.created_at || byIdNumeric(a, b))
    .map((r) => ({
      id: r.id,
      name: r.name,
      puzzleType: r.puzzle_type as PuzzleType,
      createdAt: r.created_at,
      endedAt: r.ended_at,
      solves: solvesBySession.get(r.id) ?? [],
    }));
}

// --- Diff ---

export type SyncOp =
  | { kind: "upsertSessions"; rows: SessionRow[] }
  | { kind: "upsertSolves"; rows: SolveRow[] }
  | { kind: "deleteSolves"; ids: string[] }
  | { kind: "deleteSessions"; ids: string[] };

function sameMeta(a: TimerSession, b: TimerSession): boolean {
  return (
    a.name === b.name &&
    a.puzzleType === b.puzzleType &&
    a.createdAt === b.createdAt &&
    a.endedAt === b.endedAt
  );
}

function sameSolve(a: TimerSolve, b: TimerSolve): boolean {
  return (
    a === b ||
    (a.timeMs === b.timeMs &&
      a.dnf === b.dnf &&
      a.penalty === b.penalty &&
      a.scramble === b.scramble &&
      a.dateSec === b.dateSec)
  );
}

/**
 * The writes that turn `prev` into `next` on the server, in FK-safe order:
 * parent sessions are upserted before their solves, and session deletes come
 * last (they cascade to solves).
 */
export function diffSessions(userId: string, prev: TimerSession[], next: TimerSession[]): SyncOp[] {
  const prevById = new Map(prev.map((s) => [s.id, s]));
  const nextIds = new Set(next.map((s) => s.id));

  const upsertSessions: SessionRow[] = [];
  const upsertSolves: SolveRow[] = [];
  const deleteSolves: string[] = [];

  for (const s of next) {
    const before = prevById.get(s.id);
    if (before === s) continue;
    if (!before || !sameMeta(before, s)) upsertSessions.push(sessionToRow(userId, s));
    if (before && before.solves === s.solves) continue;

    const beforeSolves = new Map((before?.solves ?? []).map((x) => [x.id, x]));
    const seen = new Set<string>();
    for (const sol of s.solves) {
      seen.add(sol.id);
      const old = beforeSolves.get(sol.id);
      if (!old || !sameSolve(old, sol)) upsertSolves.push(solveToRow(userId, s.id, sol));
    }
    for (const id of beforeSolves.keys()) if (!seen.has(id)) deleteSolves.push(id);
  }

  const deleteSessions = prev.filter((s) => !nextIds.has(s.id)).map((s) => s.id);

  const ops: SyncOp[] = [];
  if (upsertSessions.length) ops.push({ kind: "upsertSessions", rows: upsertSessions });
  if (upsertSolves.length) ops.push({ kind: "upsertSolves", rows: upsertSolves });
  if (deleteSolves.length) ops.push({ kind: "deleteSolves", ids: deleteSolves });
  if (deleteSessions.length) ops.push({ kind: "deleteSessions", ids: deleteSessions });
  return ops;
}

/** Fold consecutive same-kind ops so a burst of solves becomes one request. */
export function coalesceOps(ops: SyncOp[]): SyncOp[] {
  const out: SyncOp[] = [];
  for (const op of ops) {
    const last = out[out.length - 1];
    if (last && last.kind === op.kind) {
      if ("rows" in last && "rows" in op) {
        const merged = new Map<string, SessionRow | SolveRow>();
        for (const r of [...last.rows, ...op.rows]) merged.set(r.id, r);
        out[out.length - 1] = { ...last, rows: [...merged.values()] } as SyncOp;
      } else if ("ids" in last && "ids" in op) {
        out[out.length - 1] = { ...last, ids: [...new Set([...last.ids, ...op.ids])] };
      }
      continue;
    }
    out.push(op);
  }
  return out;
}

// --- Server I/O ---

const UPSERT_CHUNK = 500;
const DELETE_CHUNK = 100; // ids travel in the query string
const PAGE_SIZE = 1000;

function chunks<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export async function applyOp(client: SupabaseClient, userId: string, op: SyncOp): Promise<void> {
  switch (op.kind) {
    case "upsertSessions":
    case "upsertSolves": {
      const table = op.kind === "upsertSessions" ? SESSIONS_TABLE : SOLVES_TABLE;
      for (const rows of chunks<SessionRow | SolveRow>(op.rows, UPSERT_CHUNK)) {
        const { error } = await client.from(table).upsert(rows, { onConflict: "user_id,id" });
        if (error) throw error;
      }
      return;
    }
    case "deleteSolves":
    case "deleteSessions": {
      const table = op.kind === "deleteSessions" ? SESSIONS_TABLE : SOLVES_TABLE;
      for (const ids of chunks(op.ids, DELETE_CHUNK)) {
        const { error } = await client.from(table).delete().eq("user_id", userId).in("id", ids);
        if (error) throw error;
      }
      return;
    }
  }
}

async function fetchTable<T extends { id: string }>(
  client: SupabaseClient,
  userId: string,
  table: string,
  columns: string,
): Promise<T[]> {
  const out: T[] = [];
  let after: string | null = null;
  // Keyset pagination on the (user_id, id) primary key. Stops on an empty
  // page rather than a short one, so a lower server max_rows can't truncate.
  for (;;) {
    let query = client.from(table).select(columns).eq("user_id", userId).order("id").limit(PAGE_SIZE);
    if (after !== null) query = query.gt("id", after);
    const { data, error } = await query;
    if (error) throw error;
    const rows = (data ?? []) as unknown as T[];
    if (rows.length === 0) return out;
    out.push(...rows);
    after = rows[rows.length - 1].id;
  }
}

export async function fetchAllSessions(client: SupabaseClient, userId: string): Promise<TimerSession[]> {
  const [sessions, solves] = await Promise.all([
    fetchTable<SessionRow>(client, userId, SESSIONS_TABLE, "user_id,id,name,puzzle_type,created_at,ended_at"),
    fetchTable<SolveRow>(client, userId, SOLVES_TABLE, "user_id,id,session_id,time_ms,dnf,penalty,scramble,date_sec"),
  ]);
  return rowsToSessions(sessions, solves);
}

// --- Write queue ---

/** SQLSTATE / PostgREST codes worth retrying (auth refresh, contention, timeouts). */
const TRANSIENT_CODES = new Set(["PGRST301", "PGRST303", "40001", "40P01", "57014", "53300"]);

/**
 * True when retrying can't help: the server understood the request and
 * rejected it (constraint, RLS, bad column). Network failures carry no code.
 */
export function isPermanentError(err: unknown): boolean {
  const code = (err as { code?: unknown } | null)?.code;
  if (typeof code !== "string" || code === "") return false;
  if (TRANSIENT_CODES.has(code) || code.startsWith("08")) return false;
  return /^(PGRST\d+|[0-9A-Z]{5})$/.test(code);
}

export type SyncStatus = "synced" | "syncing" | "offline";

const RETRY_MIN_MS = 2_000;
const RETRY_MAX_MS = 60_000;

/**
 * Ordered, persisted queue of pending writes for one user. Ops survive reloads
 * (stored in localStorage) and are retried with backoff until they land, so a
 * solve recorded offline still reaches the cloud later.
 */
export class SyncQueue {
  private ops: SyncOp[];
  private flushing: Promise<boolean> | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private retryDelay = RETRY_MIN_MS;
  private status: SyncStatus = "synced";
  private listeners = new Set<(s: SyncStatus) => void>();

  constructor(
    private client: SupabaseClient,
    readonly userId: string,
    private storage: Storage | null,
  ) {
    this.ops = this.read();
    if (this.ops.length) this.setStatus("offline");
  }

  static storageKey(userId: string): string {
    return `cstimer-analyzer:sync-queue:${userId}`;
  }

  get pending(): number {
    return this.ops.length;
  }

  getStatus(): SyncStatus {
    return this.status;
  }

  subscribe(fn: (s: SyncStatus) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  enqueue(ops: SyncOp[]): void {
    if (!ops.length) return;
    this.ops = coalesceOps([...this.ops, ...ops]);
    this.write();
    void this.flush();
  }

  /** Push everything queued. Resolves true when the queue is empty. */
  flush(): Promise<boolean> {
    if (this.flushing) return this.flushing;
    this.flushing = this.run().finally(() => {
      this.flushing = null;
    });
    return this.flushing;
  }

  dispose(): void {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.listeners.clear();
  }

  private async run(): Promise<boolean> {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    if (!this.ops.length) {
      this.setStatus("synced");
      return true;
    }
    this.setStatus("syncing");
    try {
      while (this.ops.length) {
        const op = this.ops[0];
        try {
          await applyOp(this.client, this.userId, op);
        } catch (err) {
          if (!isPermanentError(err)) throw err;
          // A rejected write would block everything behind it forever. Drop it.
          console.error("Cloud sync rejected a change; skipping it.", err, op);
        }
        // Only drop the op if nothing coalesced into it while it was in flight.
        if (this.ops[0] === op) this.ops.shift();
        this.write();
      }
      this.retryDelay = RETRY_MIN_MS;
      this.setStatus("synced");
      return true;
    } catch {
      this.setStatus("offline");
      this.retryTimer = setTimeout(() => void this.flush(), this.retryDelay);
      this.retryDelay = Math.min(this.retryDelay * 2, RETRY_MAX_MS);
      return false;
    }
  }

  private setStatus(s: SyncStatus) {
    if (s === this.status) return;
    this.status = s;
    for (const fn of this.listeners) fn(s);
  }

  private read(): SyncOp[] {
    try {
      const raw = this.storage?.getItem(SyncQueue.storageKey(this.userId));
      return raw ? (JSON.parse(raw) as SyncOp[]) : [];
    } catch {
      return [];
    }
  }

  private write() {
    try {
      const key = SyncQueue.storageKey(this.userId);
      if (this.ops.length) this.storage?.setItem(key, JSON.stringify(this.ops));
      else this.storage?.removeItem(key);
    } catch {
      // Storage full or blocked: the in-memory queue still syncs this visit.
    }
  }
}
