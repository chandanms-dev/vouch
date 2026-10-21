"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, type FeedItem, type MyInvite, type ShowKind } from "@/lib/api";
import { useApp, useAuth } from "@/components/providers";
import { AnticipationCard, VouchCard } from "@/components/ui/cards";
import { Avatar, Logo, Skeleton } from "@/components/ui/primitives";
import { KIND } from "@/components/ui/kind";
import { ErrorState } from "@/components/app/states";
import { cn } from "@/lib/format";

type Filter = ShowKind | "all";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "tv", label: "TV" },
  { id: "anime", label: "Anime" },
];

export default function FeedPage() {
  const { user } = useAuth();
  const { version, openMeToo, openComposer } = useApp();
  const [filter, setFilter] = useState<Filter>("all");
  const [items, setItems] = useState<FeedItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);

  const loadFirst = useCallback(() => {
    const id = ++requestId.current;
    setStatus("loading");
    api.feed.page({ kind: filter === "all" ? undefined : filter }).then(
      (p) => {
        if (id !== requestId.current) return;
        setItems(p.items);
        setCursor(p.nextCursor);
        setStatus("ready");
      },
      () => id === requestId.current && setStatus("error"),
    );
  }, [filter]);

  // Reload on filter change and whenever the viewer posts a vouch or says Me too.
  useEffect(() => {
    loadFirst();
  }, [loadFirst, version]);

  const loadMore = useCallback(() => {
    if (!cursor || loadingMore) return;
    const id = requestId.current;
    setLoadingMore(true);
    setMoreError(false);
    api.feed.page({ cursor, kind: filter === "all" ? undefined : filter }).then(
      (p) => {
        if (id !== requestId.current) return;
        setItems((prev) => [...prev, ...p.items]);
        setCursor(p.nextCursor);
        setLoadingMore(false);
      },
      () => {
        setMoreError(true);
        setLoadingMore(false);
      },
    );
  }, [cursor, loadingMore, filter]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !cursor || moreError) return;
    const io = new IntersectionObserver((e) => e[0]?.isIntersecting && loadMore(), { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, [cursor, loadMore, moreError]);

  if (!user) return null;

  const chips = (
    <div
      role="group"
      aria-label="Filter by type"
      className="flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none md:overflow-visible md:px-0"
    >
      {FILTERS.map((f) => {
        const active = filter === f.id;
        const tone = f.id === "all" ? "bg-cream" : KIND[f.id].field;
        return (
          <button
            key={f.id}
            type="button"
            aria-pressed={active}
            onClick={() => setFilter(f.id)}
            className={cn(
              "press focus-ring inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-4 text-tag font-extrabold text-ink transition-opacity",
              tone,
              active && "ring-2 ring-cream ring-offset-2 ring-offset-ink",
            )}
          >
            {f.id !== "all" && KIND[f.id].icon}
            {f.label}
          </button>
        );
      })}
    </div>
  );

  const isEmpty = status === "ready" && items.length === 0;
  const noFriendsYet = isEmpty && filter === "all";

  return (
    <div className="mx-auto max-w-[1200px] md:px-10 md:pt-10">
      {/* Mobile header */}
      <header className="flex items-center justify-between px-4 pb-3 pt-6 md:hidden">
        <Logo className="text-[32px]" />
        <Link href="/me" aria-label="Your profile" className="press focus-ring rounded-full">
          <Avatar name={user.name} size="md" />
        </Link>
      </header>
      {/* Desktop header */}
      <header className="hidden items-end justify-between md:flex">
        <div>
          <h1 className="font-display text-[44px] font-extrabold leading-[48px] tracking-tight">Your feed</h1>
          <p className="mt-1 text-muted">What your friends loved this week</p>
        </div>
        {!noFriendsYet && chips}
      </header>
      {!noFriendsYet && <div className="md:hidden">{chips}</div>}

      {status === "loading" && <FeedSkeleton />}
      {status === "error" && <ErrorState body="We could not load your feed. Check your connection and try again." onRetry={loadFirst} />}
      {noFriendsYet && <QuietFeed onVouch={() => openComposer()} />}
      {isEmpty && !noFriendsYet && (
        <p className="px-6 py-20 text-center text-muted">Nothing here yet from your friends.</p>
      )}

      {status === "ready" && items.length > 0 && (
        <>
          <ul className="space-y-4 px-4 pt-4 md:block md:columns-2 md:gap-6 md:space-y-0 md:px-0 md:pt-8 xl:columns-3">
            {items.map((item, i) => (
              <li
                key={`${item.type}-${item.id}`}
                className="animate-fade-up md:mb-6 md:break-inside-avoid"
                style={{ animationDelay: `${Math.min(i % 6, 5) * 40}ms` }}
              >
                {item.type === "vouch" ? (
                  <VouchCard view={item.vouch} youId={user.id} href={`/show/${item.vouch.show.id}`} />
                ) : (
                  <AnticipationCard item={item.anticipation} onMeToo={openMeToo} />
                )}
              </li>
            ))}
          </ul>
          <div ref={sentinel} className="flex min-h-16 items-center justify-center px-4 pb-6 pt-2">
            {loadingMore && <Skeleton className="h-8 w-32" />}
            {moreError && (
              <button type="button" onClick={loadMore} className="btn-outline btn-sm">
                Could not load more. Try again
              </button>
            )}
            {!cursor && !moreError && <span className="text-sm text-muted">You are all caught up.</span>}
          </div>
        </>
      )}
    </div>
  );
}

