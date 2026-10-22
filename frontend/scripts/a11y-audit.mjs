// Accessibility and layout audit. Needs the app running (npm run build && npm start).
//   node scripts/a11y-audit.mjs [baseUrl] [screenshotDir]
// Runs axe (WCAG 2 A/AA + best practice) on every route and state at 375, 1024 and 1440px, and
// checks one visible h1, heading order, 44px tap targets (375px only) and visible keyboard focus.
import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:3000";
const OUT = process.argv[3];
if (OUT) mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  ["375", 375, 812],
  ["1024", 1024, 768],
  ["1440", 1440, 900],
];

const ME = "demo@example.com";
const EMPTY = "empty@vouch.test";

/** name, path, session email (null = signed out), optional setup(page, vw) */
const ROUTES = [
  ["landing", "/", null],
  ["sign-in", "/sign-in", null],
  ["auth-expired", "/auth/expired", null],
  ["auth-verify-expired", "/auth/verify?token=expired", null],
  ["invite", "/i/maya-4TLF", null],
  ["404-signed-out", "/nope", null],
  ["feed", "/feed", ME],
  ["feed-quiet", "/feed", EMPTY],
  ["feed-filter-empty", "/feed?empty=tv", ME, async (p, vw) => {
    await p.locator("button[aria-pressed]:has-text('TV')").locator("visible=true").click();
    await p.waitForTimeout(900);
  }],
  ["feed-error", "/feed?fail=1", ME],
  ["feed-load-more-error", "/feed?fail=more", ME, async (p) => {
    for (let i = 0; i < 6; i++) {
      await p.mouse.wheel(0, 4000);
      await p.waitForTimeout(500);
    }
    await p.waitForSelector("text=Could not load more", { timeout: 5000 }).catch(() => {});
  }],
  ["feed-composer", "/feed", ME, async (p, vw) => {
    await (vw < 768 ? p.getByLabel("Add a vouch") : p.getByText("+ Vouch")).click();
    await p.waitForTimeout(500);
  }],
  ["feed-composer-search", "/feed", ME, async (p, vw) => {
    await (vw < 768 ? p.getByLabel("Add a vouch") : p.getByText("+ Vouch")).click();
    await p.getByPlaceholder("Search TV and anime").fill("sev");
    await p.waitForTimeout(900);
  }],
  ["feed-me-too", "/feed", ME, async (p) => {
    await p.getByRole("button", { name: "Me too" }).first().click();
    await p.waitForTimeout(600);
  }],
  ["show", "/show/s_frieren", ME],
  ["show-404", "/show/zzz", ME],
  ["show-error", "/show/s_frieren?fail=1", ME],
  ["profile-friend", "/u/maya", ME],
  ["profile-fof", "/u/arjun", ME],
  ["profile-404", "/u/nobody", ME],
  ["profile-empty", "/u/maya?empty=vouches", ME],
  ["me", "/me", ME],
  ["me-delete-confirm", "/me", ME, async (p) => {
    await p.getByRole("button", { name: "Delete", exact: true }).first().click();
    await p.waitForTimeout(600);
  }],
  ["me-no-vouches", "/me", EMPTY],
  ["friends", "/friends", ME],
  ["friends-requests", "/friends?tab=requests", ME],
  ["friends-invite", "/friends?tab=invite", ME],
  ["friends-error", "/friends?fail=1", ME],
  ["spaces", "/spaces", ME],
  ["plans", "/plans", ME],
];

const browser = await chromium.launch({ channel: "chrome" });
const summary = [];
const consoleErrors = [];

