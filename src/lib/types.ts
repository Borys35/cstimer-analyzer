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
