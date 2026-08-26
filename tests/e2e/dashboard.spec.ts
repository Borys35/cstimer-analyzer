import { test, expect } from "@playwright/test";

const FIXTURE = "fixtures/synthetic-export.txt";

async function waitForDeploymentSha(page: import("@playwright/test").Page, sha: string) {
  const deadline = Date.now() + 10 * 60_000;
  let last = "";
  while (Date.now() < deadline) {
    const resp = await page.goto("/", { waitUntil: "domcontentloaded" });
    if (resp && !resp.ok()) throw new Error(`prod URL returned ${resp.status()}`);
    last = await page.evaluate(() => {
      const el = document.querySelector('meta[name="git-sha"]');
      return el ? el.getAttribute("content") ?? "" : "";
    });
    if (last === sha) return;
    await page.waitForTimeout(30_000);
  }
  throw new Error(`deployment never served SHA ${sha}; last seen: "${last || "(none)"}"`);
}

test("dashboard renders after fixture upload", async ({ page }) => {
  if (process.env.SMOKE_TARGET && process.env.SMOKE_SHA) {
    await waitForDeploymentSha(page, process.env.SMOKE_SHA);
  } else {
    await page.goto("/");
  }

  await expect(page.getByText(/Drop your cstimer .txt export here/i)).toBeVisible();
  await page.setInputFiles('input[type="file"]', FIXTURE);

  await expect(page.getByText("Headline score")).toBeVisible({ timeout: 20_000 });
  const headline = await page.locator("span.font-mono.text-6xl").first().textContent();
  expect(Number(headline)).toBeGreaterThanOrEqual(0);
  expect(Number(headline)).toBeLessThanOrEqual(100);

  await expect(page.locator(".recharts-surface").first()).toBeVisible();
  const trendLen = await page.evaluate(() => {
    const paths = [...document.querySelectorAll<SVGPathElement>("path.recharts-curve")];
    const trend = paths.find((p) => ["#fbbf24", "#d97706"].includes(p.getAttribute("stroke") ?? ""));
    return trend ? trend.getTotalLength() : -1;
  });
  expect(trendLen).toBeGreaterThan(10);

  await expect(page.getByText(/full prescription/i).first()).toBeVisible();
});

test("theme toggle cycles and persists", async ({ page }) => {
  test.skip(Boolean(process.env.SMOKE_TARGET), "theme prefs are client-local");
  await page.goto("/");
  await page.waitForFunction(() => Boolean(document.documentElement.dataset.theme));
  const first = await page.evaluate(() => document.documentElement.dataset.theme ?? "");
  await page.getByRole("button", { name: /Theme:/ }).click();
  const second = await page.evaluate(() => document.documentElement.dataset.theme ?? "");
  expect(second).not.toBe(first);
  expect(second).not.toBe("");
  const bgVar = (t: string) =>
    page.evaluate((theme) => {
      document.documentElement.dataset.theme = theme;
      return getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
    }, t);
  const bgFirst = await bgVar(first);
  const bgSecond = await bgVar(second);
  expect(bgFirst).not.toBe(bgSecond);
  await page.reload();
  await page.waitForFunction(() => Boolean(document.documentElement.dataset.theme));
  const persisted = await page.evaluate(() => document.documentElement.dataset.theme ?? "");
  expect(persisted).toBe(second);
});
