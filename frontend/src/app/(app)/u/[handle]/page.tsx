"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError, type Profile } from "@/lib/api";
import { useApp, useAuth } from "@/components/providers";
import { useAsync } from "@/hooks/use-async";
import { VouchCard } from "@/components/ui/cards";
import { Avatar, BackButton, Skeleton, TagPill } from "@/components/ui/primitives";
import { ErrorState } from "@/components/app/states";
import { cn } from "@/lib/format";

const TILTS = [-2, 1.5, -1, 2, -1.5, 1];

export default function ProfilePage() {
  const { handle } = useParams<{ handle: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [state, reload] = useAsync(() => api.profiles.get(handle), [handle]);

  const back = <BackButton onClick={() => (window.history.length > 1 ? router.back() : router.push("/feed"))} />;

  if (state.status === "loading") {
    return (
      <div className="mx-auto max-w-[720px] px-6 pt-6 md:px-10 md:pt-10" aria-busy="true">
        {back}
        <Skeleton className="mt-8 h-[120px] w-[120px]" />
        <Skeleton className="mt-6 h-10 w-56" />
      </div>
    );
  }
  if (state.status === "error") {
    // Strangers (and unknown handles) are indistinguishable: not found.
    const notFound = state.error instanceof ApiError && state.error.code === "not_found";
    return (
      <div className="mx-auto max-w-[720px] px-6 pt-6 md:px-10 md:pt-10">
        {back}
        <ErrorState
          title={notFound ? "Profile not found." : undefined}
          body={notFound ? "We could not find anyone by that name in your network." : undefined}
          onRetry={notFound ? undefined : reload}
        />
      </div>
    );
  }

  const p = state.data;
  return (
    <div className="mx-auto max-w-[720px] px-6 pb-8 pt-6 md:px-10 md:pt-10">
      {back}
      {p.relation === "fof" ? <FriendOfFriend p={p} onChange={reload} /> : <Friend p={p} youId={user?.id} />}
    </div>
  );
}

function Friend({ p, youId }: { p: Extract<Profile, { relation: "self" | "friend" }>; youId?: string }) {
  return (
    <>
      <header className="mt-6 flex items-center gap-4">
        <Avatar name={p.user.name} size="lg" />
        <div>
          <h1 className="font-display text-[36px] font-extrabold leading-10 tracking-tight">{p.user.name}</h1>
          <p className="text-muted">
            @{p.user.handle} · {p.friendCount} friends
          </p>
        </div>
      </header>

      <section className="mt-8" aria-labelledby="taste-h">
        <h2 id="taste-h" className="font-display text-xl font-extrabold">
          Taste you share
        </h2>
        {p.user.tags.length === 0 ? (
          <p className="mt-3 text-muted">No taste tags yet.</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {p.user.tags.map((t, i) => (
              <li key={t}>
                {/* Shared tags are cream; the rest recede. */}
                <TagPill tone={p.sharedTags.includes(t) ? "light" : "dark"} tilt={TILTS[i % TILTS.length]}>
                  {t}
                </TagPill>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8" aria-labelledby="v-h">
        <div className="flex items-baseline justify-between">
          <h2 id="v-h" className="font-display text-xl font-extrabold">
            Vouches
          </h2>
          <span className="text-sm text-muted">{p.vouches.length} total</span>
        </div>
        {p.vouches.length === 0 ? (
          <p className="mt-4 rounded-card bg-surface p-5 text-muted">No vouches yet.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {p.vouches.map((v) => (
              <li key={v.vouch.id}>
                <VouchCard view={v} youId={youId} href={`/show/${v.show.id}`} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function FriendOfFriend({ p, onChange }: { p: Extract<Profile, { relation: "fof" }>; onChange: () => void }) {
  const { notify } = useApp();
  const [busy, setBusy] = useState(false);
  // Add friend exists only when the backend says nominated:true.
  const canAdd = p.eligibility.nominated && p.requestState !== "outgoing";
  const label = p.requestState === "outgoing" ? "Request sent" : "Add friend";

  async function add() {
    setBusy(true);
    try {
      await api.friends.sendRequest(p.user.id);
      notify(p.requestState === "incoming" ? `You and ${p.user.name.split(" ")[0]} are friends` : "Friend request sent");
      onChange();
    } catch {
      notify("Could not send the request");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-12rem)] flex-col">
      <div className="mt-6 flex h-[120px] w-[120px] items-center justify-center rounded-full bg-cream font-display text-[56px] font-extrabold italic text-ink">
        {p.user.name.charAt(0)}
      </div>
      <h1 className="mt-6 font-display text-[44px] font-extrabold leading-[48px] tracking-tight">{p.user.name}</h1>
      <p className="mt-4 flex items-center gap-2 text-base font-extrabold">
        via
        <span className="inline-flex items-center gap-2 text-sm font-bold">
          <Avatar name={p.via.name} size="sm" />
          {p.via.name}
        </span>
      </p>

      <h2 className="mt-10 font-display text-2xl font-extrabold">Taste you share</h2>
      {p.sharedTags.length === 0 ? (
        <p className="mt-3 text-muted">No shared tags yet.</p>
      ) : (
        <ul className="mt-4 flex flex-wrap gap-3">
          {p.sharedTags.map((t, i) => (
            <li key={t}>
              <TagPill tilt={TILTS[i % TILTS.length]}>{t}</TagPill>
            </li>
          ))}
        </ul>
      )}

      {p.eligibility.nominated && (
        <div className={cn("mt-auto pt-16")}>
          <button type="button" onClick={add} disabled={!canAdd || busy} className="btn-primary w-full">
            {busy ? "Sending…" : label}
          </button>
        </div>
      )}
    </div>
  );
}
