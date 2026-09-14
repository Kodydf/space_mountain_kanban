import { test, expect } from "@playwright/test";

// This spec exercises the actual login/logout flow, so it opts out of the
// shared authenticated storage state the other specs use.
test.use({ storageState: { cookies: [], origins: [] } });

test("requires login before showing the board", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByLabel("Username")).toBeVisible();
  await expect(page.getByTestId("column")).toHaveCount(0);
});

test("correct credentials reveal the board, and logout returns to login", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Username").fill("user");
  await page.getByLabel("Password").fill("password");
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(page.getByTestId("column").first()).toBeVisible();

  await page.getByRole("button", { name: /log out/i }).click();
  await expect(page.getByLabel("Username")).toBeVisible();
});

test("wrong credentials show an error and do not reveal the board", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Username").fill("user");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(page.getByText(/invalid username or password/i)).toBeVisible();
  await expect(page.getByTestId("column")).toHaveCount(0);
});

test("session persists across a page reload", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Username").fill("user");
  await page.getByLabel("Password").fill("password");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page.getByTestId("column").first()).toBeVisible();

  await page.reload();
  await expect(page.getByTestId("column").first()).toBeVisible();
});
