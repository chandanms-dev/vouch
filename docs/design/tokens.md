# Design tokens

> **Source.** Colours are confirmed against `docs/Foundations.pdf` (they match the values first sampled from the PNGs). Foundations contains only colour and contrast; it has **no type scale, radii or interaction states**, so those remain measured estimates (see "Still unconfirmed").

## Colour

| Token | Hex | Where it appears |
| --- | --- | --- |
| `ink` | `#0E1633` | Foundations "Ground" (ink 900). App background, text on coloured cards |
| `surface` | `#1A2550` | Sidebar, tab bar, FoF card fill, sheets, list rows |
| `raised` | `#2A376E` | Foundations "Surface high" (ink 700). Inputs, active nav pill, tag pills on dark, skeleton blocks |
| `edge` | `#263163` | Subtle hairlines on dark (minor) |
| `cream` | `#FBF7EC` | Foundations "Paper". Primary buttons, score badge, light tag pills, avatar |
| `muted` | `#B9C1DD` | Foundations "Mist" / muted text. 9.93:1 on ground, 8.24:1 on surface, 6.28:1 on surface high |
| `lavender` | `#B9A7FF` | **Shows field** (TV); formerly "Film" in the design |
| `lime` | `#C8F23D` | Book field, "Coming soon" labels, count pills, Joined/invite card |
| `pink` | `#FF9FD0` | Anime field |
| `sky` | `#84D0FF` | Place (Food) field, error illustration |

Cards: friends = solid field colour, ink text. Friends-of-friends = `surface` fill, 2px border in the field colour, light text, dashed "via" pill. Anticipations = `surface` fill, dashed 2px border in the field colour.

## Fonts

- **Bricolage Grotesque** (700/800): wordmark, titles, scores.
- **Nunito Sans** (400/600/700/800): body, buttons, meta.

Self-hosted in `frontend/src/app/fonts/` (variable woff2, latin subset, loaded with `next/font/local`; the OG image uses the static `BricolageGrotesque-800.ttf` because satori cannot read woff2). Both families are SIL Open Font License.

## Type scale (applied)

The app uses the earlier estimates below, kept because the measured values (next section) looked worse in the real UI. Named styles in `frontend/tailwind.config.ts`: `text-hero` 72/72, `text-hero-sm` 44/44, `text-h1` 32/36, `text-h2` 24/28, `text-card` 22/28, `text-meta` 12/16, `text-tag` 13/16. Other sizes use Tailwind's defaults (`text-sm` 14/20, `text-base` 16/24, `text-lg` 18/28, `text-xl` 20/28, `text-2xl` 24/32) or an explicit `text-[Npx]` with `leading-*` and `tracking-*`, exactly as before PR #4.

| Role | Font | Size / line | Weight |
| --- | --- | --- | --- |
| Landing hero (desktop) | Bricolage | 76 / 72, -0.03em | 800 |
| Landing hero (mobile) | Bricolage | 44 / 44 | 800 |
| Section title (landing) | Bricolage | 44 / 44 desktop, 36 / 40 mobile | 800 |
| Page title (desktop feed, FoF name) | Bricolage | 44 / 48, tight | 800 |
| Profile name, Me | Bricolage | 36 / 40, tight | 800 |
| Show title | Bricolage | 34 / 36 mobile, 56 / 56 desktop | 800 |
| Section title (show detail) | Bricolage | 28 / 32 mobile, 32 / 36 desktop | 800 |
| Card title | Bricolage | 22 / 28 | 800 |
| Score | Bricolage | 28 (small 20) | 800 |
| Body / review | Nunito Sans | 16 / 24 | 400 |
| Meta line, timestamps | Nunito Sans | 12 / 16 | 400 |
| Tag pill | Nunito Sans | 13 / 16 | 600 |
| Button | Nunito Sans | 16 / 24 | 800 |
| Badge | Nunito Sans | 13 / 16 | 800 |

## Measured type scale (reference only, not applied)

> **Measured from the PNG exports, not from Figma** (Figma MCP was unavailable). Method: ink bounding boxes (width and height) of known strings in `02 Feed`, `04 Content detail`, `Me`, `Button`, `Desktop/Feed 1440` and `Desktop/Content detail 1440` (all at 1x), matched against the same strings rendered in Chrome with Bricolage Grotesque / Nunito Sans at 100px. Sizes are good to about ±1px (anti-aliasing adds roughly 1px to every edge, so ambiguous values were rounded down). Line heights were **not measurable** from glyph boxes except for the 24px review pitch; the rest keep the earlier estimates. Display tracking is inferred from width versus height and is the least certain value. **These values are not used by the app.** They were applied in PR #4 and reverted: the measured sizes looked worse in the real UI (cramped card titles, tighter line heights, landing collage cards touching), because the exports are PNGs at 1x and the line heights and tracking could not be measured. The names in the table are not defined in `tailwind.config.ts`.

