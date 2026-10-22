"use client";

import Link from "next/link";
import { api } from "@/lib/api";
import { useApp, useAuth } from "@/components/providers";
import { useAsync } from "@/hooks/use-async";
import { VouchCard } from "@/components/ui/cards";
import { Avatar, TagPill } from "@/components/ui/primitives";
import { PlusIcon } from "@/components/ui/icons";
import { EmptyState, ErrorState } from "@/components/app/states";
import { CardSkeleton } from "@/components/app/skeletons";
import { OwnVouchActions } from "@/components/app/vouch-actions";

export default function MePage() {
  const { user, signOut } = useAuth();
  const { version, openComposer } = useApp();
  const [vouches, reload] = useAsync(() => api.vouches.mine(), [version]);
  const [friends] = useAsync(() => api.friends.list(), []);
  if (!user) return null;

  const tilts = [-2, 1.5, -1, 2, -1.5, 1];

  return (
    <div className="mx-auto max-w-[720px] px-6 pb-8 pt-8 md:px-10 md:pt-12">
      <header className="flex items-center gap-4">
        <Avatar name={user.name} size="lg" />
        <div>
          <h1 className="font-display text-[36px] font-extrabold leading-10 tracking-tight">{user.name}</h1>
          <p className="text-muted">@{user.handle}</p>
        </div>
      </header>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {/* No edit-profile design yet: a disabled chip, like the other coming-soon items. */}
        <button
          type="button"
          aria-disabled="true"
          tabIndex={-1}
          onClick={(e) => e.preventDefault()}
          className="flex h-12 cursor-not-allowed flex-col items-center justify-center rounded-full bg-raised text-sm font-extrabold text-muted"
        >
          Edit profile
          <span className="text-[11px] font-bold leading-none text-muted">Coming soon</span>
        </button>
        <Link href="/friends" className="btn-primary h-12 text-sm">
          Friends · {friends.status === "ready" ? friends.data.length : "…"}
        </Link>
      </div>

      <section className="mt-8" aria-labelledby="taste-h">
        <h2 id="taste-h" className="font-display text-xl font-extrabold">
          My taste
        </h2>
        {user.tags.length === 0 ? (
          <p className="mt-3 text-muted">Your taste tags appear here once you have vouched for a few things.</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {user.tags.map((t, i) => (
              <li key={t}>
                <TagPill tilt={tilts[i % tilts.length]}>{t}</TagPill>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8" aria-labelledby="vouches-h">
        <div className="flex items-baseline justify-between">
          <h2 id="vouches-h" className="font-display text-xl font-extrabold">
            My vouches
          </h2>
          {vouches.status === "ready" && <span className="text-sm text-muted">{vouches.data.length} total</span>}
        </div>
        {vouches.status === "loading" && (
          <div className="mt-4 space-y-4" aria-busy="true" aria-label="Loading your vouches">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}
        {vouches.status === "error" && <ErrorState onRetry={reload} />}
        {vouches.status === "ready" && vouches.data.length === 0 && (
          <EmptyState
            tone="lavender"
            icon={<PlusIcon width={36} height={36} />}
            title="No vouches yet."
            body="Vouch for a show and it lands here."
            action={
              <button type="button" onClick={() => openComposer()} className="btn-primary w-full">
                Add a vouch
              </button>
            }
          />
        )}
        {vouches.status === "ready" && (
          <ul className="mt-4 space-y-4">
            {vouches.data.map((v) => (
              <li key={v.vouch.id}>
                <VouchCard
                  view={v}
                  youId={user.id}
                  href={`/show/${v.show.id}`}
                  actions={<OwnVouchActions view={v} />}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <button
        type="button"
        onClick={signOut}
        className="btn-outline mt-10 h-11 w-full text-sm"
      >
        Sign out
      </button>
      {api.demo && (
        <button
          type="button"
          onClick={async () => {
            await api.demo?.reset();
            window.location.assign("/me");
          }}
          className="press focus-ring mt-3 h-11 w-full rounded-full text-sm font-bold text-muted underline underline-offset-4"
        >
          Reset demo data
        </button>
      )}
    </div>
  );
}