for (const [vwName, w, h] of VIEWPORTS) {
  for (const [name, path, email, setup] of ROUTES) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    if (email) await ctx.addInitScript((e) => window.localStorage.setItem("vouch.session", e), email);
    const page = await ctx.newPage();
    page.on("console", (m) => {
      // The browser logs a resource error for every genuine HTTP 404 document.
      if (m.type() === "error" && !/status of 404/.test(m.text())) consoleErrors.push(`${vwName} ${name}: ${m.text()}`);
    });
    page.on("pageerror", (e) => consoleErrors.push(`${vwName} ${name}: ${e.message}`));
    await page.goto(BASE + path);
    await page.waitForTimeout(1500);
    if (setup) await setup(page, w);
    await page.waitForTimeout(300);
    if (OUT) await page.screenshot({ path: `${OUT}/${vwName}-${name}.png`, fullPage: !/composer|me-too|delete/.test(name) });

    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"]).analyze();
    const issues = [];
    for (const v of axe.violations) {
      issues.push({ kind: "axe", impact: v.impact, id: v.id, count: v.nodes.length, sample: v.nodes[0]?.html.slice(0, 110), help: v.help });
    }

    const dom = await page.evaluate((checkTargets) => {
      const visible = (el) => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && !el.closest("[hidden],[inert]");
      };
      // Headings behind an open dialog are inert but still part of the page outline.
      const inOutline = (el) => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return el.getClientRects().length > 0 && s.display !== "none" && !el.closest("[hidden],[aria-hidden=true]");
      };
      // A pseudo-element hit area (.hit-44, stretched card links) counts as the target.
      const hitArea = (el) =>
        ["::before", "::after"].some((p) => {
          const s = getComputedStyle(el, p);
          return s.content !== "none" && s.position === "absolute" && parseFloat(s.width) >= 43.5 && parseFloat(s.height) >= 43.5;
        });
      const heads = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter(inOutline).map((e) => +e.tagName[1]);
      const out = { h1: heads.filter((n) => n === 1).length, headingJumps: [], small: [] };
      let prev = 0;
      heads.forEach((n) => {
        if (n > prev + 1) out.headingJumps.push(`h${prev || "none"}→h${n}`);
        prev = n;
      });
      if (checkTargets) {
        document.querySelectorAll("a[href],button,input:not([type=hidden]),select,textarea,[role=tab]").forEach((el) => {
          if (!visible(el) || el.classList.contains("sr-only")) return;
          const r = el.getBoundingClientRect();
          if ((r.width < 43.5 || r.height < 43.5) && !hitArea(el)) {
            // Links inside a sentence are exempt (WCAG 2.5.8 inline exception).
            const inline = el.tagName === "A" && getComputedStyle(el).display === "inline" && el.closest("p");
            if (inline) return;
            out.small.push(`${el.tagName.toLowerCase()} "${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 28)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
          }
        });
      }
      return out;
    }, w < 768);
    if (dom.h1 !== 1) issues.push({ kind: "h1", impact: "moderate", detail: `${dom.h1} visible h1` });
    if (dom.headingJumps.length) issues.push({ kind: "heading-order", impact: "moderate", detail: dom.headingJumps.join(", ") });
    if (dom.small.length) issues.push({ kind: "tap-target", impact: "moderate", count: dom.small.length, detail: [...new Set(dom.small)].slice(0, 8).join(" | ") });

    // Keyboard focus: tab through the first controls and require a visible indicator.
    const noFocus = [];
    await page.evaluate(() => document.activeElement?.blur?.());
    for (let i = 0; i < 24; i++) {
      await page.keyboard.press("Tab");
      const f = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const s = getComputedStyle(el);
        const outline = s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0;
        const shadow = s.boxShadow !== "none";
        return { ok: outline || shadow, label: `${el.tagName.toLowerCase()} "${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 24)}"` };
      });
      if (f && !f.ok) noFocus.push(f.label);
    }
    if (noFocus.length) issues.push({ kind: "focus-visible", impact: "serious", detail: [...new Set(noFocus)].join(" | ") });

    summary.push({ vw: vwName, name, issues });
    await ctx.close();
  }
}

let bad = 0;
for (const { vw, name, issues } of summary) {
  const rel = issues.filter((i) => i.kind !== "axe" || ["serious", "critical"].includes(i.impact));
  const minor = issues.filter((i) => i.kind === "axe" && !["serious", "critical"].includes(i.impact));
  if (rel.length) bad += rel.length;
  if (rel.length || minor.length) {
    console.log(`\n[${vw}] ${name}`);
    for (const i of rel) console.log(`  ! ${i.kind}${i.id ? ` ${i.id}` : ""} (${i.impact})${i.count ? ` x${i.count}` : ""}: ${i.detail ?? i.help}${i.sample ? `\n      ${i.sample}` : ""}`);
    for (const i of minor) console.log(`  . ${i.id} (${i.impact}) x${i.count}: ${i.help}`);
  }
}
console.log(`\n${summary.length} page checks. Blocking findings (serious/critical axe, h1, heading order, tap targets, focus): ${bad}`);
console.log(consoleErrors.length ? `Console errors:\n${[...new Set(consoleErrors)].join("\n")}` : "Console errors: none");
await browser.close();
process.exit(bad ? 1 : 0);
