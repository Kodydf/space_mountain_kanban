import { test, expect } from "@playwright/test";

test("adding a card appends it to the column, with a due date", async ({ page }) => {
  await page.goto("/");

  const reviewColumn = page.getByTestId("column").filter({ hasText: "Review" });
  await expect(reviewColumn.getByTestId("card").first()).toBeVisible();
  const cardsBefore = await reviewColumn.getByTestId("card").count();

  const addCardButton = reviewColumn.getByRole("button", { name: /add card/i });
  await expect(addCardButton).toHaveClass(/text-green-400/);
  await addCardButton.click();
  await reviewColumn.getByPlaceholder("Title").fill("Write release notes");
  await reviewColumn.getByPlaceholder("Details").fill("Summarize this week's changes");
  await reviewColumn.locator('input[type="date"]').fill("2026-12-01");
  await reviewColumn.getByRole("button", { name: /^add$/i }).click();

  const newCard = reviewColumn.getByTestId("card").filter({ hasText: "Write release notes" });
  await expect(newCard).toBeVisible();
  await expect(newCard.getByTestId("due-date")).toHaveText(/Dec 1, 2026/);
  await expect(reviewColumn.getByTestId("card")).toHaveCount(cardsBefore + 1);

  // Persists across a reload — the board is a real backend now, not local state.
  await page.reload();
  const reloadedColumn = page.getByTestId("column").filter({ hasText: "Review" });
  await expect(reloadedColumn.getByTestId("card").filter({ hasText: "Write release notes" })).toBeVisible();
});
