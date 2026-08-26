import { extractPhases, analyzeSplits, MIN_SPLIT_SOLVES } from "../src/lib/splits";
import { prescribe, weakestAxis, bandFor } from "../src/lib/prescriptions";
import type { Solve } from "../src/lib/types";
import type { ScoredAnalysis } from "../src/lib/stats";

let failures = 0;
function check(name: string, ok: boolean) {
  console.log(`${ok ? "OK  " : "FAIL"} ${name}`);
  if (!ok) failures++;
}

const base: Solve = {
  timeMs: 20000,
  dnf: false,
  penalty: 0,
  scramble: "",
  dateSec: Date.UTC(2026, 7, 1) / 1000,
  splits: [],
};

check("rejects solve with no splits", extractPhases(base) === null);
check("rejects penalized split solve", extractPhases({ ...base, penalty: 2000, splits: [3000, 12000, 16000], timeMs: 22000 }) === null);
check("rejects non-monotonic marks", extractPhases({ ...base, splits: [12000, 16000, 3000] }) === null);
const good = extractPhases({ ...base, splits: [16000, 12000, 3000] });
check("parses reversed cumulative marks", !!good && good.crossMs === 3000 && good.f2lMs === 9000 && good.ollMs === 4000 && good.pllMs === 4000);

const many: Solve[] = [];
for (let i = 0; i < MIN_SPLIT_SOLVES + 5; i++) {
  many.push({
    ...base,
    timeMs: 20000,
    splits: [16000, 12000, 3000],
    dateSec: base.dateSec + i * 60,
  });
}
const stats = analyzeSplits(many, 20000);
check("shares computed above threshold", stats.shares !== null && stats.usableCount === MIN_SPLIT_SOLVES + 5);
check("cross flagged (15% vs 12% ref)", stats.worst?.phase === "crossMs");
check("excess ms uses current level", stats.worst?.excessMs === Math.round((0.15 - 0.12) * 20000));

const fakeAnalysis = {
  subscores: { improvement: 30, consistency: 80, frequency: 90 },
  headline: 60,
  tier: "bad" as const,
  currentLevelMs: 24000,
  trend: { slopeMsPerDay: -24000 * 0.002 / 7 / 1, interceptMs: 24000, endLevelMs: 24000, weeksCovered: 6 },
  consistencyCv: 0.16,
  freq: { activeDays: 6, solvesPerActiveDay: 30 },
} as unknown as ScoredAnalysis;

check("weakest axis selection", weakestAxis(fakeAnalysis) === "Improvement");
check("band for 24s", bandFor("3x3", 24000) === "20-30s");
check("generic band for other events", bandFor("2x2", 24000) === "generic");

const evidence = {
  analysis: fakeAnalysis,
  last50Times: Array.from({ length: 50 }, (_, i) => 18000 + (i % 10) * 500),
  splits: stats,
  event: "3x3",
};
const p1 = prescribe("Improvement", evidence);
const p2 = prescribe("Improvement", evidence);
check("prescription deterministic", JSON.stringify(p1) === JSON.stringify(p2));
check("weakest prescription has 2-3 drills", p1.drills.length >= 2 && p1.drills.length <= 3);
check("estimate carries trajectory numbers", p1.estimate.includes("~") || p1.estimate.length > 0);

console.log(failures === 0 ? "\nALL PRESCRIPTION TESTS PASS" : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
