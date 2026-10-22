"use client";

import { useEffect, useRef, useState } from "react";
import { api, type Show, type Vouch } from "@/lib/api";
import { cn } from "@/lib/format";
import { Sheet, SheetClose } from "@/components/ui/sheet";
import { ChevronRightIcon, CloseIcon, SearchIcon } from "@/components/ui/icons";
import { TypeBadge } from "@/components/ui/primitives";
import { EmptyState, ErrorState } from "@/components/app/states";
import { KIND, type VisualKind } from "@/components/ui/kind";

const MAX_REVIEW = 280;
const MAX_TAGS = 5;
const MIN_QUERY = 3;

/** Type chips. Only Shows is active in the MVP. */
const CHIPS: { id: string; label: string; kind: VisualKind; active: boolean }[] = [
  { id: "shows", label: "Shows", kind: "tv", active: true },
  { id: "film", label: "Film", kind: "film", active: false },
  { id: "book", label: "Book", kind: "book", active: false },
  { id: "food", label: "Food", kind: "place", active: false },
];

export function Composer({
  open,
  initialShow,
  initialVouch,
  onClose,
  onPosted,
}: {
  open: boolean;
  initialShow?: Show;
  /** Set to edit one of the viewer's own vouches; the rate step opens prefilled. */
  initialVouch?: Vouch;
  onClose: () => void;
  /** `edited` is true when an existing vouch was saved rather than a new one posted. */
  onPosted: (edited: boolean) => void;
}) {
  const [show, setShow] = useState<Show | null>(null);

  useEffect(() => {
    if (open) setShow(initialShow ?? null);
  }, [open, initialShow]);

  return (
    <Sheet open={open} onClose={onClose} label="Add a vouch">
      {show ? (
        <RateStep
          key={show.id}
          show={show}
          vouch={initialVouch?.showId === show.id ? initialVouch : undefined}
          onClose={onClose}
          onPosted={(edited) => {
            onPosted(edited);
            onClose();
          }}
        />
      ) : (
        <SearchStep onPick={setShow} onClose={onClose} />
      )}
    </Sheet>
  );
}

