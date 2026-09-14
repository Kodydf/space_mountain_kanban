import { test, expect } from "@playwright/test";

test("deleting a card removes it from the column", async ({ page }) => {
  await page.goto("/");

  const card = page.getByTestId("card").filter({ hasText: "Waiting on design assets" });
  await card.hover();
  await card.getByRole("button", { name: /delete card/i }).click();

  await expect(page.getByText("Waiting on design assets")).toHaveCount(0);

  // Stays deleted across a reload — the board is a real backend now, not local state.
  await page.reload();
  await expect(page.getByText("Waiting on design assets")).toHaveCount(0);
});
