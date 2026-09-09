import { test, expect } from "@playwright/test";

test("digital assistant applies a tool call returned by the API", async ({ page }) => {
  await page.route("**/api/chat", async (route) => {
    const body = route.request().postDataJSON();
    expect(body.messages.at(-1).content).toContain("Delete");
    const card = body.board.cards.find((c: { title: string }) => c.title === "Waiting on design assets");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        content: null,
        toolCalls: [{ name: "delete_card", arguments: { cardId: card.id } }],
      }),
    });
  });

  await page.goto("/");
  const card = page.getByTestId("card").filter({ hasText: "Waiting on design assets" });
  await expect(card).toBeVisible();

  await page.getByRole("button", { name: /open digital assistant/i }).click();
  await page.getByPlaceholder(/ask the assistant/i).fill("Delete the Waiting on design assets card");
  await page.getByRole("button", { name: /send message/i }).click();

  await expect(page.getByText(/deleted "waiting on design assets"/i)).toBeVisible();
  await expect(card).toHaveCount(0);
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
