import {
  ApiError,
  type ApiErrorBody,
  type ApiErrorCode,
  type CreateVouchInput,
  type Eligibility,
  type FeedPage,
  type FriendListItem,
  type FriendRequests,
  type InvitePreview,
  type MyInvite,
  type Profile,
  type SentInvite,
  type Session,
  type Show,
  type ShowDetail,
  type ShowKind,
  type UpdateVouchInput,
  type User,
  type Vouch,
  type VouchApi,
  type VouchView,
} from "./types";

/** Response of POST /auth/magic-link/verify and POST /auth/refresh. */
interface TokenResponse {
  accessToken: string;
  /** Seconds until the access token expires. */
  expiresIn: number;
  user: User;
}

type Query = Record<string, string | number | undefined>;

interface RequestOptions {
  query?: Query;
  body?: unknown;
  /** Send the access token and refresh on 401. Default true. */
  auth?: boolean;
}

const STATUS_CODE: Record<number, ApiErrorCode> = {
  400: "invalid",
  401: "unauthenticated",
  403: "forbidden",
  404: "not_found",
  409: "conflict",
  410: "token_expired",
  422: "invalid",
  429: "rate_limited",
};

/** Routes a signed-out visitor may be on; a lost session must not redirect from these. */
function isPublicPath(path: string): boolean {
  return path === "/" || path.startsWith("/sign-in") || path.startsWith("/auth") || path.startsWith("/i/");
}

function redirectToSignIn() {
  if (typeof window !== "undefined" && !isPublicPath(window.location.pathname)) window.location.assign("/sign-in");
}

/**
 * Fetch client for the real backend (see docs/api-contract.md).
 *
 * - The access token (JWT) lives in this closure only: never in localStorage, sessionStorage or a cookie
 *   the page can read.
 * - The refresh token is an httpOnly cookie set by the server; every request sends `credentials: "include"`.
 * - A 401 triggers exactly one refresh (shared by all requests in flight) and one retry. If the refresh
 *   fails the session is cleared and the browser goes to /sign-in.
 */
export function createHttpApi(baseUrl: string, onSessionLost: () => void = redirectToSignIn): VouchApi {
  const base = baseUrl.replace(/\/+$/, "");
  let accessToken: string | null = null;
  let refreshing: Promise<TokenResponse | null> | null = null;

  function url(path: string, query?: Query): string {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== "") qs.set(k, String(v));
    const s = qs.toString();
    return `${base}${path}${s ? `?${s}` : ""}`;
  }

  async function send(method: string, path: string, o: RequestOptions, token: string | null): Promise<Response> {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (o.body !== undefined) headers["Content-Type"] = "application/json";
    if (token) headers.Authorization = `Bearer ${token}`;
    try {
      return await fetch(url(path, o.query), {
        method,
        headers,
        body: o.body === undefined ? undefined : JSON.stringify(o.body),
        credentials: "include",
      });
    } catch {
      throw new ApiError("network", "Could not reach the server");
    }
  }

  async function toError(res: Response): Promise<ApiError> {
    let body: Partial<ApiErrorBody> = {};
    try {
      body = (await res.json()) as Partial<ApiErrorBody>;
    } catch {
      /* not JSON */
    }
    const code: ApiErrorCode = body.code ?? STATUS_CODE[res.status] ?? (res.status >= 500 ? "server_error" : "invalid");
    return new ApiError(code, body.message, body.traceId, res.status);
  }

  /** One refresh at a time; concurrent callers share the same promise. */
  function refresh(): Promise<TokenResponse | null> {
    refreshing ??= (async () => {
      const res = await send("POST", "/auth/refresh", {}, null);
      if (!res.ok) {
        accessToken = null;
        return null;
      }
      const t = (await res.json()) as TokenResponse;
      accessToken = t.accessToken;
      return t;
    })()
      .catch(() => {
        accessToken = null;
        return null;
      })
      .finally(() => {
        refreshing = null;
      });
    return refreshing;
  }

  function sessionEnded(): ApiError {
    accessToken = null;
    onSessionLost();
    return new ApiError("unauthenticated", "Your session has ended", undefined, 401);
  }

  async function request<T>(method: string, path: string, o: RequestOptions = {}): Promise<T> {
    const auth = o.auth !== false;
    let res = await send(method, path, o, auth ? accessToken : null);
    if (res.status === 401 && auth) {
      if (!(await refresh())) throw sessionEnded();
      res = await send(method, path, o, accessToken); // retried once
      if (res.status === 401) throw sessionEnded();
    }
    if (!res.ok) throw await toError(res);
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  const get = <T>(path: string, query?: Query) => request<T>("GET", path, { query });
  const post = <T = void>(path: string, body?: unknown, auth = true) => request<T>("POST", path, { body, auth });
  const enc = encodeURIComponent;

  return {
    auth: {
      async requestMagicLink(email, inviteCode) {
        await post("/auth/magic-link", { email: email.trim(), inviteCode }, false);
      },
      async verifyMagicLink(token): Promise<Session> {
        const t = await post<TokenResponse>("/auth/magic-link/verify", { token }, false);
        accessToken = t.accessToken;
        return { user: t.user };
      },
      async getSession() {
        const t = await refresh();
        return t ? { user: t.user } : null;
      },
      async signOut() {
        try {
          // Revokes the refresh token and clears the cookie; the cookie is only sent to this path.
          await request<void>("DELETE", "/auth/refresh", { auth: false });
        } finally {
          accessToken = null;
        }
      },
    },
    waitlist: { join: (email) => post("/waitlist", { email: email.trim() }, false) },
    invites: {
      preview: (code) => request<InvitePreview>("GET", `/invites/${enc(code)}`, { auth: false }),
      mine: () => get<MyInvite>("/invites/mine"),
      sent: () => get<SentInvite[]>("/invites/sent"),
    },
    friends: {
      list: (query) => get<FriendListItem[]>("/friends", { query }),
      requests: () => get<FriendRequests>("/friends/requests"),
      accept: (id) => post(`/friends/requests/${enc(id)}/accept`),
      decline: (id) => post(`/friends/requests/${enc(id)}/decline`),
      sendRequest: (userId) => post("/friends/requests", { userId }),
      eligibility: (userId) => get<Eligibility>(`/users/${enc(userId)}/friend-eligibility`),
    },
    shows: {
      search: (query, kind?: ShowKind) => get<Show[]>("/shows/search", { q: query, kind }),
      get: (id) => get<Show>(`/shows/${enc(id)}`),
      detail: (id) => get<ShowDetail>(`/shows/${enc(id)}/network`),
    },
    vouches: {
      create: (input: CreateVouchInput) => post<Vouch>("/vouches", input),
      update: (id, input: UpdateVouchInput) => request<Vouch>("PATCH", `/vouches/${enc(id)}`, { body: input }),
      remove: (id) => request<void>("DELETE", `/vouches/${enc(id)}`),
      mine: () => get<VouchView[]>("/vouches/mine"),
    },
    feed: {
      page: (opts) => get<FeedPage>("/feed", { cursor: opts?.cursor ?? undefined, limit: opts?.limit, kind: opts?.kind }),
    },
    anticipations: {
      meToo: (id, linkedVouchId) => post(`/anticipations/${enc(id)}/me-too`, { linkedVouchId }),
    },
    profiles: {
      get: (handle) => get<Profile>(`/profiles/${enc(handle)}`),
    },
  };
}
