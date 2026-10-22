import {
  ApiError,
  type AnticipationView,
  type CreateVouchInput,
  type Eligibility,
  type FeedItem,
  type PersonRef,
  type Profile,
  type Session,
  type Show,
  type ShowKind,
  type UpdateVouchInput,
  type User,
  type Vouch,
  type VouchApi,
  type VouchView,
} from "./types";
import * as seed from "./mock-data";

/**
 * In-memory implementation of VouchApi. It enforces the visibility rules the
 * real backend must enforce (the UI never filters for privacy):
 *  - feed: two hops: direct friends, and friends of friends with `via` (anticipations from direct friends only)
 *  - friend-of-friend authors always carry `via`
 *  - friend-of-friend profiles expose name, via and shared tags only
 *  - strangers: not_found
 *  - add-friend requires eligibility.nominated === true
 *  - anticipations require a linked vouch owned by the viewer
 */

const SESSION_KEY = "vouch.session";

const users: User[] = seed.users.map((u) => ({ ...u }));
const friendships: [string, string][] = seed.friendships.map(([a, b]) => [a, b]);
const vouches: Vouch[] = seed.vouches.map((v) => ({ ...v }));
const shows: Show[] = seed.shows.map((s) => ({ ...s }));
const anticipations = seed.anticipations.map((a) => ({
  ...a,
  waiting: a.waiting.map((w) => ({ ...w })),
}));
const requests = seed.initialRequests.map((r) => ({ ...r }));
const joinedAnticipations = new Set<string>();

let viewerId: string | null = null;
let idCounter = 100;

// ---------- persistence ----------

/**
 * Demo state lives in localStorage so vouches, edits, deletes, friendships and
 * sign-in survive a refresh. Every storage call is guarded: if storage is
 * unavailable the mock keeps working in memory only.
 */
const STATE_KEY = "vouch.demo.v1";
let hydrated = false;

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STATE_KEY);
    if (!raw) return;
    const s = JSON.parse(raw) as Record<string, unknown>;
    if (!Array.isArray(s.vouches) || !Array.isArray(s.users)) return;
    users.splice(0, users.length, ...(s.users as User[]));
    vouches.splice(0, vouches.length, ...(s.vouches as Vouch[]));
    friendships.splice(0, friendships.length, ...(s.friendships as [string, string][]));
    requests.splice(0, requests.length, ...(s.requests as typeof requests));
    anticipations.splice(0, anticipations.length, ...(s.anticipations as typeof anticipations));
    joinedAnticipations.clear();
    (s.joined as string[]).forEach((j) => joinedAnticipations.add(j));
    idCounter = Math.max(idCounter, Number(s.idCounter) || 0);
  } catch {
    /* corrupt or unavailable: keep the seed data */
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STATE_KEY,
      JSON.stringify({ users, vouches, friendships, requests, anticipations, joined: [...joinedAnticipations], idCounter }),
    );
  } catch {
    /* storage full or blocked: stay in memory */
  }
}

const wait = (ms = 220) => {
  hydrate();
  return new Promise<void>((r) => setTimeout(r, ms));
};
const nextId = (p: string) => `${p}${++idCounter}`;

// ---------- dev flags ----------

/**
 * Prototype switches, read from the URL once per page load and kept for the tab:
 *  ?fail=1      every data call (feed, detail, profile, search, my vouches) fails; ?fail=0 clears it
 *  ?fail=once   only the next such call fails, so Retry works
 *  ?fail=more   only "load more" on the feed fails (cursor pages)
 *  ?empty=tv | anime | vouches   feed filter / profile vouch lists come back empty; ?empty=0 clears it
 */
const DEV_PREFIX = "vouch.dev.";
let devParsed = false;

function devFlag(name: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    if (!devParsed) {
      devParsed = true;
      const params = new URLSearchParams(window.location.search);
      for (const key of ["fail", "empty"]) {
        const v = params.get(key);
        if (v === null) continue;
        if (v === "0" || v === "") window.sessionStorage.removeItem(DEV_PREFIX + key);
        else window.sessionStorage.setItem(DEV_PREFIX + key, v);
      }
    }
    return window.sessionStorage.getItem(DEV_PREFIX + name);
  } catch {
    return null;
  }
}

function failIfRequested() {
  const f = devFlag("fail");
  if (!f || f === "more") return;
  if (f === "once") window.sessionStorage.removeItem(DEV_PREFIX + "fail");
  throw new ApiError("network", "Simulated network failure");
}

