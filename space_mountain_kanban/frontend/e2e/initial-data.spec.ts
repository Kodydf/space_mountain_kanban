import { test, expect } from "@playwright/test";

test("board opens with 5 columns and dummy data", async ({ page }) => {
  await page.goto("/");

  const columnTitles = ["To Do", "In Progress", "Review", "Blocked", "Done"];
  const columns = page.getByTestId("column");
  await expect(columns).toHaveCount(5);

  for (const title of columnTitles) {
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
  }

  await expect(page.getByText("Design onboarding flow")).toBeVisible();
  await expect(page.getByText("Launch marketing site")).toBeVisible();
  await expect(page.getByTestId("card")).toHaveCount(8);
});
