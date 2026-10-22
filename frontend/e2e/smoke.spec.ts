import { expect, test, type Page } from "@playwright/test";

// These run against the in-browser mock API (NEXT_PUBLIC_API_BASE_URL unset), in a fresh browser
// context per test, so every test starts from the seed data.

const DEMO_EMAIL = "demo@example.com";

/** Starts a test already signed in (the mock keeps the session email in localStorage). */
async function signedIn(page: Page) {
  await page.addInitScript((email) => window.localStorage.setItem("vouch.session", email), DEMO_EMAIL);
}

async function openComposer(page: Page) {
  const mobile = (page.viewportSize()?.width ?? 1440) < 768;
  await (mobile ? page.getByRole("button", { name: "Add a vouch" }) : page.getByRole("button", { name: "+ Vouch", exact: true })).click();
  await expect(page.getByRole("dialog", { name: "Add a vouch" })).toBeVisible();
}

const own = (page: Page) => page.locator("main article");

test("signs in with any email and lands on the feed", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill("anyone@example.com");
  await page.getByRole("button", { name: "Send me a magic link" }).click();
  await expect(page).toHaveURL(/check-email/);
  await page.getByRole("button", { name: "Open email app" }).click();
  await expect(page).toHaveURL(/\/feed/);
  await expect(page.getByRole("heading", { level: 1, name: "Your feed" })).toBeAttached();
  await expect(page.locator("main article").first()).toBeVisible();
});

test("opens a show, posts a vouch, and it survives a reload", async ({ page }) => {
  await signedIn(page);
  await page.goto("/feed");
  await page.getByRole("link", { name: /^Adolescence, rated/ }).first().click();
  await expect(page).toHaveURL(/\/show\//);
  await expect(page.getByRole("heading", { level: 1, name: "Adolescence" }).first()).toBeVisible();

  await page.getByRole("button", { name: "Add your vouch" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: /How was Adolescence/ })).toBeVisible();
  await dialog.getByRole("button", { name: "7", exact: true }).click();
  await dialog.getByLabel("Your review").fill("Smoke test review");
  await dialog.getByRole("button", { name: "Post vouch" }).click();
  await expect(page.getByRole("status")).toHaveText("Vouch posted");

  await page.goto("/me");
  await expect(page.getByText("Smoke test review")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Smoke test review")).toBeVisible();
});

test("edits and deletes your own vouch", async ({ page }) => {
  await signedIn(page);
  await page.goto("/me");
  await expect(own(page)).toHaveCount(5);

  await page.getByRole("button", { name: "Edit", exact: true }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Your review").fill("Edited in a smoke test");
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Edited in a smoke test")).toBeVisible();

  await page.getByRole("button", { name: "Delete", exact: true }).first().click();
  const confirm = page.getByRole("dialog");
  await expect(confirm.getByRole("heading", { name: /Delete your vouch/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(own(page)).toHaveCount(5); // Esc cancels

  await page.getByRole("button", { name: "Delete", exact: true }).first().click();
  await page.getByRole("button", { name: "Delete vouch" }).click();
  await expect(own(page)).toHaveCount(4);
  await page.reload();
  await expect(own(page)).toHaveCount(4);
});

test("?fail=once shows the error card and Retry recovers", async ({ page }) => {
  await signedIn(page);
  await page.goto("/feed?fail=once");
  await expect(page.getByRole("heading", { name: "Something went sideways." })).toBeVisible();
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.locator("main article").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Something went sideways." })).toHaveCount(0);
});

test("?empty=vouches shows the empty state", async ({ page }) => {
  await signedIn(page);
  await page.goto("/me?empty=vouches");
  await expect(page.getByRole("heading", { name: "No vouches yet." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add a vouch" }).first()).toBeVisible();
});

test("an unknown route shows the 404 page", async ({ page }) => {
  const res = await page.goto("/definitely-not-a-page");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "That page wandered off." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Go home" })).toBeVisible();
});

test("an unknown show shows the 404 view with a link back to the feed", async ({ page }) => {
  await signedIn(page);
  await page.goto("/show/zzz");
  await expect(page.getByRole("heading", { level: 1, name: "We could not find that show." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to your feed" })).toBeVisible();
});

test("signed-out visits to protected routes go to sign-in", async ({ page }) => {
  await page.goto("/me");
  await expect(page).toHaveURL(/\/sign-in/);
});

test("the composer opens and finds a show", async ({ page }) => {
  await signedIn(page);
  await page.goto("/feed");
  await openComposer(page);
  await page.getByPlaceholder("Search TV and anime").fill("se");
  await expect(page.getByText("Keep typing…")).toBeVisible();
  await page.getByPlaceholder("Search TV and anime").fill("sev");
  await expect(page.getByRole("button", { name: /Severance/ })).toBeVisible();
});
