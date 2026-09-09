import { test, expect } from "@playwright/test";

test("editing an existing card updates its title and details", async ({ page }) => {
  await page.goto("/");

  const card = page.getByTestId("card").filter({ hasText: "Build settings page" });
  await card.hover();
  await card.getByRole("button", { name: /edit card/i }).click();

  await page.getByPlaceholder("Title").fill("Build settings & billing page");
  await page.getByPlaceholder("Details").fill("Account, notification, and billing preferences.");
  await page.getByRole("button", { name: /^save$/i }).click();

  await expect(page.getByText("Build settings & billing page")).toBeVisible();
  await expect(page.getByText("Account, notification, and billing preferences.")).toBeVisible();
  await expect(page.getByText("Build settings page", { exact: true })).toHaveCount(0);
});

test("canceling an edit discards changes", async ({ page }) => {
  await page.goto("/");

  const card = page.getByTestId("card").filter({ hasText: "Refactor auth module" });
  await card.hover();
  await card.getByRole("button", { name: /edit card/i }).click();

  await page.getByPlaceholder("Title").fill("This should not be saved");
  await page.getByRole("button", { name: /cancel/i }).click();

  await expect(page.getByText("Refactor auth module")).toBeVisible();
  await expect(page.getByText("This should not be saved")).toHaveCount(0);
});
