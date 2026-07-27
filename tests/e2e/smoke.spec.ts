import { expect, test } from "@playwright/test";

test("sign in and view shared dashboard", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Trevor");
  await expect(page.getByText("Tasks")).toBeVisible();
});

test("create a task and open it", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("button", { name: "Add something" }).first().click();
  await page.getByLabel("Title").fill("Water the plants");
  await page.getByRole("button", { name: "Save item" }).click();
  await expect(page.getByRole("heading", { name: "Water the plants" })).toBeVisible();
});
