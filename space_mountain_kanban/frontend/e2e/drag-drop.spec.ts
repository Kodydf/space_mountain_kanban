import { test, expect } from "@playwright/test";

test("dragging a card moves it to another column", async ({ page }) => {
  await page.goto("/");

  const sourceColumn = page.getByTestId("column").filter({ hasText: "To Do" });
  const targetColumn = page.getByTestId("column").filter({ hasText: "Done" });
  const card = sourceColumn.getByTestId("card").filter({ hasText: "Design onboarding flow" });

  const cardBox = await card.boundingBox();
  const targetBox = await targetColumn.getByTestId("column-drop-area").boundingBox();
  if (!cardBox || !targetBox) throw new Error("Could not measure drag source/target");

  await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + 20, { steps: 15 });
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + 30, { steps: 5 });
  await page.mouse.up();

  await expect(targetColumn.getByText("Design onboarding flow")).toBeVisible();
  await expect(sourceColumn.getByText("Design onboarding flow")).toHaveCount(0);

  // Persists across a reload — the board is a real backend now, not local state.
  await page.reload();
  const reloadedTarget = page.getByTestId("column").filter({ hasText: "Done" });
  await expect(reloadedTarget.getByText("Design onboarding flow")).toBeVisible();
});
