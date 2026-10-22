# Vouch API contract (v1, derived from the frontend mock)

This is what `frontend/src/lib/api/http.ts` already calls. It was written from the mock in
`frontend/src/lib/api/mock.ts` and the interface in `frontend/src/lib/api/types.ts` (`VouchApi`) as they are
today. If the backend needs to differ, change this file, `types.ts` and `http.ts` together.

**The backend enforces every visibility rule.** The mock does too (it filters in the data layer, never in
components), but the UI must never be the thing that hides data: a response must not contain anything the caller
is not allowed to see.

- Base URL: `NEXT_PUBLIC_API_BASE_URL` (no trailing slash). All paths below are relative to it.
- JSON in and out (`Content-Type: application/json`). Field names are camelCase. Ids are opaque strings.
- Timestamps are ISO 8601 UTC strings (`"2026-10-22T09:30:00Z"`).
- 24 endpoints. "Auth" = needs `Authorization: Bearer <access token>`.

## 1. Conventions

### Error shape

Every non-2xx response has this body (also for 401, 403, 404, 429 and 5xx):

```ts
interface ApiError {
  code: ErrorCode;      // machine readable, stable
  message: string;      // safe to show to the user, short
  traceId: string;      // correlation id; also logged server side
}
type ErrorCode =
  | "invalid"           // 400 / 422  validation failed
  | "unauthenticated"   // 401        missing/expired access token
  | "forbidden"         // 403        authenticated but not allowed
  | "not_found"         // 404        also used for "you may not know this exists" (see visibility)
  | "conflict"          // 409
  | "token_invalid"     // 400        magic-link token unknown or already used
  | "token_expired"     // 410        magic-link token past its 15 minutes
  | "rate_limited"      // 429        send Retry-After (seconds)
  | "server_error";     // 5xx
```

The client turns a response without a parseable body into a code from the status (400 `invalid`, 401
`unauthenticated`, 403 `forbidden`, 404 `not_found`, 409 `conflict`, 410 `token_expired`, 429 `rate_limited`,
5xx `server_error`) and a fetch failure into the client-only code `network`.

**Do not return 401 from the magic-link verify endpoint.** The client treats any 401 on a protected endpoint as
"try a refresh". Verify is unauthenticated, so use 400 `token_invalid` or 410 `token_expired` there.

### Cursor pagination

Paged endpoints take `?cursor=<opaque>&limit=<n>` and return:

```ts
interface Page<T> { items: T[]; nextCursor: string | null }  // null = last page
```

`limit` defaults to 6 and is capped at 50. The cursor is opaque to the client (the mock uses the id of the last
item; use anything stable, e.g. `(createdAt, id)` encoded). Ordering is newest first. Only `GET /feed` is paged.

### Common DTOs

```ts
type ShowKind = "tv" | "anime";

interface User { id: string; handle: string; name: string; tags: string[] }            // the signed-in user only
interface Show { id: string; title: string; kind: ShowKind; year: number; credit: string; releaseLabel?: string }
interface Vouch { id: string; authorId: string; showId: string; rating: number; review: string; tags: string[]; createdAt: string }

/** A user as seen by the viewer. `via` is present exactly when the author is a friend of a friend. */
interface PersonRef { id: string; handle: string; name: string; via?: { id: string; handle: string; name: string } }
interface VouchView { vouch: Vouch; show: Show; author: PersonRef }
interface AnticipationView {
  id: string; show: Show;                                   // show.releaseLabel is set ("Nov 14")
  waiting: { user: PersonRef; linkedVouchId: string }[];    // direct friends only
  joined: boolean;                                          // the viewer already said "Me too"
}
```

Rules for the vouch fields (validated on create and update, 400 `invalid`): `rating` integer 1 to 10, `review`
at most 280 characters (trimmed), at most 5 `tags`, each normalised server side to lowercase, spaces and
underscores to `-`, characters outside `a-z0-9-` dropped, duplicates removed.

### Visibility rules (server enforced)

| Who | What the viewer may see |
| --- | --- |
| Self | everything of their own |
| Direct friend | full profile, all their vouches, author shown by name |
| Friend of friend (FoF) | **only** `name`, avatar initial (derived from name), `via`, shared taste tags. Their vouches appear only on show pages, always with `via` |
| Anyone else (stranger) | does not exist: `404 not_found`, never `403` |

- The **feed contains direct friends only** (plus anticipation cards built from direct friends).
- Friend-of-friend vouches appear **only** in `GET /shows/{id}/network`, with `author.via` set. `via` is a friend
  the viewer has in common with the author (if several, pick one deterministically).
