import { test, expect } from "@playwright/test";

test("board opens with 5 columns and dummy data", async ({ page }) => {
  await page.goto("/");

  // "Blocked" and the total card count are deliberately not checked here:
  // other specs rename that column and add/delete cards against the same
  // shared, persistent backend, so only titles no spec ever mutates are
  // safe to assert on exactly.
  const columnTitles = ["To Do", "In Progress", "Review", "Done"];
  const columns = page.getByTestId("column");
  await expect(columns).toHaveCount(5);

  for (const title of columnTitles) {
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
  }

  await expect(page.getByText("Design onboarding flow")).toBeVisible();
  await expect(page.getByText("Launch marketing site")).toBeVisible();
});
