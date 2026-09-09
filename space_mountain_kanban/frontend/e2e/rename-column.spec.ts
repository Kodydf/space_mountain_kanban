import { test, expect } from "@playwright/test";

test("renaming a column updates its header", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("heading", { name: "Blocked" }).click();
  const input = page.getByRole("textbox");
  await input.fill("On Hold");
  await input.press("Enter");

  await expect(page.getByRole("heading", { name: "On Hold" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Blocked" })).toHaveCount(0);
});