- A vouch is never returned to a viewer who is not at most two hops from its author.
- "Add friend" may only succeed when the eligibility rule says `nominated: true` (below).
- A "Me too" requires a vouch of the viewer's own as the link.

## 2. Authentication

Session model: a short-lived **access token** (JWT, about 15 minutes) kept in memory by the client, and a
long-lived **refresh token** in an httpOnly cookie. The client never writes either to localStorage.

Refresh cookie, set by the server on verify and on every refresh (rotate it each time):

```
Set-Cookie: vouch_refresh=<opaque>; HttpOnly; Secure; SameSite=Lax; Path=/auth/refresh; Max-Age=2592000
```

- `HttpOnly`: not readable by script. `Secure`: HTTPS only (browsers also accept it on `http://localhost`).
  `SameSite=Lax`. `Path=/auth/refresh`: the cookie is sent only to that path, so logout is `DELETE` on the same
  path (otherwise the server could not see the cookie to revoke it).
- Store only a hash of the refresh token, rotate on use, and revoke the whole family if an old one is replayed.
- **Deployment note:** `SameSite=Lax` cookies are not sent on cross-site `fetch` calls. The web app and the API
  must be same-site (for example `app.example.com` and `api.example.com`, or the app proxying `/api` on its own
  origin and `NEXT_PUBLIC_API_BASE_URL=/api`). `vouch-ecru.vercel.app` calling an API on another registrable
  domain will not work. If they are same-site but cross-origin, the API needs CORS with the exact origin (not
  `*`), `Access-Control-Allow-Credentials: true`, and `Authorization, Content-Type` allowed.

Client behaviour (implemented in `http.ts`): every request sends `credentials: "include"`. On a 401 from a
protected endpoint it calls `POST /auth/refresh` once (shared by all requests in flight), then retries the
request once with the new token. If the refresh fails it clears its token and navigates to `/sign-in`.

### 1. `POST /auth/magic-link`

Email a sign-in link. Not authenticated.

```ts
// body
{ email: string; inviteCode?: string }
// 202 Accepted, empty body. Always 202 for a well-formed email, whether or not the account exists
// (no account enumeration). Unknown emails without a valid invite simply get no link, or a "join the waitlist" mail.
```

Errors: 400 `invalid` (malformed email), 429 `rate_limited`. The link points at the web app:
`https://<app>/auth/verify?token=<opaque, single use, 15 minutes>`. The token travels only as that query
parameter; the email address is never put in a URL.

### 2. `POST /auth/magic-link/verify`

Exchange the token for a session. Not authenticated.

```ts
// body
{ token: string }
// 200
{ accessToken: string; expiresIn: number /* seconds */; user: User }
// + Set-Cookie: vouch_refresh=...   (see above)
```

Errors: 400 `token_invalid` (unknown or already used), 410 `token_expired`. Tokens are single use.

### 3. `POST /auth/refresh`

Not authenticated by header; authenticated by the refresh cookie. No body.

```ts
// 200 (same shape as verify) + rotated Set-Cookie
{ accessToken: string; expiresIn: number; user: User }
```

401 `unauthenticated` when the cookie is missing, expired or revoked. The client also uses this call on page load
to restore the session (it has no token yet), so a 401 here is normal for a signed-out visitor and must not be
logged as an error.

### 4. `DELETE /auth/refresh`

Log out: revoke the refresh token and clear the cookie. No body, **204**. Idempotent (204 even without a cookie).

## 3. Waitlist and invites

### 5. `POST /waitlist`  (public)

```ts
{ email: string }   // 202, empty body. 400 invalid, 429 rate_limited
```

### 6. `GET /invites/{code}`  (public)

Preview for the invite landing page. Codes look like `maya-4TLF` (inviter handle, a dash, 4 characters).

```ts
// 200
{ code: string; inviter: { name: string /* first name */; handle: string }; sampleVouches: VouchView[] /* up to 3, the inviter's newest */ }
```

404 `not_found` for an unknown, expired or used-up code. This endpoint is public, so return only what an invitee
may see: the inviter's first name and handle and up to three of their vouches (the inviter agrees to this by
creating an invite). Nothing else about the inviter's network.

### 7. `GET /invites/mine`  (auth)

```ts
{ code: string; url: string /* absolute, https://<app>/i/<code> */; expiresInDays: number }
```

### 8. `GET /invites/sent`  (auth)

```ts
SentInvite[]  // { id: string; name: string; status: "joined" | "waiting"; label: string }
```

`label` is display text in the mock ("Joined 3 weeks ago", "Not joined yet"). See "Mock vs real": prefer
returning `joinedAt` / `sentAt` and letting the client format.

## 4. Friends

### 9. `GET /friends?query=`  (auth)

Direct friends, alphabetical by name (the mock returns insertion order; sort server side). `query` is an optional case-insensitive match on name or handle.

