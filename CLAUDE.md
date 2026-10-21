# Vouch: context for Claude

Vouch is an invite-only recommendations app: you see vouches (rating /10 + short review + tags) from your direct friends, and clearly-labelled vouches from friends of friends.

## MVP
- Shows only: TV and anime via TMDB. Film, Book and Food are "Coming soon" (disabled). Spaces and Plans tabs are "Coming soon".
- Shows uses the lavender field (#B9A7FF).

## Rules
- **Never write backend code unless the user asks.** Explain and review instead. The backend is hand-written by the user; the frontend is AI-assisted.
- **`docs/design/` is the design source of truth** (Figma exports as PNG). Build screens from these only; never guess designs. If something is unclear, ask.
- `docs/VouchUserStories.pdf` / `VouchUserStoriesLive.txt` describe product behaviour only. Ignore their frontend design specs and timeline.
- **Update `PROGRESS.md` at the end of every session.**
- Frontend talks to the API only through `frontend/src/lib/api` (one interface, mock now, real later).

## Visibility rules
- Direct-friend cards show the author. Friend-of-friend cards show "author · via friend".
- FoF profiles show only name, avatar, via and shared tags. Strangers: not found.
- The feed contains direct friends only.
- Add-friend is shown only when eligibility returns `nominated: true`.
- Anticipations require a linked vouch.
