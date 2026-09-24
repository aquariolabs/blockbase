import { test, expect } from "@playwright/test";

test("home page renders the shared UI shell", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Blockbase");
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  await expect(page.getByRole("button", { name: "Button from @workspace/ui" })).toBeVisible();
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "Um ponto de partida simples.",
  );
});