```ts
{ user: User }[]
```

Unpaginated for the MVP (friend lists are small); add the cursor convention later if needed.

### 10. `GET /friends/requests`  (auth)

```ts
{
  incoming: { id: string; user: PersonRef }[];
  outgoing: { id: string; user: PersonRef; sentLabel: string }[];  // sentLabel: "sent today", "sent 3 days ago"
}
```

### 11. `POST /friends/requests`  (auth)

```ts
{ userId: string }
// 201, empty body.
```

Rules: allowed only if `GET /users/{userId}/friend-eligibility` says `nominated: true`, else 403 `forbidden`.
If the target already sent the viewer a request, this **accepts** it instead (the two become friends; return 201
as well). A repeat request is a no-op 201. 404 if the target is not at most two hops away.

### 12. `POST /friends/requests/{id}/accept`  (auth)

Only the recipient. No body, **204**. 404 if not found or not the recipient's. Creates the friendship.

### 13. `POST /friends/requests/{id}/decline`  (auth)

Only the recipient. No body, **204**. 404 otherwise.

### 14. `GET /users/{userId}/friend-eligibility`  (auth)

Whether the viewer may add this friend of a friend.

```ts
// 200
{ eligible: boolean; nominated: boolean; condition?: string }
```

Always `{ eligible: false, nominated: false }` for self, existing friends and non-FoFs (do not reveal whether the
user exists). For a FoF, `nominated` is true when the product rule is met (a mutual friend has nominated the
connection); `condition` is a short sentence explaining what is missing when it is not. The UI shows "Add friend"
only when `nominated` is true, but the server must enforce it on endpoint 11 regardless.

## 5. Shows

Show data comes from TMDB (TV and anime only in the MVP). The backend proxies and caches it; the browser never
talks to TMDB or holds a TMDB key.

### 15. `GET /shows/search?q=&kind=`  (auth)

```ts
Show[]   // up to 8, relevance order. kind = "tv" | "anime" optional.
```

`q` shorter than 3 characters: the client does not call, but the server should return `[]` or 400 `invalid`.
Unreleased shows (`releaseLabel` set) are excluded from search.

### 16. `GET /shows/{id}`  (auth)

```ts
Show      // 404 not_found
```

### 17. `GET /shows/{id}/network`  (auth)

Everything the viewer may see about a show: their friends' vouches and, labelled, friends of friends'.

```ts
interface ShowDetail {
  show: Show;
  friendsAverage: number | null;  // mean rating, one decimal; null when nobody in the network vouched
  friendCount: number;            // direct friends who vouched
  fofCount: number;               // friends of friends who vouched
  direct: VouchView[];            // newest first; author without `via`
  fof: VouchView[];               // newest first; author.via always set
  tags: string[];                 // top 4 tags across direct + fof vouches, most common first
  myVouch: VouchView | null;      // the viewer's own vouch, not included in direct/fof
}
```

The viewer's own vouch is never in `direct`. FoF entries carry only `PersonRef` fields (no profile data beyond
name, handle, `via`).

## 6. Vouches

### 18. `POST /vouches`  (auth)

```ts
// body
{ showId: string; rating: number; review: string; tags: string[] }
// 201
Vouch
```

One vouch per user per show. If the viewer already has one for this show, return **409 `conflict`** (the client
uses `PATCH` to change it). 404 for an unknown `showId`.

### 19. `PATCH /vouches/{id}`  (auth, author only)

```ts
// body (all fields required, same validation as create; showId cannot change)
{ rating: number; review: string; tags: string[] }
// 200
Vouch    // keeps id and createdAt
```

404 if the vouch does not exist **or is not visible to the viewer**; 403 `forbidden` if the viewer can see it
but is not the author.

### 20. `DELETE /vouches/{id}`  (auth, author only)

**204**, empty body. Same 404/403 rules as `PATCH`. Hard delete in the mock; a soft delete is fine as long as
the vouch disappears from every response, including anticipations that linked to it.

### 21. `GET /vouches/mine`  (auth)

```ts
VouchView[]   // the viewer's vouches, newest first, unpaginated for the MVP
```

## 7. Feed and anticipations

### 22. `GET /feed?cursor=&limit=&kind=`  (auth)

The viewer's feed: vouches by **direct friends** and anticipation cards, newest first, paged. `kind` filters both
vouches and anticipations by show kind.

```ts
type FeedItem =
  | { type: "vouch"; id: string; createdAt: string; vouch: VouchView }
  | { type: "anticipation"; id: string; createdAt: string; anticipation: AnticipationView };
// 200
Page<FeedItem>
```

