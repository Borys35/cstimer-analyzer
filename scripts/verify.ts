import { readFileSync } from "node:fs";
import { parseCstimerExport } from "../src/lib/parser";
import type { ParsedSession } from "../src/lib/types";
import { dailyBuckets, fitDailyTrend, analyze } from "../src/lib/stats";

const EXPECTED_FROM_SCR_TYPE: Record<string, string> = {
  "222o": "2x2",
  "222so": "2x2",
  "222s": "2x2",
  "333": "3x3",
  "333oh": "3x3",
  "333bf": "3x3",
  "333fm": "3x3",
  "333ni": "3x3",
  "444": "4x4",
  "555": "5x5",
  "666": "6x6",
  "777": "7x7",
  clk: "Clock",
  mgmp: "Megaminx",
  pyrm: "Pyraminx",
  skewb: "Skewb",
  sqrs: "Square-1",
};

export interface CrossCheckResult {
  failures: number;
  lines: string[];
}

export function crossCheck(text: string): CrossCheckResult {
  const parsed = parseCstimerExport(text);
  const raw = JSON.parse(text) as { properties?: { sessionData?: string } };
  let sessionData: Record<
    string,
    { stat?: [number, number, number]; opt?: Record<string, unknown> }
  > = {};
  if (raw.properties?.sessionData) {
    sessionData =
      typeof raw.properties.sessionData === "string"
        ? JSON.parse(raw.properties.sessionData)
        : raw.properties.sessionData;
  }

  const lines: string[] = [];
  let failures = 0;
  lines.push("session | type(src) | solves | dnf(parsed/exp) | mean(calc/exp) ms | type-ok | ok");
  for (const s of parsed.sessions) {
    const idx = s.meta.key.replace(/^session/, "");
    const exp = sessionData[idx]?.stat;
    const clean = s.solves.filter((x) => !x.dnf);
    const dnfs = s.solves.length - clean.length;
    const calcMean = clean.length
      ? clean.reduce((a, b) => a + b.timeMs, 0) / clean.length
      : NaN;
    let ok = true;
    if (exp) {
      if (s.solves.length !== exp[0]) ok = false;
      if (dnfs !== exp[1]) ok = false;
      if (Math.abs(calcMean - exp[2]) > 0.01) ok = false;
    }
    const idxMatch = s.meta.key.match(/^session(\d+)$/);
    const scrType = idxMatch ? (sessionData[idxMatch[1]]?.opt?.scrType as string | undefined) : undefined;
    const expectedType = scrType ? EXPECTED_FROM_SCR_TYPE[scrType] : undefined;
    let typeOk: string = "-";
    if (expectedType) {
      if (s.puzzleType === expectedType || s.typeSource === "heuristic") {
        typeOk = "OK";
      } else {
        typeOk = `FAIL(exp ${expectedType})`;
        ok = false;
      }
    }
    if (!ok) failures++;
    lines.push(
      `${s.meta.key} | ${s.puzzleType}(${s.typeSource}) | ${s.solves.length} | ${dnfs}/${exp ? exp[1] : "?"} | ${calcMean.toFixed(1)}/${exp ? exp[2].toFixed(1) : "?"} | ${typeOk} | ${ok ? "OK" : "FAIL"}`,
    );
  }

  const merged = mergedOfType(parsed, "3x3");
  const clean = merged.filter((s) => !s.dnf);
  lines.push("");
  lines.push(`Merged 3x3: ${merged.length} solves (${clean.length} clean)`);
  if (clean.length === 0) {
    lines.push("NO 3x3 SOLVES DETECTED - heuristic failure");
    return { failures: failures + 1, lines };
  }
  const days = dailyBuckets(clean);
  lines.push(
    `Day buckets: ${days.length}, first ${new Date(days[0].dayStartMs).toISOString()}, last ${new Date(days[days.length - 1].dayStartMs).toISOString()}`,
  );
  const trend = fitDailyTrend(days);
  lines.push(
    trend
      ? `Trend: ${(trend.slopeMsPerDay * 7).toFixed(1)} ms/week over ${trend.weeksCovered.toFixed(1)} weeks; end level ${trend.endLevelMs.toFixed(0)} ms`
      : "Trend: insufficient data",
  );
  const result = analyze({ rangedClean: clean, allClean: clean });
  lines.push(
    `Analysis: ${JSON.stringify(result.subscores)} headline: ${result.headline} tier: ${result.tier}`,
  );
  return { failures, lines };
}

function mergedOfType(parsed: ReturnType<typeof parseCstimerExport>, type: ParsedSession["puzzleType"]) {
  return parsed.sessions
    .filter((s) => s.puzzleType === type)
    .flatMap((s) => s.solves)
    .sort((a, b) => a.dateSec - b.dateSec);
}

if (process.argv[1] && process.argv[1].endsWith("verify.ts")) {
  const file = process.argv[2] ?? "fixtures/synthetic-export.txt";
  const text = readFileSync(file, "utf8");
  const result = crossCheck(text);
  console.log(result.lines.join("\n"));
  if (result.failures > 0) {
    console.error(`\n${result.failures} SESSION(S) FAILED CROSS-CHECK`);
    process.exit(1);
  }
  console.log("\nALL SESSIONS MATCH CSTIMER'S OWN STATS");
}
