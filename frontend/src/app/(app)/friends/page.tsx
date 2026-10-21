"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, type FriendRequests } from "@/lib/api";
import { useApp } from "@/components/providers";
import { useAsync, type AsyncState } from "@/hooks/use-async";
import { Avatar, BackButton, Skeleton } from "@/components/ui/primitives";
import { LinkIcon, SearchIcon } from "@/components/ui/icons";
import { ErrorState } from "@/components/app/states";
import { cn } from "@/lib/format";

type Tab = "friends" | "requests" | "invite";

export default function FriendsPage() {
  return (
    <Suspense fallback={null}>
      <Friends />
    </Suspense>
  );
}

function Friends() {
  const router = useRouter();
  const params = useSearchParams();
  const tab = (["friends", "requests", "invite"].includes(params.get("tab") ?? "") ? params.get("tab") : "friends") as Tab;
  const [friends] = useAsync(() => api.friends.list(), [tab]);
  const [requests, reloadRequests] = useAsync(() => api.friends.requests(), [tab]);

  const setTab = (t: Tab) => router.replace(`/friends?tab=${t}`, { scroll: false });
  const incomingCount = requests.status === "ready" ? requests.data.incoming.length : 0;

  const tabs: { id: Tab; label: string; badge?: { text: string; tone: "raised" | "lime" } }[] = [
    { id: "friends", label: "Friends", badge: friends.status === "ready" ? { text: String(friends.data.length), tone: "raised" } : undefined },
    { id: "requests", label: "Requests", badge: incomingCount > 0 ? { text: String(incomingCount), tone: "lime" } : undefined },
    { id: "invite", label: "Invite" },
  ];

  return (
    <div className="mx-auto max-w-[720px] px-6 pb-8 pt-6 md:px-10 md:pt-10">
      <BackButton onClick={() => (window.history.length > 1 ? router.back() : router.push("/me"))} />
      <h1 className="mt-6 font-display text-[40px] font-extrabold leading-[44px] tracking-tight">Friends</h1>

      <div role="tablist" aria-label="Friends sections" className="mt-4 grid grid-cols-3 rounded-full bg-surface p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "press focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-full text-sm font-extrabold transition-colors",
              tab === t.id ? "bg-cream text-ink" : "text-cream",
            )}
          >
            {t.label}
            {t.badge && (
              <span
                className={cn(
                  "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-extrabold leading-5",
                  t.badge.tone === "lime" ? "bg-lime text-ink" : "bg-raised text-cream",
                )}
              >
                {t.badge.text}
              </span>
            )}
          </button>
        ))}
      </div>

      <div key={tab} className="animate-fade-in">
        {tab === "friends" && <FriendsTab />}
        {tab === "requests" && <RequestsTab state={requests} reload={reloadRequests} />}
        {tab === "invite" && <InviteTab />}
      </div>
    </div>
  );
}

