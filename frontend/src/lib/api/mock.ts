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
  type User,
  type Vouch,
  type VouchApi,
  type VouchView,
} from "./types";
import * as seed from "./mock-data";

/**
 * In-memory implementation of VouchApi. It enforces the visibility rules the
 * real backend must enforce (the UI never filters for privacy):
 *  - feed: direct friends only
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

const wait = (ms = 220) => new Promise<void>((r) => setTimeout(r, ms));
const nextId = (p: string) => `${p}${++idCounter}`;

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
  if (clean === seed.ME_EMAIL) return users.find((u) => u.id === seed.ME_ID)!;
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

/** Dev helper: stands in for the link in the email the backend would send. */
export function devMagicLinkToken(email: string, state: "valid" | "expired" = "valid"): string {
  return state === "expired" ? "expired" : `mock.${encodeURIComponent(email.trim().toLowerCase())}`;
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
  if (via) return { id, handle: u.handle, name: u.name, via: { id: via.id, name: via.name } };
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

// ---------- API ----------

export const mockApi: VouchApi = {
  auth: {
    async requestMagicLink(email) {
      await wait(500);
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) throw new ApiError("invalid", "Enter a valid email");
    },
    async verifyMagicLink(token) {
      await wait(500);
      if (token === "expired") throw new ApiError("token_expired");
      if (!token.startsWith("mock.")) throw new ApiError("token_invalid");
      const email = decodeURIComponent(token.slice(5));
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
      return [
        { id: "i1", name: "Maya Rao", status: "joined" as const, label: "Joined 3 weeks ago" },
        { id: "i2", name: "Sam Okafor", status: "joined" as const, label: "Joined 2 weeks ago" },
        { id: "i3", name: "Ana Duarte", status: "waiting" as const, label: "Not joined yet" },
      ];
    },
  },

  friends: {
    async list(query) {
      await wait(150);
      const me = requireViewer();
      const q = query?.trim().toLowerCase();
      return friendIds(me.id)
        .map(userById)
        .filter((u) => !q || u.name.toLowerCase().includes(q) || u.handle.includes(q))
        .map((user) => ({ user }));
    },
    async requests() {
      await wait(150);
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
          const days = Math.floor((Date.now() - Date.parse(r.createdAt)) / 86_400_000);
          const sentLabel = days < 1 ? "sent today" : `sent ${days} day${days === 1 ? "" : "s"} ago`;
          return user ? [{ id: r.id, user, sentLabel }] : [];
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
    },
    async decline(requestId) {
      await wait(150);
      const me = requireViewer();
      const i = requests.findIndex((r) => r.id === requestId && r.toId === me.id);
      if (i < 0) throw new ApiError("not_found");
      requests.splice(i, 1);
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
      const avg = all.length ? Math.round((all.reduce((s, v) => s + v.vouch.rating, 0) / all.length) * 10) / 10 : null;
      const tagCounts = new Map<string, number>();
      all.forEach((v) => v.vouch.tags.forEach((t) => tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1)));
      const tags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([t]) => t);
      const mine = vouches.find((v) => v.showId === id && v.authorId === me.id);
      return {
        show,
        friendsAverage: avg,
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
      if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 10) {
        throw new ApiError("invalid", "Rating must be 1 to 10");
      }
      if (input.review.length > 280) throw new ApiError("invalid", "Review is too long");
      const tags = [...new Set(input.tags.map(normaliseTag).filter(Boolean))];
      if (tags.length > 5) throw new ApiError("invalid", "Max 5 tags");
      const existing = vouches.findIndex((v) => v.authorId === me.id && v.showId === show.id);
      if (existing >= 0) vouches.splice(existing, 1);
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
      return vouch;
    },
    async mine() {
      await wait(150);
      const me = requireViewer();
      return vouches
        .filter((v) => v.authorId === me.id)
        .sort(byNewest)
        .map((v) => toView(me.id, v)!);
    },
  },

  feed: {
    async page(opts) {
      await wait(350);
      const me = requireViewer();
      const limit = opts?.limit ?? 6;
      const direct = friendIds(me.id);
      const items: FeedItem[] = [];
      for (const v of vouches) {
        if (!direct.includes(v.authorId)) continue; // feed is direct friends only
        const view = toView(me.id, v);
        if (view) items.push({ type: "vouch", id: v.id, createdAt: v.createdAt, vouch: view });
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
    },
  },

  profiles: {
    async get(handle) {
      await wait(180);
      const me = requireViewer();
      const user = users.find((u) => u.handle === handle.toLowerCase());
      if (!user) throw new ApiError("not_found");
      const shared = user.tags.filter((t) => me.tags.includes(t));

      if (user.id === me.id || areFriends(me.id, user.id)) {
        const list = vouches
          .filter((v) => v.authorId === user.id)
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
        via: { id: via.id, name: firstName(via.name) },
        sharedTags: shared,
        eligibility,
        requestState,
      } satisfies Profile;
    },
  },
};
