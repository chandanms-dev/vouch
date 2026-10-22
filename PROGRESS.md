# Progress

## Session 1: repo setup and frontend prototype

**Done**
- Private GitHub repo `vouch` created; `main` pushed.
- Repo structure, `.gitignore`, README, CLAUDE.md. Figma exports in `docs/design/` (`components/`, `screens/`), user stories in `docs/`.
- `docs/design/tokens.md` and Tailwind theme (colours since confirmed by `docs/Foundations.pdf`).
- Frontend prototype (Next.js 14, TS strict, Tailwind) on a mock API behind one interface (`frontend/src/lib/api`): landing, sign-in, magic-link check/expired/verify, invite, feed (cursor pagination, filters, empty/loading/error), show detail, profiles (self/friend/FoF/stranger), friends (friends/requests/invite), me, composer sheet (2 steps), Me-too sheet, Spaces/Plans "Coming soon".
- `npm run lint` and `npm run build` pass with zero errors.

**Prototype tips**: any email signs in to the full demo network (Session 3); the "Prototype: see empty state" link on sign-in gives the empty ("quiet") feed. "Open email app" simulates tapping the link; "simulate an expired link" shows the expired screen. Invite code example: `maya-4TLF`. Data resets on reload except the session.

**Open issues**
1. **Foundations** (`docs/Foundations.pdf`) confirmed all colours and added contrast rules (applied). It has no type scale, radii or hover/disabled states, so those stay estimated; see `docs/design/tokens.md` "Still unconfirmed".
2. **Design vs MVP scope.** Landing, sign-in, invite and empty-feed examples now show TV and anime only (Frieren, Severance, The Bear, Bocchi). Film, Book and Food remain only as disabled "Coming soon" chips in the composer. The exports still draw Film/Book/Place; the Figma file should be updated to match. Feed filter chips are All / TV / Anime.
3. No export for: Edit profile, desktop auth/invite screens (mobile layout used, centred), desktop Friends/Me/profile (follow the feed/detail pattern), Sign out (added on Me for the prototype), profile taste-tag highlighting (shared = cream, others = muted).
4. Impeccable audit (390 and 1440), report only, nothing fixed:
   - P1: sheets have no focus trap and the page behind is not inert. Close and Back targets are under 44px (chips 32px, Back 40px, tags/small buttons 28-36px).
   - P1: reduced-motion CSS uses a global 1ms duration kill; no intentional alternative.
   - P2: placeholder contrast on cream inputs (fixed after Foundations: ink at 65%).
   - P2: heading order: landing and mobile feed go h1/none to h3 (cards); mobile feed has no h1.
   - P2: landing/sign-in collages use fixed pixel widths and overflow below about 360px.
   - P2: CSS-column masonry reflows when more feed items load.
   - P3: `will-change-transform` left on the sheet at rest; a few hard-coded hex values in `globals.css`; detector "straggler" advisories on landing copy.
5. Mock data only: no real TMDB, email or persistence.

## Session 2: fixes on `init-frontend`

- Author names and "via" tags link to profiles (stretched card link on the title keeps links un-nested); "Who rated it" chips link too. All mock handles open: friends full, FoF name/avatar/via/shared tags only, strangers not found.
- Shows-only copy and examples on sign-in, landing, invite, empty feed.
- Show and profile screens open scrolled to the top.
- Removed "Make a plan" (Plans deferred).
- Email no longer in the check-email URL; held in memory (refresh returns to sign-in). Magic-link tokens are opaque and single-use in the mock.

## Session 3: Batch 1, share-ready fixes (`batch1-share-ready`)

- Sign-in: any email opens the full demo feed; "Prototype: see empty state" link on sign-in signs in as `empty@vouch.test` (quiet feed). Hint text updated.
- Link preview: Open Graph + Twitter tags (title "Vouch", new description), `metadataBase` https://vouch-ecru.vercel.app, generated 1200x630 `opengraph-image` / `twitter-image` in the Mixtape style (Bricolage fetched from Google Fonts at build, falls back to default sans if offline).
- Feed grid: gap between cards is now padding (not margin) so column breaks no longer swallow it; 24px in every column.
- Feed chips: selected = filled, unselected = 2px outline in the field colour; no ring; keyboard focus ring only via `focus-visible`.
- Composer: chip row has padding so the selected outline is not clipped. Film/Book/Food are muted, `aria-disabled`, `tabindex=-1`, `cursor-not-allowed`. Search shows "Keep typing…" under 3 characters; 3+ searches the mock.
- Verified with Playwright (375 and 1440) and lint/build; no console errors. Playwright is not a repo dependency (run from a scratch folder).

