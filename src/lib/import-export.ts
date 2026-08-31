import { parseCstimerExport } from "@/lib/parser";
import type {
  TimerSession,
  TimerSolve,
  ParsedSession,
  PuzzleType,
} from "@/lib/types";

let counter = 0;

function uid(): string {
  return `id-${Date.now()}-${++counter}`;
}

export function convertParsedToTimerSession(
  parsed: ParsedSession,
): TimerSession {
  const solves: TimerSolve[] = parsed.solves.map((s) => ({
    id: uid(),
    timeMs: s.timeMs,
    dnf: s.dnf,
    penalty: s.penalty,
    scramble: s.scramble,
    dateSec: s.dateSec,
  }));

  const firstDate = solves
    .map((s) => s.dateSec)
    .filter((n) => n > 0)
    .sort((a, b) => a - b)[0];

  return {
    id: uid(),
    name: parsed.meta.name || parsed.meta.key,
    puzzleType: parsed.puzzleType,
    createdAt: firstDate || Math.floor(Date.now() / 1000),
    endedAt: null,
    solves,
  };
}

function sessionKey(name: string, firstSolveSec: number): string {
  return `${name}::${firstSolveSec}`;
}

export function importCstimer(
  text: string,
  existing: TimerSession[],
): { imported: TimerSession[]; duplicates: number } {
  const result = parseCstimerExport(text);

  const existingKeys = new Set(
    existing.map((s) => {
      const first = s.solves
        .map((sv) => sv.dateSec)
        .filter((n) => n > 0)
        .sort((a, b) => a - b)[0];
      return sessionKey(s.name, first || 0);
    }),
  );

  const imported: TimerSession[] = [];
  let duplicates = 0;

  for (const parsed of result.sessions) {
    const timerSession = convertParsedToTimerSession(parsed);
    const key = sessionKey(
      timerSession.name,
      timerSession.solves
        .map((s) => s.dateSec)
        .filter((n) => n > 0)
        .sort((a, b) => a - b)[0] || 0,
    );

    if (existingKeys.has(key)) {
      duplicates++;
    } else {
      imported.push(timerSession);
      existingKeys.add(key);
    }
  }

  return { imported, duplicates };
}

function puzzleToScrType(puzzle: PuzzleType): string {
  const map: Record<string, string> = {
    "3x3": "333",
    "2x2": "222so",
    Pyraminx: "pyrm",
    "Square-1": "sqrs",
    Megaminx: "mgmp",
    Skewb: "skewb",
    Clock: "clk",
    "4x4": "444",
    "5x5": "555",
    "6x6": "666",
    "7x7": "777",
  };
  return map[puzzle] || "333";
}

export function exportCstimer(sessions: TimerSession[]): string {
  const output: Record<string, unknown> = {
    properties: { sessionData: {} },
  };

  const sessionData: Record<string, unknown> = {};

  sessions.forEach((session, i) => {
    const key = `session${i + 1}`;
    const dates = session.solves
      .map((s) => s.dateSec)
      .filter((n) => n > 0);

    const firstDate = dates.length ? Math.min(...dates) : 0;
    const lastDate = dates.length ? Math.max(...dates) : 0;

    sessionData[String(i + 1)] = {
      name: session.name,
      opt: { scrType: puzzleToScrType(session.puzzleType) },
      rank: i + 1,
      stat: [
        session.solves.length,
        session.solves.filter((s) => s.dnf).length,
        session.solves.filter((s) => !s.dnf).reduce((a, s) => a + s.timeMs, 0) /
          Math.max(1, session.solves.filter((s) => !s.dnf).length),
      ],
      date: [firstDate, lastDate],
    };

    output[key] = session.solves.map((solve) => {
      const timing: number[] = [solve.penalty, solve.timeMs];
      return [timing, solve.scramble, "", solve.dateSec];
    });
  });

  (output.properties as { sessionData: string }).sessionData =
    JSON.stringify(sessionData);

  return JSON.stringify(output);
}
