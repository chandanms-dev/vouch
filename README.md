# Vouch

Recommendations from people you actually know. Vouch is an invite-only app where you rate things out of 10, say why in your own words, and your friends (and, clearly labelled, their friends) see it. Every vouch shows its path: a friend's card is solid and full colour; a friend-of-a-friend's card is dashed and quieter and always says who connects you. You never borrow taste from a stranger.

## MVP scope

- **Shows only**: TV and anime, searched via TMDB.
- Film, Book and Food are **coming soon** (visible but disabled in the UI).
- Spaces and Plans are **coming soon**.
- Magic-link auth, invites, friends and requests, vouches, a direct-friends feed, profiles, and "Me too" anticipations.

## Stack

- Frontend: Next.js 14 (App Router), TypeScript (strict), Tailwind CSS. Bricolage Grotesque for titles and scores, Nunito Sans for body.
- Backend: ASP.NET / C#, PostgreSQL (not started; see `docs/VouchUserStories.pdf`).
- The frontend currently runs on a mock API (`frontend/src/lib/api`) behind a single interface so the real API can replace it.

## Layout

```
frontend/      Next.js app (prototype on mock API)
backend/       Backend (empty for now)
docs/          User stories (product behaviour only) and Foundations.pdf (colour and contrast)
docs/design/   Figma exports, the design source of truth, and tokens.md
PROGRESS.md    Session-by-session progress log
CLAUDE.md      Context for AI sessions
```

## Running the frontend

```bash
cd frontend
npm install
npm run dev
```

## How it is built

The frontend is AI-assisted (Claude Code, built from the design exports). The backend is hand-written.