| Style (`text-*`) | Font / weight | Size / line | Tracking | Used for | Measured as |
| --- | --- | --- | --- | --- | --- |
| `display` | Bricolage 800 | 60 / 60 | -0.03em | Show title, desktop detail panel | 57.6 (w) to 61.5 (h) |
| `page` | Bricolage 800 | 44 / 48 | -0.03em | Desktop page title ("Your feed"), FoF name | 39.8 (w) to 44.6 (h) |
| `h1` | Bricolage 800 | 32 / 36 | -0.02em | Profile name, show title (mobile), error/404 titles | 30 (w) to 32.4 (h) |
| `h2` | Bricolage 800 | 24 / 28 | -0.02em | Section titles ("Your friends", "Friends of friends"), sheet titles | 20.6 (w) to 23.4 (h) |
| `card` | Bricolage 800 | 22 / 28 | -0.025em | Vouch and anticipation card title | 20.8 (w) to 22.1 (h) |
| `h3` | Bricolage 800 | 20 / 24 | -0.01em | "My taste", "My vouches" | 17.5 (w) to 19 (h) |
| `stat` | Bricolage 800 | 56 / 56 | -0.03em | Friends' average, large avatar initial | 52 (w) to 55.7 (h) |
| `stamp` | Bricolage 800 | 28 / 28 | none | Rating stamp number (small stamp `stamp-sm` 20 / 20, estimate) | 29.3 (w), 28.6 (h) |
| `body` | Nunito Sans 400 | 16 / 24 | none | Review text; buttons use it at 800 | 16.0 (w), 16.7 (h); line pitch 24px |
| `body-sm` | Nunito Sans 400 | 15 / 20 | none | Subtitle, show meta line, handle | 15.0 to 15.7 |
| `label` | Nunito Sans 700 | 14 / 20 | none | Author name, nav, Back, small buttons (800) | 14.0 to 14.6 |
| `chip` | Nunito Sans 800 | 14 / 16 | none | Type badge, "Upcoming" | 13.5 to 14.3 |
| `meta` | Nunito Sans 400 | 13 / 16 | none | Card meta line, timestamps, counts | 13.0 to 13.5 |
| `tag` | Nunito Sans 600 (800 on filter chips) | 13 / 16 | none | Tag pills, filter chips | 13.0 to 13.4 |
| `micro` | Nunito Sans 800 | 11 / 12 | none | "Coming soon", count pills | 11.1 to 12.1 |
| `lead` | Nunito Sans 400 | 18 / 28 | none | Landing intro copy (**not measured**) | estimate |

Marketing-only styles used on the landing page and **not measured** from a screen export: `hero` 76/72, `hero-md` 64/60, `hero-sm` 44/44, `title` 40/44 (auth titles), `heading` 36/40, `stamp-lg` 48, `logo` 32 (wordmark in app chrome), `wordmark` 96, `ghost` 300 and `ghost-sm` 132 (decorative word). Buttons: 52px pill, `body` at 800 (small: `label` at 800).

Differences versus the applied (older) values: card meta and timestamps were 12px, measured 13; type badge was 13, measured 14; section titles were 28/32 on mobile and 32/36 on desktop, measured 24 on both (the desktop export matches mobile); show title on desktop was 56, measured 60; profile name was 36, measured 32.

## Shape and spacing

- Vouch card radius 24, padding 16 (mobile) to 16 (desktop). Pills fully rounded. Buttons fully rounded, 52px tall (small 36px).
- Score badge: cream rounded square (radius ~16), 56px (small 40px), tilted about -6deg on field cards.
- Tag pills on profiles tilt +/-2deg.
- Mobile gutter 16-24px. Desktop sidebar 240px, content max-width ~1160px.

## Contrast rules from Foundations (applied)

- Placeholder on paper inputs: ink at 65% (5.42:1), not 50%.
- Unselected composer score circles and Me-too rows: 2px mist outline (8.24:1).
- FoF / anticipation outlines use the field colour on surface (7.04 to 11.39:1).
- Film (lavender), Place (sky) and Anime (pink) are close in lightness: always pair colour with the glyph and word label.

## Still unconfirmed (not in Foundations)

1. Type sizes, line heights and tracking are estimates; the PNG-measured set is kept only as a reference.
2. Radius and shadow values (none visible; shadows assumed none).
3. Hover/pressed/disabled colours.
