export type PuzzleType =
  | "2x2"
  | "3x3"
  | "4x4"
  | "5x5"
  | "6x6"
  | "7x7"
  | "Pyraminx"
  | "Megaminx"
  | "Skewb"
  | "Square-1"
  | "Clock"
  | "Unknown";

export interface Solve {
  /** Final time in ms, penalty already applied (+2s). */
  timeMs: number;
  /** true when the solve was a DNF (excluded from all stats). */
  dnf: boolean;
  /** Penalty code from cstimer: 0 none, n>0 = +2n seconds, -1 DNF. */
  penalty: number;
  scramble: string;
  /** Unix timestamp in seconds. */
  dateSec: number;
  /** Raw cumulative phase splits if present (v2 material). */
  splits: number[];
}

export interface SessionMeta {
  key: string;
  name: string;
  scrType?: string;
  phases?: number;
  solveCount: number;
  firstDateSec: number;
  lastDateSec: number;
}

export interface ParsedSession {
  meta: SessionMeta;
  solves: Solve[];
  /** Puzzle type as detected; user can override in UI. */
  puzzleType: PuzzleType;
  typeSource: "scrType" | "heuristic" | "unknown";
}

export interface ParseResult {
  sessions: ParsedSession[];
}

// --- Timer types ---

export interface TimerSolve {
  id: string;
  timeMs: number;
  dnf: boolean;
  penalty: number;
  scramble: string;
  dateSec: number;
}

export interface TimerSession {
  id: string;
  name: string;
  puzzleType: PuzzleType;
  createdAt: number;
  endedAt: number | null;
  solves: TimerSolve[];
}

export interface TimerSettings {
  startDelayMs: number;
  inspectionEnabled: boolean;
  inspectionDurationSec: number;
  soundEnabled: boolean;
  hideTimer: boolean;
  /** Hide the session sidebar on the timer screen. */
  zenMode: boolean;
  /** "timer" = built-in stackmat-style timer; "typing" = enter times from an external timer. */
  inputMode: InputMode;
  /** Hold a screen wake lock while the timer page is open. */
  keepAwake: boolean;
}

export type InputMode = "timer" | "typing";

export interface AppData {
  sessions: TimerSession[];
  activeSessionId: string;
  settings: TimerSettings;
}

export const DEFAULT_SETTINGS: TimerSettings = {
  startDelayMs: 500,
  inspectionEnabled: false,
  inspectionDurationSec: 15,
  soundEnabled: false,
  hideTimer: false,
  zenMode: false,
  inputMode: "timer",
  keepAwake: true,
};

export interface StorageAdapter {
  load(): AppData | null;
  save(data: AppData): void;
  deleteSession(sessionId: string): void;
  updateSession(session: TimerSession): void;
  getActiveSession(): TimerSession | null;
  setActiveSession(sessionId: string): void;
  /**
   * Optional async source of truth (cloud). Resolves fresh data to replace the
   * state loaded synchronously by load(), or null to keep what's there
   * (offline, or local edits happened while fetching).
   */
  hydrate?(): Promise<AppData | null>;
}