// ---------- session helpers ----------

function readStoredEmail(): string | null {
  try {
    return window.localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}
function storeEmail(email: string | null) {
  try {
    if (email) window.localStorage.setItem(SESSION_KEY, email);
    else window.localStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage unavailable */
  }
}

function userForEmail(email: string): User {
  const clean = email.trim().toLowerCase();
  // Prototype: any email gets the full demo network, except the empty-state address.
  if (clean !== seed.EMPTY_EMAIL) return users.find((u) => u.id === seed.ME_ID)!;
  const local = clean.split("@")[0] ?? "you";
  const handle = local.replace(/[^a-z0-9]/g, "") || "you";
  const existing = users.find((u) => u.handle === handle && u.id.startsWith("u_new_"));
  if (existing) return existing;
  const user: User = {
    id: `u_new_${handle}`,
    handle,
    name: handle.charAt(0).toUpperCase() + handle.slice(1),
    tags: [],
  };
  users.push(user);
  persist();
  return user;
}

function requireViewer(): User {
  if (!viewerId) {
    const stored = readStoredEmail();
    if (stored) viewerId = userForEmail(stored).id;
  }
  const u = users.find((x) => x.id === viewerId);
  if (!u) throw new ApiError("unauthenticated");
  return u;
}

/** Opaque one-time tokens, as the backend would issue: token -> email. */
const magicTokens = new Map<string, string>();
const latestTokenByEmail = new Map<string, string>();

function issueToken(email: string): string {
  const clean = email.trim().toLowerCase();
  const token = `mock-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  magicTokens.set(token, clean);
  latestTokenByEmail.set(clean, token);
  return token;
}

/** Dev helper: stands in for the link in the email the backend would send. The URL carries only the opaque token. */
export function devMagicLinkToken(email: string, state: "valid" | "expired" = "valid"): string {
  if (state === "expired") return "expired";
  return latestTokenByEmail.get(email.trim().toLowerCase()) ?? "invalid";
}

// ---------- graph helpers ----------

const friendIds = (id: string): string[] =>
  friendships.flatMap(([a, b]) => (a === id ? [b] : b === id ? [a] : []));
const areFriends = (a: string, b: string) => friendIds(a).includes(b);
const userById = (id: string): User => users.find((u) => u.id === id)!;
const showById = (id: string): Show => {
  const s = shows.find((x) => x.id === id);
  if (!s) throw new ApiError("not_found");
  return s;
};

/** First direct friend of `viewer` who is also friends with `other`. */
function viaFriend(viewer: string, other: string): User | null {
  for (const f of friendIds(viewer)) if (areFriends(f, other)) return userById(f);
  return null;
}

function personFor(viewer: string, id: string): PersonRef | null {
  const u = userById(id);
  if (id === viewer) return { id, handle: u.handle, name: u.name };
  if (areFriends(viewer, id)) return { id, handle: u.handle, name: u.name };
  const via = viaFriend(viewer, id);
  if (via) return { id, handle: u.handle, name: u.name, via: { id: via.id, handle: via.handle, name: via.name } };
  return null; // stranger: never exposed
}

function toView(viewer: string, v: Vouch): VouchView | null {
  const author = personFor(viewer, v.authorId);
  if (!author) return null;
  return { vouch: v, show: showById(v.showId), author };
}

const byNewest = (a: { createdAt: string }, b: { createdAt: string }) =>
  b.createdAt.localeCompare(a.createdAt);

function firstName(name: string) {
  return name.split(" ")[0] ?? name;
}

function anticipationView(viewer: string, a: (typeof anticipations)[number]): AnticipationView | null {
  const direct = friendIds(viewer);
  const waiting = a.waiting
    .filter((w) => direct.includes(w.userId))
    .flatMap((w) => {
      const user = personFor(viewer, w.userId);
      return user ? [{ user, linkedVouchId: w.linkedVouchId }] : [];
    });
  if (waiting.length === 0 && !joinedAnticipations.has(`${viewer}:${a.id}`)) return null;
  return {
    id: a.id,
    show: showById(a.showId),
    waiting,
    joined: joinedAnticipations.has(`${viewer}:${a.id}`),
  };
}

function normaliseTag(t: string) {
  return t.trim().toLowerCase().replace(/[\s_]+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function validateVouchInput(input: UpdateVouchInput): string[] {
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 10) {
    throw new ApiError("invalid", "Rating must be 1 to 10");
  }
  if (input.review.length > 280) throw new ApiError("invalid", "Review is too long");
  const tags = [...new Set(input.tags.map(normaliseTag).filter(Boolean))];
  if (tags.length > 5) throw new ApiError("invalid", "Max 5 tags");
  return tags;
}

// ---------- API ----------

export const mockApi: VouchApi = {
  auth: {
    async requestMagicLink(email) {
      await wait(500);
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) throw new ApiError("invalid", "Enter a valid email");
      issueToken(email);
    },
    async verifyMagicLink(token) {
      await wait(500);
      if (token === "expired") throw new ApiError("token_expired");
      const email = magicTokens.get(token);
      if (!email) throw new ApiError("token_invalid");
      magicTokens.delete(token); // links work once
      const user = userForEmail(email);
      viewerId = user.id;
      storeEmail(email);
      return { user } satisfies Session;
    },
    async getSession() {
      await wait(60);
      try {
        return { user: requireViewer() };
      } catch {
        return null;
      }
    },
    async signOut() {
      viewerId = null;
      storeEmail(null);
    },
  },

  demo: {
    async reset() {
      await wait(150);
      try {
        window.localStorage.removeItem(STATE_KEY);
      } catch {
        /* nothing stored */
      }
      users.splice(0, users.length, ...seed.users.map((u) => ({ ...u })));
      friendships.splice(0, friendships.length, ...seed.friendships.map(([a, b]): [string, string] => [a, b]));
      vouches.splice(0, vouches.length, ...seed.vouches.map((v) => ({ ...v })));
      anticipations.splice(0, anticipations.length, ...seed.anticipations.map((a) => ({ ...a, waiting: a.waiting.map((w) => ({ ...w })) })));
      requests.splice(0, requests.length, ...seed.initialRequests.map((r) => ({ ...r })));
      joinedAnticipations.clear();
    },
  },

  waitlist: {
    async join(email) {
      await wait(450);
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) throw new ApiError("invalid", "Enter a valid email");
    },
  },

  invites: {
    async preview(code) {
      await wait();
      const m = /^([a-z0-9]+)-[a-z0-9]{4}$/i.exec(code);
      const inviter = m ? users.find((u) => u.handle === m[1]!.toLowerCase() && !u.id.startsWith("u_new_")) : undefined;
      if (!inviter) throw new ApiError("not_found");
      const own = vouches
        .filter((v) => v.authorId === inviter.id)
        .sort(byNewest)
        .slice(0, 3)
        .map((v) => ({
          vouch: v,
          show: showById(v.showId),
          author: { id: inviter.id, handle: inviter.handle, name: inviter.name },
        }));
      return {
        code,
        inviter: { name: firstName(inviter.name), handle: inviter.handle },
        sampleVouches: own,
      };
    },
    async mine() {
      await wait(120);
      const me = requireViewer();
      const code = `${me.handle}-7QK2`;
      return { code, url: `vouch.app/i/${code}`, expiresInDays: 7 };
    },
    async sent() {
      await wait(150);
      const me = requireViewer();
      if (me.id !== seed.ME_ID) return [];
      const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();
      return [
        { id: "i1", name: "Maya Rao", status: "joined" as const, sentAt: daysAgo(25), joinedAt: daysAgo(22) },
        { id: "i2", name: "Sam Okafor", status: "joined" as const, sentAt: daysAgo(18), joinedAt: daysAgo(15) },
        { id: "i3", name: "Ana Duarte", status: "waiting" as const, sentAt: daysAgo(4) },
      ];
    },
  },

  friends: {
    async list(query) {
      await wait(150);
      failIfRequested();
      const me = requireViewer();
      const q = query?.trim().toLowerCase();
      return friendIds(me.id)
        .map(userById)
        .filter((u) => !q || u.name.toLowerCase().includes(q) || u.handle.includes(q))
        .map((user) => ({ user }));
    },
    async requests() {
      await wait(150);
      failIfRequested();
      const me = requireViewer();
      const incoming = requests
        .filter((r) => r.toId === me.id)
        .flatMap((r) => {
          const user = personFor(me.id, r.fromId);
          return user ? [{ id: r.id, user }] : [];
        });
      const outgoing = requests
        .filter((r) => r.fromId === me.id)
        .flatMap((r) => {
          const user = personFor(me.id, r.toId);
          return user ? [{ id: r.id, user, sentAt: r.createdAt }] : [];
        });
      return { incoming, outgoing };
    },
    async accept(requestId) {
      await wait(200);
      const me = requireViewer();
      const i = requests.findIndex((r) => r.id === requestId && r.toId === me.id);
      if (i < 0) throw new ApiError("not_found");
      const r = requests[i]!;
      requests.splice(i, 1);
      if (!areFriends(r.fromId, r.toId)) friendships.push([r.fromId, r.toId]);
      persist();
    },
    async decline(requestId) {
      await wait(150);
      const me = requireViewer();
      const i = requests.findIndex((r) => r.id === requestId && r.toId === me.id);
      if (i < 0) throw new ApiError("not_found");
      requests.splice(i, 1);
      persist();
    },
    async sendRequest(userId) {
      await wait(200);
      const me = requireViewer();
      const elig = await mockApi.friends.eligibility(userId);
      if (!elig.nominated) throw new ApiError("forbidden", "Not nominated");
      // An incoming request from them is simply accepted.
      const incoming = requests.find((r) => r.fromId === userId && r.toId === me.id);
      if (incoming) return mockApi.friends.accept(incoming.id);
      if (requests.some((r) => r.fromId === me.id && r.toId === userId)) return;
      requests.push({ id: nextId("r"), fromId: me.id, toId: userId, createdAt: new Date().toISOString() });
      persist();
    },
    async eligibility(userId): Promise<Eligibility> {
      await wait(80);
      const me = requireViewer();
      if (userId === me.id || areFriends(me.id, userId) || !viaFriend(me.id, userId)) {
        return { eligible: false, nominated: false };
      }
      const rec = seed.eligibility[userId];
      if (!rec) return { eligible: false, nominated: false };
      return { eligible: true, nominated: rec.nominated, condition: rec.condition };
    },
  },

  shows: {
    async search(query, kind?: ShowKind) {
      await wait(260);
      failIfRequested();
      const q = query.trim().toLowerCase();
      if (!q) return [];
      return shows
        .filter((s) => !s.releaseLabel)
        .filter((s) => (!kind || s.kind === kind) && s.title.toLowerCase().includes(q))
        .slice(0, 8);
    },
    async get(id) {
      await wait(60);
      return showById(id);
    },
    async detail(id) {
      await wait(200);
      failIfRequested();
      const me = requireViewer();
      const show = showById(id);
      const views = vouches
        .filter((v) => v.showId === id && v.authorId !== me.id)
        .flatMap((v) => {
          const view = toView(me.id, v);
          return view ? [view] : [];
        })
        .sort((a, b) => byNewest(a.vouch, b.vouch));
      const direct = views.filter((v) => !v.author.via);
      const fof = views.filter((v) => !!v.author.via);
      const all = [...direct, ...fof];
      const mean = (list: VouchView[]) =>
        list.length ? Math.round((list.reduce((s, v) => s + v.vouch.rating, 0) / list.length) * 10) / 10 : null;
      const tagCounts = new Map<string, number>();
      all.forEach((v) => v.vouch.tags.forEach((t) => tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1)));
      const tags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([t]) => t);
      const mine = vouches.find((v) => v.showId === id && v.authorId === me.id);
      return {
        show,
        friendsAverage: mean(direct),
        networkAverage: mean(all),
        friendCount: direct.length,
        fofCount: fof.length,
        direct,
        fof,
        tags,
        myVouch: mine ? toView(me.id, mine) : null,
      };
    },
  },

  vouches: {
    async create(input: CreateVouchInput) {
      await wait(350);
      const me = requireViewer();
      const show = showById(input.showId);
      const tags = validateVouchInput(input);
      if (vouches.some((v) => v.authorId === me.id && v.showId === show.id)) {
        // Same as the real API: one vouch per show, change it with update().
        throw new ApiError("conflict", "You already vouched for this show");
      }
      const vouch: Vouch = {
        id: nextId("v"),
        authorId: me.id,
        showId: show.id,
        rating: input.rating,
        review: input.review.trim(),
        tags,
        createdAt: new Date().toISOString(),
      };
      vouches.push(vouch);
      persist();
      return vouch;
    },
    async update(id, input) {
      await wait(350);
      const me = requireViewer();
      const v = vouches.find((x) => x.id === id);
      if (!v) throw new ApiError("not_found");
      if (v.authorId !== me.id) throw new ApiError("forbidden");
      v.tags = validateVouchInput(input);
      v.rating = input.rating;
      v.review = input.review.trim();
      persist();
      return { ...v };
    },
    async remove(id) {
      await wait(300);
      const me = requireViewer();
      const i = vouches.findIndex((x) => x.id === id);
      if (i < 0) throw new ApiError("not_found");
      if (vouches[i]!.authorId !== me.id) throw new ApiError("forbidden");
      vouches.splice(i, 1);
      persist();
    },
    async mine() {
      await wait(150);
      failIfRequested();
      const me = requireViewer();
      if (devFlag("empty") === "vouches") return [];
      return vouches
        .filter((v) => v.authorId === me.id)
        .sort(byNewest)
        .map((v) => toView(me.id, v)!);
    },
  },

  feed: {
    async page(opts) {
      await wait(350);
      failIfRequested();
      if (opts?.cursor && devFlag("fail") === "more") throw new ApiError("network", "Simulated network failure");
      const me = requireViewer();
      if (opts?.kind && devFlag("empty") === opts.kind) return { items: [], nextCursor: null };
      const limit = opts?.limit ?? 6;
      const items: FeedItem[] = [];
      for (const v of vouches) {
        if (v.authorId === me.id) continue; // your own vouches are not in your feed
        const view = toView(me.id, v); // null for strangers: the feed reaches two hops, no further
        if (!view) continue;
        items.push({ type: "vouch", id: v.id, createdAt: v.createdAt, relation: view.author.via ? "fof" : "friend", via: view.author.via, vouch: view });
      }
      for (const a of anticipations) {
        const view = anticipationView(me.id, a);
        if (view) items.push({ type: "anticipation", id: a.id, createdAt: a.createdAt, anticipation: view });
      }
      const filtered = items
        .filter((i) => !opts?.kind || (i.type === "vouch" ? i.vouch.show.kind : i.anticipation.show.kind) === opts.kind)
        .sort(byNewest);
      const start = opts?.cursor ? Math.max(0, filtered.findIndex((i) => i.id === opts.cursor) + 1) : 0;
      const slice = filtered.slice(start, start + limit);
      const last = slice[slice.length - 1];
      return {
        items: slice,
        nextCursor: last && start + limit < filtered.length ? last.id : null,
      };
    },
  },

  anticipations: {
    async meToo(anticipationId, linkedVouchId) {
      await wait(300);
      const me = requireViewer();
      const a = anticipations.find((x) => x.id === anticipationId);
      if (!a) throw new ApiError("not_found");
      const linked = vouches.find((v) => v.id === linkedVouchId);
      if (!linked || linked.authorId !== me.id) {
        throw new ApiError("invalid", "A vouch of your own is required");
      }
      joinedAnticipations.add(`${me.id}:${a.id}`);
      if (!a.waiting.some((w) => w.userId === me.id)) a.waiting.push({ userId: me.id, linkedVouchId });
      persist();
    },
  },

  profiles: {
    async get(handle) {
      await wait(180);
      failIfRequested();
      const me = requireViewer();
      const user = users.find((u) => u.handle === handle.toLowerCase());
      if (!user) throw new ApiError("not_found");
      const shared = user.tags.filter((t) => me.tags.includes(t));

      if (user.id === me.id || areFriends(me.id, user.id)) {
        const list = vouches
          .filter((v) => v.authorId === user.id && devFlag("empty") !== "vouches")
          .sort(byNewest)
          .flatMap((v) => {
            const view = toView(me.id, v);
            return view ? [view] : [];
          });
        return {
          relation: user.id === me.id ? "self" : "friend",
          user,
          friendCount: friendIds(user.id).length,
          sharedTags: user.id === me.id ? user.tags : shared,
          vouches: list,
        } satisfies Profile;
      }

      const via = viaFriend(me.id, user.id);
      if (!via) throw new ApiError("not_found"); // stranger
      const eligibility = await mockApi.friends.eligibility(user.id);
      const requestState = requests.some((r) => r.fromId === user.id && r.toId === me.id)
        ? "incoming"
        : requests.some((r) => r.fromId === me.id && r.toId === user.id)
          ? "outgoing"
          : "none";
      return {
        relation: "fof",
        user: { id: user.id, handle: user.handle, name: user.name },
        via: { id: via.id, handle: via.handle, name: firstName(via.name) },
        sharedTags: shared,
        eligibility,
        requestState,
      } satisfies Profile;
    },
  },
};
