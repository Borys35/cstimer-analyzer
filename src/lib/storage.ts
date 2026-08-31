import type {
  AppData,
  StorageAdapter,
  TimerSession,
} from "@/lib/types";

const STORAGE_KEY = "cstimer-analyzer";

function getStorage(): Storage | null {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

export class LocalStorageAdapter implements StorageAdapter {
  load(): AppData | null {
    try {
      const raw = getStorage()?.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as AppData;
    } catch {
      return null;
    }
  }

  save(data: AppData): void {
    getStorage()?.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  deleteSession(sessionId: string): void {
    const data = this.load();
    if (!data) return;
    data.sessions = data.sessions.filter((s) => s.id !== sessionId);
    if (data.activeSessionId === sessionId) {
      data.activeSessionId = data.sessions[0]?.id ?? "";
    }
    this.save(data);
  }

  updateSession(session: TimerSession): void {
    const data = this.load();
    if (!data) return;
    const idx = data.sessions.findIndex((s) => s.id === session.id);
    if (idx >= 0) {
      data.sessions[idx] = session;
    } else {
      data.sessions.push(session);
    }
    this.save(data);
  }

  getActiveSession(): TimerSession | null {
    const data = this.load();
    if (!data) return null;
    return data.sessions.find((s) => s.id === data.activeSessionId) ?? null;
  }

  setActiveSession(sessionId: string): void {
    const data = this.load();
    if (!data) return;
    data.activeSessionId = sessionId;
    this.save(data);
  }
}
