export type ShowKind = "tv" | "anime";

export interface User {
  id: string;
  handle: string;
  name: string;
  tags: string[];
}

export interface Show {
  id: string;
  title: string;
  kind: ShowKind;
  year: number;
  /** Creator / studio / network line shown in the meta row. */
  credit: string;
  /** Present for unreleased shows. */
  releaseLabel?: string;
}

export interface Vouch {
  id: string;
  authorId: string;
  showId: string;
  rating: number;
  review: string;
  tags: string[];
  createdAt: string;
}

/** A user as seen by a viewer: `via` is set for friends of friends. */
export interface PersonRef {
  id: string;
  handle: string;
  name: string;
  via?: { id: string; handle: string; name: string };
}

export interface VouchView {
  vouch: Vouch;
  show: Show;
  author: PersonRef;
}

export interface AnticipationView {
  id: string;
  show: Show;
  waiting: { user: PersonRef; linkedVouchId: string }[];
  /** True once the viewer has said "Me too". */
  joined: boolean;
}

export type FeedItem =
  | {
      type: "vouch";
      id: string;
      createdAt: string;
      /** "friend": a direct friend (solid card). "fof": a friend of a friend (dashed card, "via <friend>"). */
      relation: "friend" | "fof";
      /** Set exactly when relation is "fof"; the same value as `vouch.author.via`. */
      via?: { id: string; handle: string; name: string };
      vouch: VouchView;
    }
  | { type: "anticipation"; id: string; createdAt: string; anticipation: AnticipationView };

export interface FeedPage {
  items: FeedItem[];
  nextCursor: string | null;
}

export interface ShowDetail {
  show: Show;
  /** Mean rating of direct friends' vouches, one decimal; null when no direct friend has vouched. */
  friendsAverage: number | null;
  /** Mean rating of friends' and friends-of-friends' vouches together; null when nobody has vouched. */
  networkAverage: number | null;
  friendCount: number;
  fofCount: number;
  direct: VouchView[];
  fof: VouchView[];
  tags: string[];
  myVouch: VouchView | null;
}

export interface Session {
  user: User;
}

export interface Eligibility {
  eligible: boolean;
  nominated: boolean;
  condition?: string;
}

export type Relation = "self" | "friend" | "fof";

export type Profile =
  | {
      relation: "self" | "friend";
      user: User;
      friendCount: number;
      sharedTags: string[];
      vouches: VouchView[];
    }
  | {
      relation: "fof";
      // Friends of friends expose only name, avatar (initial), via and their vouches (each labelled with via).
      // No tags, no friend list, no anticipations.
      user: Pick<User, "id" | "handle" | "name">;
      via: { id: string; handle: string; name: string };
      vouches: VouchView[];
      eligibility: Eligibility;
      requestState: "none" | "incoming" | "outgoing";
    };

export interface FriendListItem {
  user: User;
}

export interface FriendRequest {
  id: string;
  user: PersonRef;
}

export interface FriendRequests {
  incoming: FriendRequest[];
  /** `sentAt` is an ISO timestamp; the UI formats it ("sent 3 days ago"). */
  outgoing: (FriendRequest & { sentAt: string })[];
}

export interface InvitePreview {
  code: string;
  inviter: { name: string; handle: string };
  sampleVouches: VouchView[];
}

export interface MyInvite {
  code: string;
  url: string;
  expiresInDays: number;
}

export interface SentInvite {
  id: string;
  name: string;
  status: "joined" | "waiting";
  /** ISO timestamps; the UI formats them ("Joined 3 weeks ago"). `joinedAt` only when status is "joined". */
  sentAt: string;
  joinedAt?: string;
}

export interface CreateVouchInput {
  showId: string;
  rating: number;
  review: string;
  tags: string[];
}

export type UpdateVouchInput = Omit<CreateVouchInput, "showId">;

export type ApiErrorCode =
  | "not_found"
  | "unauthenticated"
  | "token_expired"
  | "token_invalid"
  | "invalid"
  | "forbidden"
  | "conflict"
  | "rate_limited"
  | "server_error"
  | "network";

/** Wire shape of every error response: see docs/api-contract.md. */
export interface ApiErrorBody {
  code: ApiErrorCode;
  message: string;
  traceId?: string;
}

export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    message?: string,
    /** Correlation id from the server, for support and logs. Absent for client-side errors. */
    public traceId?: string,
    /** HTTP status of the response, when there was one. */
    public status?: number,
  ) {
    super(message ?? code);
    this.name = "ApiError";
  }
}

/**
 * The single surface the UI talks to. The mock in ./mock implements it today;
 * the real HTTP client replaces it later without touching components.
 */
export interface VouchApi {
  auth: {
    requestMagicLink(email: string, inviteCode?: string): Promise<void>;
    /** Throws ApiError token_expired / token_invalid. */
    verifyMagicLink(token: string): Promise<Session>;
    getSession(): Promise<Session | null>;
    signOut(): Promise<void>;
  };
  waitlist: { join(email: string): Promise<void> };
  /** Mock only: puts the demo data back to its seed state. The real client has no `demo`. */
  demo?: { reset(): Promise<void> };
  invites: {
    preview(code: string): Promise<InvitePreview>;
    mine(): Promise<MyInvite>;
    sent(): Promise<SentInvite[]>;
  };
  friends: {
    list(query?: string): Promise<FriendListItem[]>;
    requests(): Promise<FriendRequests>;
    accept(requestId: string): Promise<void>;
    decline(requestId: string): Promise<void>;
    sendRequest(userId: string): Promise<void>;
    eligibility(userId: string): Promise<Eligibility>;
  };
  shows: {
    search(query: string, kind?: ShowKind): Promise<Show[]>;
    get(id: string): Promise<Show>;
    detail(id: string): Promise<ShowDetail>;
  };
  vouches: {
    create(input: CreateVouchInput): Promise<Vouch>;
    /** Author only; anyone else gets ApiError forbidden. Keeps the vouch's id and date. */
    update(id: string, input: UpdateVouchInput): Promise<Vouch>;
    /** Author only. */
    remove(id: string): Promise<void>;
    mine(): Promise<VouchView[]>;
  };
  feed: {
    page(opts?: { cursor?: string | null; limit?: number; kind?: ShowKind }): Promise<FeedPage>;
  };
  anticipations: {
    /** linkedVouchId must be one of the viewer's own vouches. */
    meToo(anticipationId: string, linkedVouchId: string): Promise<void>;
  };
  profiles: {
    /** Strangers throw ApiError not_found. */
    get(handle: string): Promise<Profile>;
  };
}