function FeedSkeleton() {
  return (
    <ul className="space-y-4 px-4 pt-4 md:grid md:grid-cols-2 md:gap-6 md:space-y-0 md:px-0 md:pt-8 xl:grid-cols-3" aria-busy="true" aria-label="Loading feed">
      {[0, 1, 2].map((i) => (
        <li key={i} className="h-[270px] rounded-card bg-surface p-4 md:h-[324px]">
          <div className="flex justify-between">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-14 w-14 !rounded-2xl" />
          </div>
          <Skeleton className="mt-6 h-5 w-3/5" />
          <Skeleton className="mt-3 h-3 w-2/5" />
          <Skeleton className="mt-5 h-3 w-full" />
          <Skeleton className="mt-3 h-3 w-full" />
          <Skeleton className="mt-3 h-3 w-2/3" />
        </li>
      ))}
    </ul>
  );
}

function QuietFeed({ onVouch }: { onVouch: () => void }) {
  const [invite, setInvite] = useState<MyInvite | null>(null);
  const [copied, setCopied] = useState(false);
  const { notify } = useApp();

  useEffect(() => {
    api.invites.mine().then(setInvite, () => undefined);
  }, []);

  async function copy() {
    if (!invite) return;
    try {
      await navigator.clipboard.writeText(`https://${invite.url}`);
      setCopied(true);
      notify("Invite link copied");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      notify("Copy is not available here");
    }
  }

  const frames = [
    { k: "film", cls: "left-1 top-8 h-[88px] w-[150px] border-lavender -rotate-3", badge: "bg-lavender", label: "Film" },
    { k: "book", cls: "right-3 top-0 h-[92px] w-[136px] border-lime rotate-3", badge: "bg-lime", label: "Book" },
    { k: "anime", cls: "left-20 top-[104px] h-[92px] w-[138px] border-pink -rotate-2", badge: "bg-pink", label: "Anime" },
    { k: "place", cls: "right-0 top-[88px] h-[86px] w-[142px] border-sky rotate-1", badge: "bg-sky", label: "Place" },
  ];

  return (
    <section className="mx-auto max-w-[390px] px-6 pb-8 pt-10 md:pt-16">
      <div aria-hidden className="relative mx-auto h-[210px] w-full max-w-[342px]">
        {frames.map((f) => (
          <div key={f.k} className={cn("absolute rounded-[20px] border-2 border-dashed", f.cls)}>
            <span className={cn("absolute left-3 top-3 rounded-full px-3 py-1 text-tag font-extrabold text-ink", f.badge)}>
              {f.label}
            </span>
          </div>
        ))}
      </div>
      <h2 className="mt-6 font-display text-[36px] font-extrabold leading-10 tracking-tight">Your feed is quiet.</h2>
      <p className="mt-4 text-lg leading-7 text-muted">
        Vouch only shows what your friends recommend. Invite two friends and the first vouches land here.
      </p>
      <div className="mt-6 flex h-[52px] items-center justify-between rounded-2xl bg-raised pl-4 pr-4 text-sm font-bold">
        <span className="truncate">{invite?.url ?? "…"}</span>
        <button type="button" onClick={copy} className="press focus-ring rounded px-1 font-extrabold text-lime">
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <Link href="/friends?tab=invite" className="btn-primary mt-3 w-full">
        Invite friends
      </Link>
      <button type="button" onClick={onVouch} className="btn-outline mt-3 w-full">
        Vouch something first
      </button>
    </section>
  );
}
