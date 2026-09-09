import { test, expect } from "@playwright/test";

test("moving a card plays the woo sound", async ({ page }) => {
  await page.goto("/");

  // Spy on HTMLMediaElement.play to confirm the sound effect is triggered,
  // without depending on real audio playback in a headless browser.
  await page.addInitScript(() => {
    (window as unknown as { __playCalls: number }).__playCalls = 0;
    const originalPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (...args) {
      (window as unknown as { __playCalls: number }).__playCalls++;
      return originalPlay.apply(this, args).catch(() => {});
    };
  });
  await page.reload();

  const sourceColumn = page.getByTestId("column").filter({ hasText: "To Do" });
  const targetColumn = page.getByTestId("column").filter({ hasText: "Done" });
  const card = sourceColumn.getByTestId("card").filter({ hasText: "Design onboarding flow" });

  const cardBox = await card.boundingBox();
  const targetBox = await targetColumn.getByTestId("column-drop-area").boundingBox();
  if (!cardBox || !targetBox) throw new Error("Could not measure drag source/target");

  await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + 20, { steps: 15 });
  await page.mouse.up();

  await expect(targetColumn.getByText("Design onboarding flow")).toBeVisible();
  const playCalls = await page.evaluate(() => (window as unknown as { __playCalls: number }).__playCalls);
  expect(playCalls).toBeGreaterThan(0);
});
