import { test, expect } from "@playwright/test";

test("overdue cards are flagged in red and future ones are not", async ({ page }) => {
  await page.goto("/");

  const overdueCard = page.getByTestId("card").filter({ hasText: "Set up analytics" });
  const futureCard = page.getByTestId("card").filter({ hasText: "Design onboarding flow" });

  await expect(overdueCard.getByTestId("due-date")).toHaveAttribute("data-overdue", "true");
  await expect(futureCard.getByTestId("due-date")).toHaveAttribute("data-overdue", "false");
});

test("editing a card's due date updates the badge", async ({ page }) => {
  await page.goto("/");

  const card = page.getByTestId("card").filter({ hasText: "Waiting on design assets" });
  await card.getByTestId("due-date").click();
  await card.locator('input[type="date"]').fill("2000-01-01");
  await card.locator('input[type="date"]').press("Enter");

  await expect(card.getByTestId("due-date")).toHaveAttribute("data-overdue", "true");
});
