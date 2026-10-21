"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError, type ShowDetail } from "@/lib/api";
import { useApp, useAuth } from "@/components/providers";
import { useAsync } from "@/hooks/use-async";
import { VouchCard } from "@/components/ui/cards";
import { Avatar, BackButton, Skeleton, TagPill, TypeBadge } from "@/components/ui/primitives";
import { KIND } from "@/components/ui/kind";
import { ErrorState } from "@/components/app/states";
import { cn } from "@/lib/format";

export default function ShowPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { version } = useApp();
  const [state, reload] = useAsync(() => api.shows.detail(id), [id, version]);

  const back = <BackButton onClick={() => (window.history.length > 1 ? router.back() : router.push("/feed"))} />;

  if (state.status === "loading") {
    return (
      <div className="mx-auto max-w-[1200px] px-4 pt-6 md:px-10 md:pt-10" aria-busy="true">
        {back}
        <Skeleton className="mt-6 h-72 !rounded-card" />
      </div>
    );
  }
  if (state.status === "error") {
    const notFound = state.error instanceof ApiError && state.error.code === "not_found";
    return (
      <div className="mx-auto max-w-[1200px] px-4 pt-6 md:px-10 md:pt-10">
        {back}
        <ErrorState
          title={notFound ? "We could not find that show." : undefined}
          body={notFound ? "It may have been removed." : undefined}
          onRetry={notFound ? undefined : reload}
        />
      </div>
    );
  }
  return <Detail d={state.data} back={back} youId={user?.id} />;
}

function Detail({ d, back, youId }: { d: ShowDetail; back: React.ReactNode; youId?: string }) {
  const { openComposer } = useApp();
  const { show } = d;
  const k = KIND[show.kind];
  const total = d.friendCount + d.fofCount;
  const everyone = [...d.direct, ...d.fof];
  const meta = `${k.label} · ${show.year} · ${show.kind === "anime" ? "Studio" : "By"} ${show.credit}`;
  const cta = d.myVouch ? "Update your vouch" : "Add your vouch";

  const average = (
    <div className="flex items-center gap-3">
      <span className="font-display text-[56px] font-extrabold leading-none tracking-tight md:text-[56px]">
        {d.friendsAverage ?? "–"}
      </span>
      <div className="text-meta leading-4">
        <p className="text-sm font-bold">friends’ average</p>
        <p>
          {d.friendCount} friend{d.friendCount === 1 ? "" : "s"} · {d.fofCount} friend{d.fofCount === 1 ? "" : "s"} of friends
        </p>
      </div>
    </div>
  );

  const sections = (cols: string) => (
    <>
      <section aria-labelledby="friends-h">
        <div className="flex items-baseline justify-between">
          <div>
            <h2 id="friends-h" className="font-display text-[28px] font-extrabold leading-8 md:text-[32px] md:leading-9">
              Your friends
            </h2>
            <p className="mt-1 hidden text-sm text-muted md:block">
              {d.friendCount} vouch{d.friendCount === 1 ? "" : "es"}
            </p>
          </div>
          <span className="text-sm text-muted md:hidden">
            {d.friendCount} vouch{d.friendCount === 1 ? "" : "es"}
          </span>
        </div>
        {d.direct.length === 0 ? (
          <p className="mt-4 rounded-card bg-surface p-5 text-muted">None of your friends have vouched for this yet.</p>
        ) : (
          <ul className={cn("mt-4 grid gap-4", cols)}>
            {d.direct.map((v) => (
              <li key={v.vouch.id}>
                <VouchCard view={v} youId={youId} className="h-full" />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="fof-h" className="mt-10 md:mt-12">
        <h2 id="fof-h" className="font-display text-[28px] font-extrabold leading-8 md:text-[32px] md:leading-9">
          Friends of friends
        </h2>
        <p className="mt-1 text-sm text-muted">
          Vouched by people your friends trust. The “via” tag shows who connects you.
        </p>
        {d.fof.length === 0 ? (
          <p className="mt-4 rounded-card bg-surface p-5 text-muted">No friends of friends have vouched for this yet.</p>
        ) : (
          <ul className={cn("mt-4 grid gap-4", cols)}>
            {d.fof.map((v) => (
              <li key={v.vouch.id}>
                <VouchCard view={v} youId={youId} className="h-full" />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );

  return (
    <>
      {/* Mobile */}
      <div className="md:hidden">
        <div className="px-4 pt-6">{back}</div>
        <section className={cn("mt-4 rounded-b-[32px] px-6 pb-8 pt-6 text-ink animate-fade-in", k.field)}>
          <TypeBadge kind={show.kind} />
          <h1 className="mt-3 font-display text-[34px] font-extrabold leading-9 tracking-tight">{show.title}</h1>
          <p className="mt-3 text-base">{meta}</p>
          <div className="mt-5">{total > 0 ? average : <p className="font-semibold">No ratings from your network yet.</p>}</div>
        </section>
        <div className="px-4 pt-8">{sections("grid-cols-1")}</div>
        <div className="px-4 pt-8">
          <button type="button" onClick={() => openComposer({ show })} className="btn-primary w-full">
            {cta}
          </button>
        </div>
      </div>

      {/* Desktop */}
      <div className="mx-auto hidden max-w-[1200px] px-10 pt-10 md:block">
        {back}
        <div className="mt-6 grid grid-cols-[400px_1fr] items-start gap-10">
          <div className="space-y-4">
            <section className={cn("rounded-[32px] p-8 text-ink animate-fade-in", k.field)}>
              <TypeBadge kind={show.kind} />
              <h1 className="mt-4 font-display text-[56px] font-extrabold leading-[56px] tracking-tight">{show.title}</h1>
              <p className="mt-4 text-base">{meta}</p>

              {everyone.length > 0 && (
                <>
                  <h2 className="mt-14 text-sm font-semibold">Who rated it</h2>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {everyone.map((v) => {
                      const fof = !!v.author.via;
                      return (
                        <li key={v.vouch.id}>
                          <Link
                            href={`/u/${v.author.handle}`}
                            className={cn(
                              "press focus-ring inline-flex h-9 items-center gap-2 rounded-full bg-cream pl-1 pr-3 text-sm font-bold text-ink",
                              fof && "border-2 border-dashed border-ink",
                            )}
                          >
                            <Avatar name={v.author.name} size="sm" tone={fof ? "ink" : "cream"} className={fof ? "" : "ring-1 ring-ink/20"} />
                            {v.author.name.split(" ")[0]}
                            <span className="font-display text-base font-extrabold">{v.vouch.rating}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}

              <div className="mt-8">{total > 0 ? average : <p className="font-semibold">No ratings from your network yet.</p>}</div>
              {d.tags.length > 0 && (
                <ul className="mt-5 flex flex-wrap gap-2">
                  {d.tags.map((t) => (
                    <li key={t}>
                      <TagPill>{t}</TagPill>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={() => openComposer({ show })}
                className="btn mt-5 w-full bg-ink text-cream hover:bg-ink/90"
              >
                {cta}
              </button>
            </section>
          </div>
          <div>{sections("grid-cols-2")}</div>
        </div>
      </div>
    </>
  );
}
