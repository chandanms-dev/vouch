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

## Git state

Work is on `init-frontend` (branched from `userstory`), open as PR #1 into `main`. `main` still holds only the initial commit until that is merged.

## Next session
Backend Story 1 (setup). Hand-written by the user; Claude explains and reviews only.
