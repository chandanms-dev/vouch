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

## Contrast rules from Foundations (applied)

- Placeholder on paper inputs: ink at 65% (5.42:1), not 50%.
- Unselected composer score circles and Me-too rows: 2px mist outline (8.24:1).
- FoF / anticipation outlines use the field colour on surface (7.04 to 11.39:1).
- Film (lavender), Place (sky) and Anime (pink) are close in lightness: always pair colour with the glyph and word label.

## Still unconfirmed (not in Foundations)

1. Type sizes, line heights and weights above.
2. Radius and shadow values (none visible; shadows assumed none).
3. Hover/pressed/disabled colours.
