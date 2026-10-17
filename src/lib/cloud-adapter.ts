import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppData, StorageAdapter, TimerSession, TimerSettings } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/types";
import { LocalStorageAdapter } from "@/lib/storage";
import { diffSessions, fetchAllSessions, SyncQueue } from "@/lib/cloud-sync";
import { generateSessionName } from "@/lib/session-state";

interface CachedData {
  sessions: TimerSession[];
  activeSessionId: string;
}

/**
 * Storage for a signed-in user. Sessions live in Supabase; a per-user
 * localStorage cache makes startup instant and keeps working offline.
 * Every save is diffed against the last known state and queued as writes.
 * Settings are device preferences, so they stay in the guest store and
 * survive signing in and out.
 */
export class CloudStorageAdapter implements StorageAdapter {
  private cache: CachedData | null | undefined;
  /** Server-side state as far as this client knows; diffs are taken against it. */
  private baseline: TimerSession[] | null = null;
  /** Bumped on every save so hydrate() can tell local edits raced its fetch. */
  private saveCount = 0;
  private lastSettingsJson = "";

  constructor(
    private client: SupabaseClient,
    readonly userId: string,
    readonly queue: SyncQueue,
    private storage: Storage | null = typeof window !== "undefined" ? window.localStorage : null,
    private settingsStore: LocalStorageAdapter = new LocalStorageAdapter(),
  ) {}

  static cacheKey(userId: string): string {
    return `cstimer-analyzer:user:${userId}`;
  }

  load(): AppData | null {
    if (this.cache === undefined) {
      this.cache = this.readCache();
      this.baseline = this.cache?.sessions ?? [];
    }
    const settings = this.loadSettings();
    if (!this.cache) return { sessions: [], activeSessionId: "", settings };
    return { ...this.cache, settings };
  }

  save(data: AppData): void {
    this.saveCount++;
    this.saveSettings(data.settings);
    this.cache = { sessions: data.sessions, activeSessionId: data.activeSessionId };
    this.writeCache();
    const ops = diffSessions(this.userId, this.baseline ?? [], data.sessions);
    this.baseline = data.sessions;
    this.queue.enqueue(ops);
  }

  async hydrate(): Promise<AppData | null> {
    this.load();
    const startedAt = this.saveCount;
    // Land pending writes first so the fetch reflects them.
    if (!(await this.queue.flush())) return null;
    let sessions: TimerSession[];
    try {
      sessions = await fetchAllSessions(this.client, this.userId);
    } catch {
      return null;
    }
    if (this.saveCount !== startedAt) return null;
    this.baseline = sessions;

    // Empty account: start one session here rather than letting the state hook
    // create a randomly-id'd one. Its id is fixed per user, so two tabs or
    // devices loading an empty account at once upsert the same row.
    if (sessions.length === 0) sessions = [this.starterSession()];

    const cachedActive = this.cache?.activeSessionId ?? "";
    const activeSessionId = sessions.some((s) => s.id === cachedActive)
      ? cachedActive
      : (sessions[sessions.length - 1]?.id ?? "");
    this.cache = { sessions, activeSessionId };
    this.writeCache();
    return { sessions, activeSessionId, settings: this.loadSettings() };
  }

  private starterSession(): TimerSession {
    return {
      id: `starter-${this.userId}`,
      name: generateSessionName([]),
      puzzleType: "3x3",
      createdAt: Math.floor(Date.now() / 1000),
      endedAt: null,
      solves: [],
    };
  }

    deleteSession(sessionId: string): void {
    const data = this.load();
    if (!data) return;
    const sessions = data.sessions.filter((s) => s.id !== sessionId);
    const activeSessionId =
      data.activeSessionId === sessionId ? (sessions[0]?.id ?? "") : data.activeSessionId;
    this.save({ ...data, sessions, activeSessionId });
  }

  updateSession(session: TimerSession): void {
    const data = this.load();
    if (!data) return;
    const exists = data.sessions.some((s) => s.id === session.id);
    const sessions = exists
      ? data.sessions.map((s) => (s.id === session.id ? session : s))
      : [...data.sessions, session];
    this.save({ ...data, sessions });
  }

  getActiveSession(): TimerSession | null {
    const data = this.load();
    return data?.sessions.find((s) => s.id === data.activeSessionId) ?? null;
  }

  setActiveSession(sessionId: string): void {
    const data = this.load();
    if (data) this.save({ ...data, activeSessionId: sessionId });
  }

  /** Forget this user's cached copy (sign-out on a shared device). */
  static clearCache(userId: string, storage: Storage | null = window.localStorage): void {
    try {
      storage?.removeItem(CloudStorageAdapter.cacheKey(userId));
    } catch {}
  }

  private loadSettings(): TimerSettings {
    const settings = { ...DEFAULT_SETTINGS, ...this.settingsStore.load()?.settings };
    this.lastSettingsJson = JSON.stringify(settings);
    return settings;
  }

  private saveSettings(settings: TimerSettings) {
    const json = JSON.stringify(settings);
    if (json === this.lastSettingsJson) return;
    this.lastSettingsJson = json;
    const guest = this.settingsStore.load();
    this.settingsStore.save({
      sessions: guest?.sessions ?? [],
      activeSessionId: guest?.activeSessionId ?? "",
      settings,
    });
  }

  private readCache(): CachedData | null {
    try {
      const raw = this.storage?.getItem(CloudStorageAdapter.cacheKey(this.userId));
      return raw ? (JSON.parse(raw) as CachedData) : null;
    } catch {
      return null;
    }
  }

  private writeCache() {
    try {
      this.storage?.setItem(CloudStorageAdapter.cacheKey(this.userId), JSON.stringify(this.cache));
    } catch {
      // Quota exceeded: the cloud copy is still authoritative.
    }
  }
}
