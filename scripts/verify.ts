import { readFileSync } from "node:fs";
import { parseCstimerExport } from "../src/lib/parser";
import { dailyBuckets, fitDailyTrend, analyze } from "../src/lib/stats";

const file = process.argv[2] ?? "cstimer_20260825_214133.txt";
const text = readFileSync(file, "utf8");
const parsed = parseCstimerExport(text);

const raw = JSON.parse(text) as {
  properties?: { sessionData?: string };
};
let sessionData: Record<string, { stat?: [number, number, number]; opt?: Record<string, unknown> }> = {};
if (raw.properties?.sessionData) {
  sessionData =
    typeof raw.properties.sessionData === "string"
      ? JSON.parse(raw.properties.sessionData)
      : raw.properties.sessionData;
}

let failures = 0;
console.log("session | type(src) | solves | dnf(parsed/exp) | mean(calc/exp) ms | ok");
for (const s of parsed.sessions) {
  const idx = s.meta.key.replace(/^session/, "");
  const exp = sessionData[idx]?.stat;
  const clean = s.solves.filter((x) => !x.dnf);
  const dnfs = s.solves.length - clean.length;
  const calcMean = clean.length ? clean.reduce((a, b) => a + b.timeMs, 0) / clean.length : NaN;
  let ok = true;
  if (exp) {
    if (s.solves.length !== exp[0]) ok = false;
    if (dnfs !== exp[1]) ok = false;
    if (Math.abs(calcMean - exp[2]) > 0.01) ok = false;
  }
  if (!ok) failures++;
  console.log(
    `${s.meta.key} | ${s.puzzleType}(${s.typeSource}) | ${s.solves.length} | ${dnfs}/${exp ? exp[1] : "?"} | ${calcMean.toFixed(1)}/${exp ? exp[2].toFixed(1) : "?"} | ${ok ? "OK" : "FAIL"}`,
  );
}

const merged = parsed.sessions
  .filter((s) => s.puzzleType === "3x3")
  .flatMap((s) => s.solves)
  .sort((a, b) => a.dateSec - b.dateSec);
const clean = merged.filter((s) => !s.dnf);
console.log(`\nMerged 3x3: ${merged.length} solves (${clean.length} clean)`);
if (clean.length === 0) {
  console.error("NO 3x3 SOLVES DETECTED — heuristic failure");
  process.exit(1);
}
const days = dailyBuckets(clean);
console.log("Day buckets:", days.length, "first", new Date(days[0].dayStartMs).toISOString(), "last", new Date(days[days.length - 1].dayStartMs).toISOString());
const trend = fitDailyTrend(days);
if (trend) {
  console.log(
    `Trend: ${(trend.slopeMsPerDay * 7).toFixed(1)} ms/week over ${trend.weeksCovered.toFixed(1)} weeks; end level ${trend.endLevelMs.toFixed(0)} ms`,
  );
} else {
  console.log("Trend: insufficient data");
}
const result = analyze({ rangedClean: clean, allClean: clean, rangedAll: merged });
console.log("Analysis:", JSON.stringify(result.subscores), "headline:", result.headline, "tier:", result.tier);

if (failures > 0) {
  console.error(`\n${failures} SESSION(S) FAILED CROSS-CHECK`);
  process.exit(1);
}
console.log("\nALL SESSIONS MATCH CSTIMER'S OWN STATS");
