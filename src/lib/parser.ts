import type { ParseResult, ParsedSession, PuzzleType, SessionMeta, Solve } from "./types";

const SCR_TYPE_MAP: Record<string, PuzzleType> = {
  "222o": "2x2",
  "222so": "2x2",
  "222s": "2x2",
  "333": "3x3",
  "333oh": "3x3",
  "333bf": "3x3",
  "333fm": "3x3",
  "333ni": "3x3",
  "444": "4x4",
  "444bf": "4x4",
  "555": "5x5",
  "555bf": "5x5",
  "666": "6x6",
  "777": "7x7",
  "clk": "Clock",
  "mgmp": "Megaminx",
  "pyrm": "Pyraminx",
  "skewb": "Skewb",
  "sqrs": "Square-1",
};

function typeFromScrType(scrType: string): PuzzleType | null {
  const t = SCR_TYPE_MAP[scrType];
  if (t) return t;
  if (/^222/.test(scrType)) return "2x2";
  if (/^333/.test(scrType)) return "3x3";
  if (/^444/.test(scrType)) return "4x4";
  if (/^555/.test(scrType)) return "5x5";
  if (/^666/.test(scrType)) return "6x6";
  if (/^777/.test(scrType)) return "7x7";
  return null;
}

function typeFromScrambles(scrambles: string[]): PuzzleType | null {
  if (scrambles.length === 0) return null;
  const sample = scrambles.slice(0, Math.min(10, scrambles.length));
  if (sample.every((s) => /\(\s*-?\d+\s*,\s*-?\d+\s*\)/.test(s))) return "Square-1";
  if (sample.some((s) => /(^|\s)-?[URFDLB]w/.test(s))) return "4x4";
  const tokenCounts = sample.map((s) => s.trim().split(/\s+/).length);
  if (Math.max(...tokenCounts) <= 14) return "2x2";
  return "3x3";
}

function strongScrambleSignal(scrambles: string[]): PuzzleType | null {
  if (scrambles.length === 0) return null;
  const sample = scrambles.slice(0, Math.min(10, scrambles.length));
  if (sample.every((s) => /\(\s*-?\d+\s*,\s*-?\d+\s*\)/.test(s))) return "Square-1";
  if (sample.some((s) => /(^|\s)-?[URFDLB]w/.test(s))) return "4x4";
  return null;
}

function maxTokenCount(scrambles: string[]): number {
  let max = 0;
  for (const s of scrambles.slice(0, 10)) {
    const n = s.trim().split(/\s+/).length;
    if (n > max) max = n;
  }
  return max;
}

export function classifySession(
  solves: Solve[],
  scrType?: string,
): { puzzleType: PuzzleType; typeSource: ParsedSession["typeSource"] } {
  const scrambles = solves.map((s) => s.scramble);

  const strong = strongScrambleSignal(scrambles);
  if (strong) return { puzzleType: strong, typeSource: "heuristic" };

  if (scrType) {
    const mapped = typeFromScrType(scrType);
    if (mapped) {
      const contradicted =
        mapped === "2x2" && scrambles.length > 0 && maxTokenCount(scrambles) > 16;
      if (!contradicted) return { puzzleType: mapped, typeSource: "scrType" };
    }
  }

  const weak = typeFromScrambles(scrambles);
  if (weak) return { puzzleType: weak, typeSource: "heuristic" };
  return { puzzleType: "Unknown", typeSource: "unknown" };
}

interface CstimerSolveTuple {
  0: number[] | unknown;
  1: string;
  2?: string;
  3?: number;
}

function parseSolve(tuple: CstimerSolveTuple): Solve | null {
  if (!Array.isArray(tuple) || !Array.isArray(tuple[0])) return null;
  const timing = tuple[0] as number[];
  const penaltyMs = typeof timing[0] === "number" ? Math.trunc(timing[0]) : 0;
  const rawTime = typeof timing[1] === "number" ? timing[1] : NaN;
  if (!Number.isFinite(rawTime)) return null;
  const dnf = penaltyMs < 0;
  const csTime = Math.floor(rawTime / 10) * 10;
  const timeMs = dnf ? csTime : csTime + Math.max(penaltyMs, 0);
  return {
    timeMs,
    dnf,
    penalty: penaltyMs,
    scramble: typeof tuple[1] === "string" ? tuple[1] : "",
    dateSec: typeof tuple[3] === "number" ? tuple[3] : 0,
    splits: timing.slice(2).filter((n): n is number => typeof n === "number"),
  };
}

interface SessionOpt {
  scrType?: string;
  phases?: number;
}
interface SessionDataEntry {
  name?: string;
  opt?: SessionOpt;
  rank?: number;
  stat?: [number, number, number];
  date?: [number, number];
}

function parseProperties(raw: unknown): Map<string, SessionDataEntry> {
  const out = new Map<string, SessionDataEntry>();
  try {
    const props = raw as { sessionData?: string | Record<string, SessionDataEntry> };
    let data = props?.sessionData;
    if (typeof data === "string") data = JSON.parse(data);
    if (data && typeof data === "object") {
      for (const [k, v] of Object.entries(data)) {
        if (v && typeof v === "object") out.set(k.replace(/^session/, ""), v);
      }
    }
  } catch {
  }
  return out;
}

export function parseCstimerExport(text: string): ParseResult {
  const json = JSON.parse(text) as Record<string, unknown>;
  const metaByKey = parseProperties(json.properties);

  const sessions: ParsedSession[] = [];
  for (const [key, value] of Object.entries(json)) {
    if (key === "properties" || !Array.isArray(value)) continue;
    const solvesRaw = value as unknown[];
    const solves: Solve[] = [];
    for (const t of solvesRaw) {
      const s = parseSolve(t as CstimerSolveTuple);
      if (s) solves.push(s);
    }
    solves.sort((a, b) => a.dateSec - b.dateSec);

    const idxMatch = key.match(/^session(\d+)$/);
    const entryKey = idxMatch ? idxMatch[1] : key;
    const entry = metaByKey.get(entryKey);
    const dates = solves.map((s) => s.dateSec).filter((n) => n > 0);

    const meta: SessionMeta = {
      key,
      name: entry?.name != null ? String(entry.name) : key,
      scrType: entry?.opt?.scrType,
      phases: entry?.opt?.phases,
      solveCount: solves.length,
      firstDateSec: dates.length ? Math.min(...dates) : 0,
      lastDateSec: dates.length ? Math.max(...dates) : 0,
    };

    const classified = classifySession(solves, meta.scrType);

    sessions.push({
      meta,
      solves,
      puzzleType: classified.puzzleType,
      typeSource: classified.typeSource,
    });
  }

  sessions.sort((a, b) => a.meta.firstDateSec - b.meta.firstDateSec);
  return { sessions };
}
