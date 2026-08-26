import { writeFileSync, mkdirSync } from "node:fs";

interface RawSolve {
  penaltyMs: number;
  timeMs: number;
  splits?: number[];
  dateSec: number;
}
interface FixtureSession {
  key: string;
  index: string;
  name: string;
  scrType?: string;
  phases?: number;
  solves: RawSolve[];
}

function floorCs(ms: number): number {
  return Math.floor(ms / 10) * 10;
}

function pseudo(i: number, salt: number): number {
  const x = Math.sin(i * 7919 + salt * 104729) * 10000;
  return x - Math.floor(x);
}

function scrambleFor(kind: string, i: number): string {
  const moves = ["R", "U", "F", "L", "D", "B"];
  if (kind === "sq1") {
    const segs: string[] = [];
    for (let k = 0; k < 10; k++) segs.push(`(${Math.round(pseudo(i + k, kind.length) * 10 - 5)},${Math.round(pseudo(i * 3 + k, 9) * 10 - 5)})`);
    return " " + segs.join(" / ") + "/";
  }
  const len = kind === "222" ? 11 : 20;
  const parts: string[] = [];
  for (let k = 0; k < len; k++) {
    const face = moves[Math.floor(pseudo(i * 31 + k, kind.length) * 6)];
    const suffix = pseudo(i * 17 + k, kind.length + 3);
    parts.push(face + (suffix < 0.25 ? "'" : suffix < 0.4 ? "2" : ""));
  }
  return parts.join(" ");
}

function buildSessions(): FixtureSession[] {
  const startSec = Date.UTC(2026, 5, 1) / 1000;
  const s1: RawSolve[] = [];
  for (let i = 0; i < 42; i++) {
    const dateSec = startSec + Math.floor(i / 2) * 86400 + (i % 2) * 3600 + i * 53;
    const drift = 26000 - i * 70;
    const noise = Math.round(pseudo(i, 1) * 1600 - 800);
    const isDnf = i % 13 === 5;
    const penalty = !isDnf && i % 7 === 3 ? 2000 : 0;
    const timeMs = floorCs(drift + noise);
    const solve: RawSolve = { penaltyMs: isDnf ? -1 : penalty, timeMs, dateSec };
    if (!isDnf) {
      const f = timeMs + penalty;
      const m1 = Math.round(f * 0.12);
      const m2 = m1 + Math.round(f * 0.47);
      const m3 = m2 + Math.round(f * 0.19);
      solve.splits = [m3, m2, m1];
    }
    s1.push(solve);
  }
  const s2: RawSolve[] = [];
  for (let i = 0; i < 16; i++) {
    s2.push({
      penaltyMs: 0,
      timeMs: floorCs(9400 + i * 35 + Math.round(pseudo(i, 2) * 700)),
      dateSec: startSec + 14 * 86400 + i * 97,
    });
  }
  const s3: RawSolve[] = [];
  for (let i = 0; i < 9; i++) {
    s3.push({
      penaltyMs: 0,
      timeMs: floorCs(61000 + i * 90 + Math.round(pseudo(i, 3) * 3000)),
      dateSec: startSec + 28 * 86400 + i * 121,
    });
  }
  return [
    { key: "session1", index: "1", name: "1", phases: 4, solves: s1 },
    { key: "session2", index: "2", name: "2", scrType: "222so", solves: s2 },
    { key: "session3", index: "3", name: "3", scrType: "sqrs", solves: s3 },
  ];
}

function statFor(session: FixtureSession): [number, number, number] {
  const total = session.solves.length;
  const dnfs = session.solves.filter((s) => s.penaltyMs < 0).length;
  const clean = session.solves.filter((s) => s.penaltyMs >= 0);
  const mean =
    clean.reduce((acc, s) => acc + floorCs(s.timeMs) + Math.max(s.penaltyMs, 0), 0) / clean.length;
  return [total, dnfs, mean];
}

const sessions = buildSessions();
const doc: Record<string, unknown> = {};
const sessionData: Record<string, unknown> = {};
for (const s of sessions) {
  const kind = s.scrType === "222so" ? "222" : s.scrType === "sqrs" ? "sq1" : "333";
  doc[s.key] = s.solves.map((sol, i) => [
    sol.splits ? [sol.penaltyMs, sol.timeMs, ...sol.splits] : [sol.penaltyMs, sol.timeMs],
    scrambleFor(kind, i),
    "",
    sol.dateSec,
  ]);
  const dates = s.solves.map((x) => x.dateSec);
  sessionData[s.index] = {
    name: s.name,
    opt: s.scrType ? { scrType: s.scrType } : s.phases ? { phases: s.phases } : {},
    rank: Number(s.index),
    stat: statFor(s),
    date: [Math.min(...dates), Math.max(...dates)],
  };
}
doc.properties = { sessionData: JSON.stringify(sessionData) };

mkdirSync("fixtures", { recursive: true });
writeFileSync("fixtures/synthetic-export.txt", JSON.stringify(doc));
console.log(
  "wrote fixtures/synthetic-export.txt:",
  sessions.map((s) => `${s.key}(${s.solves.length})`).join(", "),
);