function FriendsTab() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 150);
    return () => clearTimeout(t);
  }, [q]);
  const [state, reload] = useAsync(() => api.friends.list(debounced), [debounced]);

  return (
    <div className="mt-4">
      <label className="relative block">
        <span className="sr-only">Search friends</span>
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" width={20} height={20} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search friends"
          className="h-12 w-full rounded-2xl bg-surface pl-12 pr-4 text-base text-cream outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-lime"
        />
      </label>
      {state.status === "loading" && (
        <ul className="mt-4 space-y-3">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Skeleton className="h-[62px] !rounded-2xl" />
            </li>
          ))}
        </ul>
      )}
      {state.status === "error" && <ErrorState onRetry={reload} />}
      {state.status === "ready" && state.data.length === 0 && (
        <p className="py-12 text-center text-muted">{debounced ? "No friends match that search." : "No friends yet. Share your invite link to get started."}</p>
      )}
      {state.status === "ready" && (
        <ul className="mt-4 space-y-3">
          {state.data.map(({ user }) => (
            <li key={user.id}>
              <Link href={`/u/${user.handle}`} className="press focus-ring flex items-center gap-3 rounded-2xl bg-surface p-3">
                <Avatar name={user.name} size="md" />
                <span className="min-w-0">
                  <span className="block font-bold">{user.name}</span>
                  <span className="block truncate text-sm text-muted">
                    @{user.handle}
                    {user.tags.length > 0 && ` · ${user.tags.slice(0, 2).join(", ")}`}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RequestsTab({
  state,
  reload,
}: {
  state: AsyncState<FriendRequests>;
  reload: () => void;
}) {
  const { notify } = useApp();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function act(id: string, kind: "accept" | "decline", name: string) {
    setBusyId(id);
    try {
      await api.friends[kind](id);
      notify(kind === "accept" ? `You and ${name} are friends` : "Request declined");
      reload();
    } catch {
      notify("Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  if (state.status === "loading") return <Skeleton className="mt-6 h-40 !rounded-2xl" />;
  if (state.status === "error") return <ErrorState onRetry={reload} />;
  const { incoming, outgoing } = state.data;

  return (
    <div className="mt-6">
      <h2 className="font-display text-xl font-extrabold">Wants to be friends</h2>
      {incoming.length === 0 ? (
        <p className="mt-3 text-muted">No requests right now.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {incoming.map((r) => (
            <li key={r.id} className="rounded-2xl bg-surface p-3">
              <Link href={`/u/${r.user.handle}`} className="focus-ring flex items-center gap-3 rounded-lg">
                <Avatar name={r.user.name} size="md" />
                <span>
                  <span className="block font-bold">{r.user.name}</span>
                  <span className="block text-sm text-muted">
                    @{r.user.handle}
                    {r.user.via && ` · via ${r.user.via.name.split(" ")[0]}`}
                  </span>
                </span>
              </Link>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => act(r.id, "accept", r.user.name.split(" ")[0]!)}
                  className="btn-primary h-11 text-sm"
                >
                  Accept
                </button>
                <button
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => act(r.id, "decline", r.user.name)}
                  className="btn-outline h-11 text-sm"
                >
                  Decline
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-8 font-display text-xl font-extrabold">Sent by you</h2>
      {outgoing.length === 0 ? (
        <p className="mt-3 text-muted">Nothing pending.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {outgoing.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 rounded-2xl bg-surface p-3">
              <div className="flex items-center gap-3">
                <Avatar name={r.user.name} size="md" />
                <span>
                  <span className="block font-bold">{r.user.name}</span>
                  <span className="block text-sm text-muted">
                    @{r.user.handle} · {r.sentLabel}
                  </span>
                </span>
              </div>
              <span className="inline-flex h-7 items-center rounded-full border-2 border-muted px-3 text-xs font-extrabold text-muted">
                Pending
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function InviteTab() {
  const { notify } = useApp();
  const [invite] = useAsync(() => api.invites.mine(), []);
  const [sent] = useAsync(() => api.invites.sent(), []);
  const url = invite.status === "ready" ? invite.data.url : null;

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(`https://${url}`);
      notify("Invite link copied");
    } catch {
      notify("Copy is not available here");
    }
  }
  async function share() {
    if (!url) return;
    const data = { title: "Join me on Vouch", text: "Recommendations from people you actually know.", url: `https://${url}` };
    if (navigator.share) {
      try {
        await navigator.share(data);
      } catch {
        /* dismissed */
      }
    } else {
      copy();
    }
  }

  return (
    <div className="mt-6">
      <div className="-rotate-2 rounded-3xl bg-lime p-5 text-ink">
        <p className="text-sm font-semibold">Your invite link</p>
        <p className="mt-2 flex items-center gap-2 font-display text-xl font-extrabold">
          <LinkIcon width={20} height={20} className="shrink-0" />
          <span className="break-all">{url ?? "…"}</span>
        </p>
        <p className="mt-3 text-sm">
          Works for {invite.status === "ready" ? invite.data.expiresInDays : 7} days. Share it with people you actually know.
        </p>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button type="button" onClick={copy} className="btn-primary">
          Copy link
        </button>
        <button type="button" onClick={share} className="btn-outline">
          Share
        </button>
      </div>

      <h2 className="mt-8 font-display text-xl font-extrabold">Invites you sent</h2>
      {sent.status === "loading" && <Skeleton className="mt-3 h-16 !rounded-2xl" />}
      {sent.status === "ready" && sent.data.length === 0 && <p className="mt-3 text-muted">You have not invited anyone yet.</p>}
      {sent.status === "ready" && (
        <ul className="mt-3 space-y-3">
          {sent.data.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-3 rounded-2xl bg-surface p-3">
              <div className="flex items-center gap-3">
                <Avatar name={i.name} size="md" />
                <span>
                  <span className="block font-bold">{i.name}</span>
                  <span className="block text-sm text-muted">{i.label}</span>
                </span>
              </div>
              <span
                className={cn(
                  "inline-flex h-7 items-center rounded-full px-3 text-xs font-extrabold",
                  i.status === "joined" ? "bg-lime text-ink" : "border-2 border-muted text-muted",
                )}
              >
                {i.status === "joined" ? "Joined" : "Waiting"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
