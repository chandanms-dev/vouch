import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Accessibility audit of every route and state at 375, 1024 and 1440px. Per page it runs axe
// (WCAG 2 A/AA + best practice, serious/critical fail) and checks one visible h1, heading order,
// 44px tap targets (375px only) and a visible keyboard focus indicator.

const VIEWPORTS = [
  { name: "375", width: 375, height: 812 },
  { name: "1024", width: 1024, height: 768 },
  { name: "1440", width: 1440, height: 900 },
];

const ME = "demo@example.com";
const EMPTY = "empty@vouch.test";

const addVouchButton = (page: Page, width: number) =>
  width < 768 ? page.getByLabel("Add a vouch") : page.getByText("+ Vouch");

interface Route {
  name: string;
  path: string;
  /** Mock session email; null = signed out. */
  email: string | null;
  setup?: (page: Page, width: number) => Promise<void>;
}

const ROUTES: Route[] = [
  { name: "landing", path: "/", email: null },
  { name: "sign-in", path: "/sign-in", email: null },
  { name: "auth-expired", path: "/auth/expired", email: null },
  { name: "auth-verify-expired", path: "/auth/verify?token=expired", email: null },
  { name: "invite", path: "/i/maya-4TLF", email: null },
  { name: "404-signed-out", path: "/nope", email: null },
  { name: "feed", path: "/feed", email: ME },
  { name: "feed-quiet", path: "/feed", email: EMPTY },
  {
    name: "feed-filter-empty",
    path: "/feed?empty=tv",
    email: ME,
    setup: async (p) => {
      await p.locator("button[aria-pressed]:has-text('TV')").locator("visible=true").click();
      await p.waitForTimeout(900);
    },
  },
  { name: "feed-error", path: "/feed?fail=1", email: ME },
  {
    name: "feed-load-more-error",
    path: "/feed?fail=more",
    email: ME,
    setup: async (p) => {
      for (let i = 0; i < 6; i++) {
        await p.mouse.wheel(0, 4000);
        await p.waitForTimeout(400);
      }
      await p.getByText("Could not load more").waitFor({ timeout: 5000 });
    },
  },
  {
    name: "feed-composer",
    path: "/feed",
    email: ME,
    setup: async (p, w) => {
      await addVouchButton(p, w).click();
      await p.waitForTimeout(500);
    },
  },
  {
    name: "feed-composer-search",
    path: "/feed",
    email: ME,
    setup: async (p, w) => {
      await addVouchButton(p, w).click();
      await p.getByPlaceholder("Search TV and anime").fill("sev");
      await p.waitForTimeout(900);
    },
  },
  {
    name: "feed-me-too",
    path: "/feed",
    email: ME,
    setup: async (p) => {
      await p.getByRole("button", { name: "Me too" }).first().click();
      await p.waitForTimeout(600);
    },
  },
  { name: "show", path: "/show/s_frieren", email: ME },
  { name: "show-404", path: "/show/zzz", email: ME },
  { name: "show-error", path: "/show/s_frieren?fail=1", email: ME },
  { name: "profile-friend", path: "/u/maya", email: ME },
  { name: "profile-fof", path: "/u/arjun", email: ME },
  { name: "profile-404", path: "/u/nobody", email: ME },
  { name: "profile-empty", path: "/u/maya?empty=vouches", email: ME },
  { name: "me", path: "/me", email: ME },
  {
    name: "me-delete-confirm",
    path: "/me",
    email: ME,
    setup: async (p) => {
      await p.getByRole("button", { name: "Delete", exact: true }).first().click();
      await p.waitForTimeout(600);
    },
  },
  { name: "me-no-vouches", path: "/me", email: EMPTY },
  { name: "friends", path: "/friends", email: ME },
  { name: "friends-requests", path: "/friends?tab=requests", email: ME },
  { name: "friends-invite", path: "/friends?tab=invite", email: ME },
  { name: "friends-error", path: "/friends?fail=1", email: ME },
  { name: "spaces", path: "/spaces", email: ME },
  { name: "plans", path: "/plans", email: ME },
];

