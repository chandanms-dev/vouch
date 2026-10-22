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

- **Type scale** (reverted in Session 6; kept as reference only) measured from the PNG exports (ink widths/heights matched against Chrome renders of the real fonts; not Figma), written to `docs/design/tokens.md` and `tailwind.config.ts` as named `text-*` styles (`display`, `page`, `h1`, `h2`, `card`, `h3`, `stat`, `stamp`, `body`, `body-sm`, `label`, `chip`, `meta`, `tag`, `micro`; marketing-only styles are listed separately as not measured). Every ad-hoc `text-sm/xl/[Npx]` was replaced. Corrections: card meta and timestamps 13 (was 12), type badge 14, section titles 24 on mobile and desktop (were 28/32), detail title 60 on desktop, profile name 32.
- **Persistence:** mock state (users, vouches, friendships, requests, anticipations) is stored in localStorage under `vouch.demo.v1`, all access guarded, falling back to memory. Sign-in already persisted. "Reset demo data" on Me restores the seed.
- Toasts wait while any dialog/sheet is open (`dialog-state.ts`), then show.
- Edit profile is a disabled "Coming soon" chip (`aria-disabled`, not focusable).
- **Accessibility:** page behind a sheet/dialog is `inert`; 44px tap targets on mobile (real size, or a `.hit-44` pseudo-element hit area for pills; links inside sentences are exempt); one h1 per page and ordered headings (mobile feed has a screen-reader h1; feed cards are h2; decorative landing cards have no heading); `ErrorState` / `EmptyState` take a heading level; Me-too options are a proper radiogroup. axe contrast was clean (muted on ink is 9.9:1).
- `npm run a11y` (`scripts/a11y-audit.mjs`, dev deps `@axe-core/playwright`, `playwright-core`; needs the app running) audits 30 routes/states at 375, 1024 and 1440: axe WCAG A/AA + best-practice, h1, heading order, tap targets and keyboard focus. Last run: 0 blocking findings, no console errors.
- **Reduced motion:** entrances become opacity-only (so tilted stamps and tiles never move), sheets fade instead of sliding, skeleton pulse stops, press scale off. Replaces the old 1ms duration hack.
- **Desktop check (1024/1440):** show detail was crushed at 1024 (side panel + two card columns); now one column until 1360px. "Me too" no longer wraps on narrow anticipation cards. New dev flag `?fail=more` (load-more error); `?fail=1` now also fails the Friends page.

## Session 6: restore pre-Batch-3 typography (`fix/restore-typography`)

- The measured type scale from PR #4 looked worse in the real UI (cramped card titles, tighter line heights), so all font sizes, line heights, letter spacing and text spacing are back to the pre-PR #4 values. `tailwind.config.ts` is back to its original named styles (`hero`, `hero-sm`, `h1`, `h2`, `card`, `meta`, `tag`); components use the original classes again. The Batch 3 names (`page`, `label`, `micro`, ...) are removed because nothing uses them.
- `docs/design/tokens.md`: "Type scale (applied)" holds the old values; the PNG-measured table is kept as "reference only, not applied".
- Landing hero collage is now laid out in normal flow (flex/grid with gaps sized for the tilt) instead of absolute offsets, so cards cannot grow into each other. Polygon gap between tilted cards measured at 12 widths from 320 to 1920px: minimum 36px (was overlapping at 375, and at 1024 before this fix). Stack below 1024px, 4-card collage from 1024px.
- Verified: computed font-size / line-height / letter-spacing / weight of 1022 text runs across landing, feed, show, Me, Friends, profile and sign-in at 375 and 1440 match pre-PR #4 except 5 runs that are new elements (screen-reader h1, Reset demo data, Edit profile chip). Lint, build and the a11y audit (0 blocking findings) pass.
- Kept from Batch 3: persistence and Reset demo data, toast queueing, inert dialogs, 44px targets, heading fixes, reduced motion, Edit profile chip, 1024px show-detail layout.

