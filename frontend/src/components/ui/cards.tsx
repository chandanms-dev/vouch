import Link from "next/link";
import type { AnticipationView, VouchView } from "@/lib/api";
import { cn, timeAgo } from "@/lib/format";
import { Avatar, AuthorPill, ScoreBadge, TagPill, TypeBadge } from "./primitives";
import { KIND, type VisualKind } from "./kind";

const metaLine = (v: VouchView["show"]) => `${KIND[v.kind].label} · ${v.year} · ${v.credit}`;

export interface CardData {
  kind: VisualKind;
  title: string;
  meta: string;
  review: string;
  tags: string[];
  rating: number;
  author: string;
  via?: string;
  /** Profile links; omit for static illustrations. */
  authorHref?: string;
  viaHref?: string;
  createdAt?: string;
  timeLabel?: string;
}

/** Presentational card: solid field for friends, dark + bordered + dashed "via" pill for friends of friends. */
export function VouchCardBody({
  data,
  className,
  compact,
  href,
}: {
  data: CardData;
  className?: string;
  compact?: boolean;
  /** Makes the whole card a link to this show (a stretched link on the title). */
  href?: string;
}) {
  const k = KIND[data.kind];
  const fof = !!data.via;
  return (
    <article
      className={cn(
        "text-left",
        href && "press relative",
        compact ? "rounded-[20px] p-3" : "rounded-card p-4",
        fof ? cn("border-2 bg-surface text-cream", k.border) : cn(k.field, "text-ink"),
        className,
      )}
    >
      <header className="flex items-start justify-between">
        <TypeBadge kind={data.kind} onField={!fof} />
        <ScoreBadge value={data.rating} size={fof ? "sm" : "lg"} tilted={!fof} />
      </header>
      <h3 className={cn("font-display font-extrabold", compact ? "text-lg leading-6" : "text-card", fof ? "mt-2" : "mt-1")}>
        {href ? (
          <Link
            href={href}
            aria-label={`${data.title}, rated ${data.rating}`}
            className="focus-ring after:absolute after:inset-0 after:rounded-[inherit] after:content-['']"
          >
            {data.title}
          </Link>
        ) : (
          data.title
        )}
      </h3>
      <p className={cn("mt-2 text-meta", fof && "text-muted")}>{data.meta}</p>
      <p className={cn(compact ? "mt-3 text-[13px] leading-[18px]" : "mt-4 text-base")}>{data.review}</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {data.tags.map((t) => (
          <li key={t}>
            <TagPill tone={fof ? "dark" : "light"}>{t}</TagPill>
          </li>
        ))}
      </ul>
      <footer className="mt-3 flex items-center justify-between">
        <AuthorPill name={data.author} via={data.via} href={data.authorHref} viaHref={data.viaHref} />
        <time dateTime={data.createdAt} className={cn("text-meta", fof && "text-muted")}>
          {data.timeLabel ?? (data.createdAt ? timeAgo(data.createdAt) : "")}
        </time>
      </footer>
    </article>
  );
}

export function VouchCard({
  view,
  youId,
  href,
  className,
}: {
  view: VouchView;
  youId?: string;
  href?: string;
  className?: string;
}) {
  const { vouch, show, author } = view;
  const first = (n: string) => n.split(" ")[0]!;
  const you = youId === author.id;
  return (
    <VouchCardBody
      className={className}
      href={href}
      data={{
        kind: show.kind,
        title: show.title,
        meta: metaLine(show),
        review: vouch.review,
        tags: vouch.tags,
        rating: vouch.rating,
        author: you ? "You" : first(author.name),
        authorHref: you ? "/me" : `/u/${author.handle}`,
        via: author.via ? first(author.via.name) : undefined,
        viaHref: author.via ? `/u/${author.via.handle}` : undefined,
        createdAt: vouch.createdAt,
      }}
    />
  );
}

const STACK_TONES = ["lavender", "lime", "pink"] as const;

export function AnticipationCard({
  item,
  onMeToo,
}: {
  item: AnticipationView;
  onMeToo: (a: AnticipationView) => void;
}) {
  const { show, waiting, joined } = item;
  const k = KIND[show.kind];
  const count = waiting.length;
  return (
    <article className={cn("rounded-card border-2 border-dashed bg-surface p-4", k.dashed)}>
      <header className="flex items-center justify-between">
        <TypeBadge kind={show.kind} onField={false} />
        <span className={cn("inline-flex h-7 items-center rounded-full border-2 px-3 text-tag font-extrabold", k.border)}>
          Upcoming
        </span>
      </header>
      <h3 className="mt-3 font-display text-card font-extrabold">{show.title}</h3>
      <p className="mt-2 text-meta text-muted">
        {k.label} · {show.releaseLabel} · {show.credit}
      </p>
      <footer className="mt-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex -space-x-2">
            {waiting.slice(0, 3).map((w, i) => (
              <Avatar key={w.user.id} name={w.user.name} size="md" tone={STACK_TONES[i % 3]} className="ring-2 ring-surface" />
            ))}
          </div>
          <span className="text-sm">
            {count} friend{count === 1 ? "" : "s"} waiting
          </span>
        </div>
        {joined ? (
          <span className="inline-flex h-11 items-center rounded-full bg-raised px-5 text-sm font-extrabold">You&apos;re in</span>
        ) : (
          <button type="button" onClick={() => onMeToo(item)} className="btn-outline h-11 px-5 text-sm">
            Me too
          </button>
        )}
      </footer>
    </article>
  );
}

/** Small tilted card used in splash, invite and landing collages. */
export function MiniCard({
  kind,
  title,
  name,
  score,
  tilt = 0,
  className,
}: {
  kind: VisualKind;
  title: string;
  name: string;
  score?: number;
  tilt?: number;
  className?: string;
}) {
  const k = KIND[kind];
  return (
    <div
      aria-hidden
      style={{ transform: `rotate(${tilt}deg)` }}
      className={cn("rounded-[20px] p-3 text-ink", k.field, className)}
    >
      <div className="flex items-start justify-between">
        <TypeBadge kind={kind} className="h-6 text-xs" />
        {score !== undefined && <ScoreBadge value={score} size="sm" tilted={false} />}
      </div>
      <p className="mt-1 font-display text-lg font-extrabold leading-6">{title}</p>
      <div className="mt-2">
        <AuthorPill name={name} size="sm" />
      </div>
    </div>
  );
}
