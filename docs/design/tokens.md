# Design tokens

> **Source caveat.** The "Foundations" export is not in `docs/design/`, so none of these values were read from a spec. Colours were **sampled pixel-exact** from the component and screen PNGs (dominant fill colours). Fonts were named in the brief. **Type sizes are measured estimates** from the 390px and 1440px exports and must be confirmed against Foundations (see "Needs confirmation").

## Colour

| Token | Hex | Where it appears |
| --- | --- | --- |
| `ink` | `#0E1633` | App background, text on coloured cards |
| `surface` | `#1A2550` | Sidebar, tab bar, FoF card fill, sheets, list rows |
| `raised` | `#2A376E` | Inputs, active nav pill, tag pills on dark, skeleton blocks |
| `edge` | `#263163` | Subtle hairlines on dark (minor) |
| `cream` | `#FBF7EC` | Primary buttons, score badge, light tag pills, avatar |
| `muted` | `#B9C1DD` | Secondary text on dark (sampled) |
| `lavender` | `#B9A7FF` | **Shows field** (TV); formerly "Film" in the design |
| `lime` | `#C8F23D` | Book field, "Coming soon" labels, count pills, Joined/invite card |
| `pink` | `#FF9FD0` | Anime field |
| `sky` | `#84D0FF` | Place (Food) field, error illustration |

Cards: friends = solid field colour, ink text. Friends-of-friends = `surface` fill, 2px border in the field colour, light text, dashed "via" pill. Anticipations = `surface` fill, dashed 2px border in the field colour.

## Fonts

- **Bricolage Grotesque** (700/800): wordmark, titles, scores.
- **Nunito Sans** (400/600/700/800): body, buttons, meta.

## Type scale (estimates, px)

| Role | Font | Size / line | Weight |
| --- | --- | --- | --- |
| Landing hero (desktop) | Bricolage | 72 / 72 | 800 |
| Landing hero (mobile) | Bricolage | 44 / 44 | 800 |
| Section title | Bricolage | 40 / 40 desktop, 32 mobile | 800 |
| Page title | Bricolage | 32 / 36 | 800 |
| Card title | Bricolage | 22 / 28 | 800 |
| Score | Bricolage | 28 (small 20) | 800 |
| Body / review | Nunito Sans | 16 / 24 | 400 |
| Meta line | Nunito Sans | 12 / 16 | 400 |
| Tag pill | Nunito Sans | 13 / 16 | 600 |
| Button | Nunito Sans | 16 / 24 | 800 |
| Badge | Nunito Sans | 13 | 800 |

## Shape and spacing

- Vouch card radius 24, padding 16 (mobile) to 16 (desktop). Pills fully rounded. Buttons fully rounded, 52px tall (small 36px).
- Score badge: cream rounded square (radius ~16), 56px (small 40px), tilted about -6deg on field cards.
- Tag pills on profiles tilt +/-2deg.
- Mobile gutter 16-24px. Desktop sidebar 240px, content max-width ~1160px.

## Needs confirmation (Foundations missing)

1. Exact type sizes/line heights and weights above.
2. Muted text opacity/colour on dark (sampled `#B9C1DD`; used at lower opacity in places).
3. Radius and shadow values (none visible; shadows assumed none).
4. Hover/pressed/disabled colours (not shown in exports).