- Vouches by the viewer themself and by friends of friends are **not** in the feed.
- An anticipation card exists for an upcoming show when at least one direct friend is waiting on it (each
  friend's waiting entry must be backed by one of their vouches, "linked vouch"), or when the viewer joined.
- A feed with no items is a valid 200 (`items: []`, `nextCursor: null`); the client shows a "your feed is quiet"
  state for the unfiltered case.

### 23. `POST /anticipations/{id}/me-too`  (auth)

Join an upcoming show's waiting list.

```ts
{ linkedVouchId: string }   // one of the viewer's own vouches, the reason they are in
// 204
```

400 `invalid` if `linkedVouchId` is not a vouch of the viewer's. 404 if the anticipation is not visible to the
viewer. Idempotent.

## 8. Profiles

### 24. `GET /profiles/{handle}`  (auth)

`handle` is case-insensitive. The response depends on the relationship; `relation` discriminates.

```ts
type Profile =
  | {
      relation: "self" | "friend";
      user: User;
      friendCount: number;
      sharedTags: string[];   // tags shared with the viewer (all of the user's tags for self)
      vouches: VouchView[];   // newest first, unpaginated for the MVP
    }
  | {
      relation: "fof";
      user: { id: string; handle: string; name: string };    // nothing else, no tags, no vouches
      via: { id: string; handle: string; name: string };
      sharedTags: string[];
      eligibility: Eligibility;                             // as endpoint 14
      requestState: "none" | "incoming" | "outgoing";       // pending friend request between the two
    };
```

A stranger (or unknown handle) is `404 not_found`, indistinguishable from a handle that does not exist. For
`fof`, `eligibility` is the same value endpoint 14 would return.

## 9. Mock vs real

What the mock fakes or simplifies, and what the real backend must do differently:

| Area | Mock | Real |
| --- | --- | --- |
| Magic link | `devMagicLinkToken(email)` stands in for the email; the "Open email app" button exists only with the mock. Tokens live in memory | Email delivery, single-use 15-minute tokens, no dev token, no button |
| Session | Email kept in `localStorage` (`vouch.session`); any email signs in as the same demo user | Access token in memory + httpOnly refresh cookie. `getSession` = `POST /auth/refresh` |
| Accounts | Any email works; `empty@vouch.test` gives an empty network | Invite-only; unknown email + no valid invite gets no account |
| Latency and failures | Fixed `setTimeout` delays; `?fail=1`, `?fail=once`, `?fail=more`, `?empty=...` dev flags | Real network. The dev flags do not exist; the UI error states are reached by real failures |
| Persistence | Whole state in `localStorage` (`vouch.demo.v1`); "Reset demo data" button | Database. The reset button is hidden when `NEXT_PUBLIC_API_BASE_URL` is set (the real client has no `demo`) |
| Ids | Readable (`s_frieren`, `u_maya`, `v101`) | Opaque; show ids probably `tv:<tmdbId>`. The UI never parses ids |
| Shows | A fixed catalogue of ~20 shows; `search` is a substring match | TMDB proxy with caching; kind (`tv` vs `anime`) is **derived** (e.g. TMDB TV + Japanese animation genre), not stored. Decide the rule |
| Duplicate vouch | `POST /vouches` for a show you already vouched silently replaces it | 409 `conflict`; the client edits with `PATCH`. The composer's "search then pick an already-vouched show" path will show an error unless the UI is changed to open it in edit mode |
| Display strings | `sentLabel` ("sent 3 days ago") and `SentInvite.label` ("Joined 3 weeks ago") are built in the mock | Better to return timestamps and format on the client; these two fields are the only presentation text in the DTOs |
| Friends' average | Mean over direct **and** FoF vouches, though the field is called `friendsAverage` | Product decision: keep, or average direct friends only |
| `limit` / lists | Feed default 6; friends, `vouches/mine` and profile vouches are unpaginated | Same for the MVP; add cursors when lists get long |
| Invite codes | `<handle>-<4 chars>`, parsed by regex; `mine` returns `<handle>-7QK2` always | Random, stored, expiring, single or multi use as decided |
| Nomination | `eligibility` is a hard-coded table in `mock-data.ts` (who is nominated, and the `condition` text) | The real nomination rule (user stories). The `condition` string should be written for display |
| Anticipations | Seeded; `Me too` adds the viewer to `waiting` | Created when a show is announced with a release date; kept in sync with TMDB |
| Taste tags | Hand-written per user | Derived from a user's vouch tags (most used) |
| Rate limiting, CSRF | None | Rate limits on `/auth/magic-link`, `/waitlist`, `/auth/refresh`. The refresh cookie is `SameSite=Lax` and the endpoint only accepts `POST`, which is CSRF-safe for a same-site deployment |