## Session 4: Batch 2, missing flows and states (`batch2-flows-states`)

- Composer: category chips are a 4-column grid (no horizontal scroll at 375px, outline not clipped).
- Sign out (Me page) clears the mock session and returns to the landing page; signed-out visits to protected routes still redirect to sign-in.
- Edit / delete own vouch: `api.vouches.update` / `remove` in the mock (author only, `forbidden` otherwise). Edit and Delete buttons appear on your own vouch cards (Me, your profile, and a new "Your vouch" section on show detail). Edit reopens the composer prefilled ("Save changes"). Delete uses a new `ConfirmDialog` (built on `Sheet`).
- `Sheet` now traps focus (Tab / Shift+Tab cycle) and closes on Esc, closing the earlier P1 "no focus trap" audit item for sheets. Page behind is still not inert.
- Styled 404 (`app/not-found.tsx`, `NotFoundView`): links home, plus feed when signed in. Unknown show / handle show it too.
- Error states: `ErrorState` (button now "Retry", `compact` variant) on feed, detail, profile, Me and composer search; Retry re-fetches.
- Loading: `ShowSkeleton`, `ProfileSkeleton`, `CardSkeleton` mirror the real layouts.
- Empty states via new `EmptyState`: search ("Nothing matches ..."), profile / Me with no vouches, feed filter with nothing.
- **Dev toggles** (read from the URL once per load, kept in sessionStorage): `?fail=1` all data calls fail, `?fail=once` next one fails then Retry works, `?fail=0` clears; `?empty=tv|anime` empty feed filter, `?empty=vouches` profiles/Me with no vouches, `?empty=0` clears. Sign in as `empty@vouch.test` for a real zero-vouch Me page.
- Verified with Playwright at 375 and 1440 (all new states), lint and build pass. The only console "errors" are the browser's own 404 resource lines when opening a genuinely unknown route.

## Session 5: Batch 3, quality pass (`batch3-quality`)

- **Type scale** measured from the PNG exports (ink widths/heights matched against Chrome renders of the real fonts; not Figma), written to `docs/design/tokens.md` and `tailwind.config.ts` as named `text-*` styles (`display`, `page`, `h1`, `h2`, `card`, `h3`, `stat`, `stamp`, `body`, `body-sm`, `label`, `chip`, `meta`, `tag`, `micro`; marketing-only styles are listed separately as not measured). Every ad-hoc `text-sm/xl/[Npx]` was replaced. Corrections: card meta and timestamps 13 (was 12), type badge 14, section titles 24 on mobile and desktop (were 28/32), detail title 60 on desktop, profile name 32.
- **Persistence:** mock state (users, vouches, friendships, requests, anticipations) is stored in localStorage under `vouch.demo.v1`, all access guarded, falling back to memory. Sign-in already persisted. "Reset demo data" on Me restores the seed.
- Toasts wait while any dialog/sheet is open (`dialog-state.ts`), then show.
- Edit profile is a disabled "Coming soon" chip (`aria-disabled`, not focusable).
- **Accessibility:** page behind a sheet/dialog is `inert`; 44px tap targets on mobile (real size, or a `.hit-44` pseudo-element hit area for pills; links inside sentences are exempt); one h1 per page and ordered headings (mobile feed has a screen-reader h1; feed cards are h2; decorative landing cards have no heading); `ErrorState` / `EmptyState` take a heading level; Me-too options are a proper radiogroup. axe contrast was clean (muted on ink is 9.9:1).
- `npm run a11y` (`scripts/a11y-audit.mjs`, dev deps `@axe-core/playwright`, `playwright-core`; needs the app running) audits 30 routes/states at 375, 1024 and 1440: axe WCAG A/AA + best-practice, h1, heading order, tap targets and keyboard focus. Last run: 0 blocking findings, no console errors.
- **Reduced motion:** entrances become opacity-only (so tilted stamps and tiles never move), sheets fade instead of sliding, skeleton pulse stops, press scale off. Replaces the old 1ms duration hack.
- **Desktop check (1024/1440):** show detail was crushed at 1024 (side panel + two card columns); now one column until 1360px. "Me too" no longer wraps on narrow anticipation cards. New dev flag `?fail=more` (load-more error); `?fail=1` now also fails the Friends page.

## Git state

Work lands on `main` through PRs (#1 Session 2, #2 Batch 1, #3 Batch 2).

## Next session
Backend Story 1 (setup). Hand-written by the user; Claude explains and reviews only.
