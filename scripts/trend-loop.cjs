const puppeteer = require("puppeteer-core");
const path = require("node:path");

const URL = process.env.LOOP_URL || "http://localhost:3117";

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const page = await browser.newPage();
    page.on("pageerror", (e) => console.log(`[pageerror] ${e.message}`));
    await page.goto(URL, { waitUntil: "networkidle2", timeout: 30000 });
    const input = await page.$('input[type="file"]');
    if (!input) throw new Error("file input not found — page did not hydrate");
    await input.uploadFile(path.resolve("cstimer_20260825_214133.txt"));
    await page.waitForSelector(".recharts-surface", { timeout: 15000 });

    const info = await page.evaluate(() => {
      const paths = [...document.querySelectorAll("path.recharts-curve")];
      return paths.map((p) => ({
        stroke: p.getAttribute("stroke"),
        len: Math.round(p.getTotalLength()),
        dash: p.getAttribute("stroke-dasharray"),
      }));
    });

    const trend = info.filter(
      (p) => p.stroke && p.stroke.replace(/\s/g, "") === "#fbbf24" || p.stroke === "rgb(251, 191, 36)",
    );
    const visible = trend.some((p) => p.len > 10);
    await page.screenshot({ path: "loop-shot.png" });

    console.log("curve paths:", JSON.stringify(info));
    console.log(`trend-colored paths: ${trend.length}, visible(len>10): ${visible}`);
    if (!visible) {
      console.log("RED: trend line not visible");
      process.exit(1);
    }
    console.log("GREEN: trend line rendered");
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error("LOOP ERROR:", e.message);
  process.exit(2);
});