## Session 7: Batch 4, backend-ready frontend and CI (`batch4-api-ci`) - frontend done

- `docs/api-contract.md`: 24 endpoints derived from the mock (method, path, query, DTOs, status codes, error shape `{ code, message, traceId }`, visibility rules, cookie flags, "Mock vs real" table).
- API client switch: `NEXT_PUBLIC_API_BASE_URL` set = real fetch client (`lib/api/http.ts`), unset = mock (default). Same `VouchApi` interface; pages only gate mock-only UI (Open email app button, empty-state link, Reset demo data) on `isMockApi` / `api.demo`. `.env.example` only; `.env*` is ignored.
- Real client auth: access token in memory only, `credentials: "include"` everywhere, refresh cookie httpOnly, one shared refresh + one retry on 401, then clear state and go to `/sign-in`. Checked against a fake `fetch` (`e2e/http-client.spec.ts`), not against a real server.
- Playwright (`@playwright/test`, `frontend/e2e`): smoke tests at 375 and 1440px (`npm run e2e`), API client tests, and the axe audit as a test at 375/1024/1440px (`npm run a11y`, replaces `scripts/a11y-audit.mjs`). Run `npm run build` first; set `PW_CHANNEL=chrome` to use a local Chrome instead of the downloaded Chromium.
- `.github/workflows/ci.yml` (PR and push to main): npm ci, lint, typecheck, build, Playwright, axe; npm cache; report artifact on failure. `.github/dependabot.yml`: npm (frontend) and github-actions, weekly, minor/patch grouped.
- **Your action:** turn on **secret scanning and push protection** in the repo Settings > Code security. I cannot do this from the repo.
- **Next:** backend Story 1 (hand-written by you). The contract in `docs/api-contract.md` is the target; the vouch-exists (409) and `sentLabel` points in its "Mock vs real" table are worth settling first.

## Session 8: Batch 4.1, contract decisions (`batch4.1-contract-decisions`)

- **Two-hop feed:** mock and contract now return direct friends (solid) and friends of friends (existing FoF card, "author · via friend") with `relation: "friend" | "fof"` and `via`; never your own vouches; anticipations still from direct friends. `CLAUDE.md` visibility rule updated to match.
- **Auth cookie** `Path=/auth`; logout is `POST /auth/logout` (client and contract updated). Behind the `/api` proxy the browser-visible path is `/api/auth`, so the backend cookie path must be configurable (documented).
- **409 on duplicate vouch** in the mock; the composer looks up your vouches when you pick a show and opens an existing one in edit mode.
- **Timestamps:** `sentAt` / `joinedAt` ISO strings replace `sentLabel` / `SentInvite.label`; formatted in `lib/format.ts`.
- **Show-kind rule** documented: anime = TMDB genre 16 and origin_country JP, else TV.
- **Averages:** `friendsAverage` (direct) and `networkAverage` (direct + FoF), both on show detail in existing styles.
- **Same-origin proxy:** `next.config.mjs` rewrites `/api/*` to `NEXT_PUBLIC_API_BASE_URL` (must be an absolute http(s) URL); the real client calls `/api`. Checked against a stub backend: path stripping, query, `Authorization`, `Cookie` and `Set-Cookie` all pass through, and session restore works.
- **Lazy mock:** `import("./mock")` on first use, written as a conditional expression so the build drops it when the real API is selected. Verified: with the variable set, no mock code or seed data is in `.next` (client or server).
- Tests: smoke tests for the two-hop feed, edit-mode on duplicate, both averages and formatted times; API client tests for `/auth/logout` and the `/api` base. 33 e2e + 90 axe checks pass.

## Git state

Work lands on `main` through PRs (#1 Session 2, #2 Batch 1, #3 Batch 2).

## Next session
Backend Story 1 (setup). Hand-written by the user; Claude explains and reviews only.
