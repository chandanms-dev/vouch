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

test("the feed reaches two hops: friends solid, friends of friends dashed with a via tag, never your own vouches", async ({ page }) => {
  await signedIn(page);
  await page.goto("/feed");
  const articles = page.locator("main article");
  await expect(articles.first()).toBeVisible();
  // Scroll until the feed says it is done, so every page of results has loaded.
  for (let i = 0; i < 10 && !(await page.getByText("You are all caught up.").isVisible()); i++) {
    await page.mouse.wheel(0, 5000);
    await page.waitForTimeout(500);
  }
  await expect(page.getByText("You are all caught up.")).toBeVisible();
  const fof = articles.filter({ hasText: /· via / });
  expect(await fof.count()).toBeGreaterThan(0);
  expect(await articles.filter({ hasNotText: /· via / }).count()).toBeGreaterThan(0);
  await expect(fof.first()).toHaveClass(/border-2/); // the existing friend-of-friend card style
  await expect(articles.locator('a[href="/me"]')).toHaveCount(0); // none of your own vouches
});

test("picking a show you already vouched for opens it in edit mode", async ({ page }) => {
  await signedIn(page);
  await page.goto("/feed");
  await openComposer(page);
  await page.getByPlaceholder("Search TV and anime").fill("sev");
  await page.getByRole("button", { name: /Severance/ }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Edit your vouch for Severance" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Save changes" })).toBeVisible();
});

test("show detail shows the friends' average and the network average", async ({ page }) => {
  await signedIn(page);
  await page.goto("/show/s_frieren");
  // The show page renders a mobile and a desktop layout; only one is visible.
  await expect(page.getByText("friends’ average").locator("visible=true").first()).toBeVisible();
  await expect(page.getByText("network average").locator("visible=true").first()).toBeVisible();
});

test("friends page shows request and invite times as text", async ({ page }) => {
  await signedIn(page);
  await page.goto("/friends?tab=invite");
  await expect(page.getByText(/Joined \d+ weeks? ago/).first()).toBeVisible();
  await expect(page.getByText("Not joined yet")).toBeVisible();
});

test("a friend-of-friend profile shows name, via, their vouches and Add friend, and nothing else", async ({ page }) => {
  await signedIn(page);
  await page.goto("/u/arjun");
  await expect(page.getByRole("heading", { level: 1, name: "Arjun Mehta" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Dev/ }).first()).toBeVisible(); // the via link
  await expect(page.getByRole("heading", { name: "Vouches" })).toBeVisible();
  const cards = page.locator("main article");
  expect(await cards.count()).toBeGreaterThan(0);
  await expect(cards.first()).toContainText("via");
  await expect(page.getByRole("button", { name: "Add friend" })).toBeVisible();
  await expect(page.getByText("Taste you share")).toHaveCount(0);
  await expect(page.getByText(/friends$/)).toHaveCount(0); // no friend count
  await expect(page.getByText("Me too")).toHaveCount(0); // no anticipations
});

test("a friend has a full profile and a stranger is a 404", async ({ page }) => {
  await signedIn(page);
  await page.goto("/u/maya");
  await expect(page.getByText("Taste you share")).toBeVisible();
  await expect(page.getByText(/\d+ friends/)).toBeVisible();
  await page.goto("/u/nobody");
  await expect(page.getByRole("heading", { level: 1, name: "Profile not found." })).toBeVisible();
});

test("the composer caps the review at 280 characters with a live counter and tags at 3", async ({ page }) => {
  await signedIn(page);
  await page.goto("/feed");
  await page.getByRole("link", { name: /^Adolescence, rated/ }).first().click();
  await page.getByRole("button", { name: "Add your vouch" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "7", exact: true }).click();
  await dialog.getByLabel("Your review").fill("x".repeat(300));
  await expect(dialog.getByText("280 / 280")).toBeVisible();
  await dialog.getByLabel("Your review").fill("short");
  await expect(dialog.getByText("5 / 280")).toBeVisible();

  for (const t of ["one", "two", "three"]) {
    await dialog.getByRole("button", { name: "+ tag" }).click();
    await dialog.getByLabel("New tag").fill(t);
    await dialog.getByLabel("New tag").press("Enter");
  }
  await expect(dialog.getByRole("button", { name: "+ tag" })).toBeDisabled();
  await expect(dialog.getByText("Remove one to add another.")).toBeVisible();
  await dialog.getByRole("button", { name: "Remove tag two" }).click();
  await expect(dialog.getByRole("button", { name: "+ tag" })).toBeEnabled();
  await expect(dialog.getByText("Up to 3 tags.")).toBeVisible();
});

test("inline Sign in and Enter invite links have a 44px hit area", async ({ page }) => {
  await page.goto("/sign-in");
  const link = page.getByRole("link", { name: "Enter invite" });
  const hit = await link.evaluate((el) => {
    const r = getComputedStyle(el, "::before");
    return { h: parseFloat(r.height), w: parseFloat(r.width) };
  });
  expect(hit.h).toBeGreaterThanOrEqual(44);
  expect(hit.w).toBeGreaterThanOrEqual(44);
});
