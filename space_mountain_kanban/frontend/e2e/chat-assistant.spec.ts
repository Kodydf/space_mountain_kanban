import { test, expect } from "@playwright/test";

test("digital assistant applies an action returned by the assistant", async ({ page }) => {
  // A different card than delete-card.spec.ts deletes, since both specs run
  // against the same shared, persistent backend.
  const targetTitle = "Review pull request #142";
  await page.goto("/");

  // Mock the AI's response but base it on the real current board (fetched
  // the same way the backend would), so the mocked reply is self-consistent
  // with whatever earlier specs have already mutated.
  const realBoard = await page.evaluate(async () => {
    const res = await fetch("/api/board", { credentials: "include" });
    return res.json();
  });
  const targetCard = realBoard.cards.find((c: { title: string }) => c.title === targetTitle);
  const boardAfterDelete = {
    ...realBoard,
    cards: realBoard.cards.filter((c: { id: string }) => c.id !== targetCard.id),
  };

  await page.route("**/api/chat", async (route) => {
    const body = route.request().postDataJSON();
    expect(body.messages.at(-1).content).toContain("Delete");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ reply: `Deleted "${targetTitle}".`, board: boardAfterDelete }),
    });
  });

  const card = page.getByTestId("card").filter({ hasText: targetTitle });
  await expect(card).toBeVisible();

  await page.getByRole("button", { name: /open digital assistant/i }).click();
  await page.getByPlaceholder(/ask the assistant/i).fill(`Delete the ${targetTitle} card`);
  await page.getByRole("button", { name: /send message/i }).click();

  await expect(page.getByText(new RegExp(`deleted "${targetTitle}"`, "i"))).toBeVisible();
  await expect(card).toHaveCount(0);
});

test("digital assistant can really add a card via OpenRouter (live)", async ({ page }) => {
  test.skip(!process.env.RUN_LIVE_E2E, "Set RUN_LIVE_E2E=1 to run this test — it makes a real OpenRouter call.");

  await page.goto("/");
  await page.getByRole("button", { name: /open digital assistant/i }).click();
  await page
    .getByPlaceholder(/ask the assistant/i)
    .fill("Add a card to the To Do column titled Live AI Test Card with no details and no due date.");
  await page.getByRole("button", { name: /send message/i }).click();

  await expect(page.getByText("Live AI Test Card")).toBeVisible({ timeout: 30_000 });
});

test("digital assistant shows an error message when the API call fails", async ({ page }) => {
  await page.route("**/api/chat", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: "Server is missing the OpenRouter API key." }),
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: /open digital assistant/i }).click();
  await page.getByPlaceholder(/ask the assistant/i).fill("Hello");
  await page.getByRole("button", { name: /send message/i }).click();

  await expect(page.getByText(/openrouter api key/i)).toBeVisible();
});