/** Runs in the page: structure checks that axe does not cover. */
function structureChecks(checkTargets: boolean) {
  const visible = (el: Element) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && !el.closest("[hidden],[inert]");
  };
  // Headings behind an open dialog are inert but still part of the page outline.
  const inOutline = (el: Element) =>
    el.getClientRects().length > 0 && getComputedStyle(el).display !== "none" && !el.closest("[hidden],[aria-hidden=true]");
  // A pseudo-element hit area (.hit-44, stretched card links) counts as the target.
  const hitArea = (el: Element) =>
    ["::before", "::after"].some((p) => {
      const s = getComputedStyle(el, p);
      return s.content !== "none" && s.position === "absolute" && parseFloat(s.width) >= 43.5 && parseFloat(s.height) >= 43.5;
    });

  const heads = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter(inOutline).map((e) => Number(e.tagName[1]));
  const out = { h1: heads.filter((n) => n === 1).length, headingJumps: [] as string[], small: [] as string[] };
  let prev = 0;
  for (const n of heads) {
    if (n > prev + 1) out.headingJumps.push(`h${prev || "none"}->h${n}`);
    prev = n;
  }
  if (checkTargets) {
    document.querySelectorAll("a[href],button,input:not([type=hidden]),select,textarea,[role=tab]").forEach((el) => {
      if (!visible(el) || el.classList.contains("sr-only")) return;
      const r = el.getBoundingClientRect();
      if ((r.width < 43.5 || r.height < 43.5) && !hitArea(el)) {
        // Links inside a sentence are exempt (WCAG 2.5.8 inline exception).
        if (el.tagName === "A" && getComputedStyle(el).display === "inline" && el.closest("p")) return;
        const label = (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 28);
        out.small.push(`${el.tagName.toLowerCase()} "${label}" ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
    });
  }
  return out;
}

for (const vp of VIEWPORTS) {
  test.describe(`@a11y ${vp.name}px`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const route of ROUTES) {
      test(route.name, async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on("console", (m) => {
          // The browser logs a resource error for every genuine HTTP 404 document.
          if (m.type() === "error" && !/status of 404/.test(m.text())) consoleErrors.push(m.text());
        });
        page.on("pageerror", (e) => consoleErrors.push(e.message));
        if (route.email) {
          await page.addInitScript((e) => window.localStorage.setItem("vouch.session", e), route.email);
        }
        await page.goto(route.path);
        await page.waitForTimeout(1500);
        await route.setup?.(page, vp.width);
        await page.waitForTimeout(300);

        const axe = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
          .analyze();
        const blocking = axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
        expect(
          blocking.map((v) => `${v.id} (${v.impact}) x${v.nodes.length}: ${v.nodes[0]?.html.slice(0, 100)}`),
          "axe serious/critical violations",
        ).toEqual([]);

        const dom = await page.evaluate(structureChecks, vp.width < 768);
        expect(dom.h1, "visible h1 count").toBe(1);
        expect(dom.headingJumps, "heading order").toEqual([]);
        expect(dom.small, "tap targets under 44px").toEqual([]);

        // Keyboard focus: tab through the first controls; each must show a focus indicator.
        const noFocus: string[] = [];
        await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur?.());
        for (let i = 0; i < 24; i++) {
          await page.keyboard.press("Tab");
          const f = await page.evaluate(() => {
            const el = document.activeElement;
            if (!el || el === document.body) return null;
            const s = getComputedStyle(el);
            const ok = (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0) || s.boxShadow !== "none";
            return { ok, label: `${el.tagName.toLowerCase()} "${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 24)}"` };
          });
          if (f && !f.ok) noFocus.push(f.label);
        }
        expect([...new Set(noFocus)], "controls without a visible focus indicator").toEqual([]);
        expect(consoleErrors, "console errors").toEqual([]);
      });
    }
  });
}