function SearchStep({ onPick, onClose }: { onPick: (s: Show) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Show[] | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const typed = query.trim().length;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_QUERY) {
      setResults(null);
      setLoading(false);
      return;
    }
    let live = true;
    setLoading(true);
    const t = setTimeout(() => {
      api.shows.search(q).then(
        (r) => {
          if (!live) return;
          setResults(r);
          setError(false);
          setLoading(false);
        },
        () => {
          if (!live) return;
          setError(true);
          setLoading(false);
        },
      );
    }, 200);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [query, attempt]);

  return (
    <div className="animate-step-in px-6 pb-6 pt-4 md:pt-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-[22px] font-extrabold leading-6">What are you vouching for?</h2>
          <p className="mt-1 text-sm text-muted">Step 1 of 2 · Find it</p>
        </div>
        <SheetClose onClick={onClose} />
      </div>

      <div className="-mx-2 mt-2 grid grid-cols-4 gap-1.5 px-2 py-2" role="tablist" aria-label="What kind of thing">
        {CHIPS.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={c.active}
            aria-disabled={!c.active}
            tabIndex={c.active ? 0 : -1}
            onClick={(e) => !c.active && e.preventDefault()}
            className={cn(
              "flex min-w-0 flex-col items-center justify-center rounded-full px-1 py-1 text-[13px] font-extrabold",
              c.active ? cn("press focus-ring text-ink", KIND[c.kind].field, "ring-2 ring-cream ring-offset-2 ring-offset-surface") : "cursor-not-allowed bg-raised text-muted",
            )}
          >
            <span className="inline-flex h-7 items-center gap-1.5">
              <span>{KIND[c.kind].icon}</span>
              {c.label}
            </span>
            {!c.active && <span className="-mt-1 whitespace-nowrap pb-1 text-[10px] font-bold text-muted">Coming soon</span>}
          </button>
        ))}
      </div>

      <label className="relative mt-4 block">
        <span className="sr-only">Search shows</span>
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" width={20} height={20} />
        <input
          ref={inputRef}
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search TV and anime"
          className="h-[52px] w-full rounded-2xl border-2 border-cream bg-raised pl-12 pr-12 text-base text-cream outline-none placeholder:text-muted focus-visible:border-lime"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="press focus-ring absolute right-1 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full"
          >
            <CloseIcon width={18} height={18} />
          </button>
        )}
      </label>

      <div className="mt-4 min-h-[280px]" aria-live="polite">
        {error ? (
          <ErrorState
            compact
            title="Search is not working."
            body="We could not reach the show database. Try again in a moment."
            onRetry={() => {
              setError(false);
              setAttempt((a) => a + 1);
            }}
          />
        ) : loading && !results ? (
          <ul className="space-y-2">
            {[0, 1, 2].map((i) => (
              <li key={i} className="h-24 animate-pulse-soft rounded-2xl bg-raised" />
            ))}
          </ul>
        ) : results && results.length === 0 ? (
          <EmptyState
            compact
            tone="pink"
            icon={<SearchIcon width={36} height={36} />}
            title={`Nothing matches “${query.trim()}”.`}
            body="Check the spelling or try the original title. Not a show? Film, Book and Food are coming soon."
          />
        ) : typed > 0 && typed < MIN_QUERY ? (
          <p className="py-12 text-center text-muted">Keep typing…</p>
        ) : results ? (
          <ul className={cn("space-y-2", loading && "opacity-60 transition-opacity")}>
            {results.map((s, i) => (
              <li key={s.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                <button
                  type="button"
                  onClick={() => onPick(s)}
                  className="press focus-ring flex w-full items-center gap-4 rounded-2xl bg-raised p-2 text-left"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "flex h-20 w-14 shrink-0 items-center justify-center rounded-xl font-display text-xl font-extrabold text-ink",
                      KIND[s.kind].field,
                    )}
                  >
                    {s.title
                      .split(/\s+/)
                      .filter((w) => /[A-Za-z]/.test(w))
                      .slice(0, 2)
                      .map((w) => w[0]!.toUpperCase())
                      .join("")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-lg font-extrabold">{s.title}</span>
                    <span className="block text-sm text-muted">
                      {KIND[s.kind].label} · {s.year} · {s.credit}
                    </span>
                  </span>
                  <ChevronRightIcon className="mr-2 shrink-0 text-muted" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-12 text-center text-muted">Start typing a title to find it.</p>
        )}
      </div>
      <p className="mt-4 text-center text-xs text-muted">TV and anime data from TMDB</p>
    </div>
  );
}

function RateStep({
  show,
  vouch,
  onClose,
  onPosted,
}: {
  show: Show;
  vouch?: Vouch;
  onClose: () => void;
  onPosted: (edited: boolean) => void;
}) {
  const editing = !!vouch;
  const [rating, setRating] = useState(vouch?.rating ?? 0);
  const [review, setReview] = useState(vouch?.review ?? "");
  const [tags, setTags] = useState<string[]>(vouch?.tags ?? []);
  const [addingTag, setAddingTag] = useState(false);
  const [draftTag, setDraftTag] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function commitTag() {
    const t = draftTag.trim().toLowerCase().replace(/\s+/g, "-");
    if (t && !tags.includes(t) && tags.length < MAX_TAGS) setTags([...tags, t]);
    setDraftTag("");
    setAddingTag(false);
  }

  async function post() {
    setBusy(true);
    setError(null);
    try {
      if (vouch) await api.vouches.update(vouch.id, { rating, review, tags });
      else await api.vouches.create({ showId: show.id, rating, review, tags });
      onPosted(editing);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not post");
      setBusy(false);
    }
  }

  return (
    <div className="animate-step-in px-6 pb-6 pt-4 md:pt-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold leading-7">
            {editing ? `Edit your vouch for ${show.title}` : `How was ${show.title}?`}
          </h2>
          <TypeBadge kind={show.kind} onField={false} className="mt-3" />
        </div>
        <SheetClose onClick={onClose} />
      </div>

      <fieldset className="mt-5">
        <legend className="text-sm font-semibold text-muted">Your rating</legend>
        <div className="mt-3 grid grid-cols-5 gap-3">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={rating === n}
              onClick={() => setRating(n)}
              className={cn(
                "press focus-ring flex aspect-square items-center justify-center rounded-full border-2 border-muted font-display text-xl font-extrabold",
                rating === n ? "bg-cream text-ink" : "text-cream",
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-5">
        <div className="flex items-center justify-between text-sm font-semibold text-muted">
          <label htmlFor="review">Your review</label>
          <span aria-live="off">
            {review.length} / {MAX_REVIEW}
          </span>
        </div>
        <textarea
          id="review"
          value={review}
          maxLength={MAX_REVIEW}
          onChange={(e) => setReview(e.target.value)}
          rows={4}
          placeholder="Say why, in your own words"
          className="mt-2 w-full resize-none rounded-2xl bg-raised p-4 text-base text-cream outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-lime"
        />
      </div>

      <ul className="mt-3 flex flex-wrap items-center gap-2">
        {tags.map((t) => (
          <li key={t}>
            <button
              type="button"
              onClick={() => setTags(tags.filter((x) => x !== t))}
              aria-label={`Remove tag ${t}`}
              className="press inline-flex h-7 items-center rounded-full bg-cream px-3 text-tag font-semibold text-ink"
            >
              {t}
            </button>
          </li>
        ))}
        {tags.length < MAX_TAGS &&
          (addingTag ? (
            <li>
              <input
                autoFocus
                value={draftTag}
                maxLength={24}
                onChange={(e) => setDraftTag(e.target.value)}
                onBlur={commitTag}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitTag();
                  }
                }}
                aria-label="New tag"
                className="h-7 w-28 rounded-full border-2 border-dashed border-cream bg-transparent px-3 text-tag font-semibold text-cream outline-none"
              />
            </li>
          ) : (
            <li>
              <button
                type="button"
                onClick={() => setAddingTag(true)}
                className="press inline-flex h-7 items-center rounded-full border-2 border-dashed border-cream px-3 text-tag font-semibold"
              >
                + tag
              </button>
            </li>
          ))}
      </ul>

      {error && (
        <p role="alert" className="mt-3 text-sm font-semibold text-pink">
          {error}
        </p>
      )}

      <button type="button" disabled={rating === 0 || busy} onClick={post} className="btn-primary mt-6 w-full">
        {busy ? (editing ? "Saving…" : "Posting…") : editing ? "Save changes" : "Post vouch"}
      </button>
      <button type="button" onClick={onClose} className="press focus-ring mt-2 h-12 w-full rounded-full text-base font-extrabold">
        Cancel
      </button>
    </div>
  );
}
