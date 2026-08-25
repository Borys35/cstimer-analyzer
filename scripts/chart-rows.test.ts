import { buildChartRows } from "../src/lib/chartData";
import type { Solve } from "../src/lib/types";
import { dailyBuckets, fitDailyTrend } from "../src/lib/stats";

function makeSolves(): Solve[] {
  const solves: Solve[] = [];
  const startSec = Date.UTC(2026, 6, 1) / 1000 + 3600;
  for (let day = 0; day < 21; day++) {
    for (let i = 0; i < 10; i++) {
      const t = startSec + day * 86400 + i * 60 + (day % 7) * 137;
      solves.push({
        timeMs: 20000 - day * 50,
        dnf: false,
        penalty: 0,
        scramble: "",
        dateSec: t,
        splits: [],
      });
    }
  }
  return solves;
}

const clean = makeSolves();
const days = dailyBuckets(clean);
const trend = fitDailyTrend(days);
if (!trend) {
  console.error("fixture produced no trend");
  process.exit(2);
}

const rows = buildChartRows({
  kept: clean,
  clean,
  bucket: "week",
  trend,
  horizonWeeks: 4,
  lastDateMs: clean[clean.length - 1].dateSec * 1000,
});

const trendRows = rows.filter((r) => typeof r.trend === "number");
console.log(`rows=${rows.length} trendRows=${trendRows.length}`);

if (trendRows.length < 30) {
  console.error(`RED: trend series patchy (${trendRows.length} rows carry trend, expected ~41)`);
  process.exit(1);
}
console.log("GREEN: trend series present in chart rows");
