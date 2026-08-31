import { test, expect } from "@playwright/test";

test("settings persist after reload", async ({ page }) => {
  await page.goto("/settings");

  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

  const delaySlider = page.getByRole("slider", { name: /start delay/i });
  await delaySlider.fill("1000");
  await expect(delaySlider).toHaveValue("1000");

  await page.reload();

  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  const reloadedSlider = page.getByRole("slider", { name: /start delay/i });
  await expect(reloadedSlider).toHaveValue("1000");
});

test("scramble length persists after reload", async ({ page }) => {
  await page.goto("/settings");

  const input = page.locator("input").filter({ hasText: /^$/ }).nth(0);
  await page.getByText("3x3").waitFor();
  const threeByThreeInput = page.locator('input[aria-label="3x3 scramble"]');
  await threeByThreeInput.fill("30");
  await expect(threeByThreeInput).toHaveValue("30");

  await page.reload();

  const reloadedInput = page.locator('input[aria-label="3x3 scramble"]');
  await expect(reloadedInput).toHaveValue("30");
});

test("inspection toggle persists after reload", async ({ page }) => {
  await page.goto("/settings");

  const inspectionRow = page.getByText("Inspection").locator("..");
  await inspectionRow.getByRole("button").click();
  await expect(inspectionRow.getByRole("button")).toHaveText("On");

  await page.reload();

  const reloadedRow = page.getByText("Inspection").locator("..");
  await expect(reloadedRow.getByRole("button")).toHaveText("On");
});
