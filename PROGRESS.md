# Progress

## Session 1: repo setup and frontend prototype

**Done**
- Private GitHub repo `vouch` created; `main` pushed.
- Repo structure, `.gitignore`, README, CLAUDE.md. Figma exports in `docs/design/` (`components/`, `screens/`), user stories in `docs/`.
- `docs/design/tokens.md` and Tailwind theme (colours sampled from the PNGs).
- Frontend prototype (Next.js 14, TS strict, Tailwind) on a mock API behind one interface (`frontend/src/lib/api`): landing, sign-in, magic-link check/expired/verify, invite, feed (cursor pagination, filters, empty/loading/error), show detail, profiles (self/friend/FoF/stranger), friends (friends/requests/invite), me, composer sheet (2 steps), Me-too sheet, Spaces/Plans "Coming soon".
- `npm run lint` and `npm run build` pass with zero errors.

**Prototype tips**: sign in as `chandan@email.com` for the full network; any other email gives an empty ("quiet") feed. "Open email app" simulates tapping the link; "simulate an expired link" shows the expired screen. Invite code example: `maya-4TLF`. Data resets on reload except the session.

**Open issues**
1. **Foundations export missing** from `docs/design/`. Colours were sampled from pixels; type sizes, radii and hover/disabled states are estimates. See `docs/design/tokens.md` "Needs confirmation".
2. **Design vs MVP scope.** Exports show Film, Book and Place cards, chips and copy (landing, invite, splash, empty feed). Shows-only data is used in the app; the illustrations and landing/invite copy follow the export as drawn. Decide whether to redraw them for Shows (TV = lavender, Anime = pink). Feed filter chips are All / TV / Anime (export: All / Film / Book / Anime / Place).
3. No export for: Edit profile, Make a plan (button shown disabled), desktop auth/invite screens (mobile layout used, centred), desktop Friends/Me/profile (follow the feed/detail pattern), Sign out (added on Me for the prototype), profile taste-tag highlighting (shared = cream, others = muted).
4. Impeccable audit (390 and 1440), report only, nothing fixed:
   - P1: sheets have no focus trap and the page behind is not inert. Close and Back targets are under 44px (chips 32px, Back 40px, tags/small buttons 28-36px).
   - P1: reduced-motion CSS uses a global 1ms duration kill; no intentional alternative.
   - P2: placeholder contrast on cream inputs is 3.3:1 (needs 4.5:1).
   - P2: heading order: landing and mobile feed go h1/none to h3 (cards); mobile feed has no h1.
   - P2: landing/sign-in collages use fixed pixel widths and overflow below about 360px.
   - P2: CSS-column masonry reflows when more feed items load.
   - P3: `will-change-transform` left on the sheet at rest; a few hard-coded hex values in `globals.css`; detector "straggler" advisories on landing copy.
5. Mock data only: no real TMDB, email or persistence.

## Next session
Backend Story 1 (setup). Hand-written by the user; Claude explains and reviews only.
