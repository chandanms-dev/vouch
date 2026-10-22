"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAsync } from "@/hooks/use-async";
import { MiniCard } from "@/components/ui/cards";
import { Avatar, Skeleton } from "@/components/ui/primitives";
import { ErrorState } from "@/components/app/states";

export default function InvitePage() {
  const { code } = useParams<{ code: string }>();
  const [state, reload] = useAsync(() => api.invites.preview(code), [code]);

  if (state.status === "loading") {
    return (
      <main className="mx-auto max-w-[430px] px-6 pt-24" aria-busy="true">
        <Skeleton className="h-[88px] w-[88px]" />
        <Skeleton className="mt-8 h-24 !rounded-2xl" />
      </main>
    );
  }
  if (state.status === "error") {
    return (
      <main className="mx-auto max-w-[430px]">
        <ErrorState
          title="That invite is not valid."
          body="It may have expired. Ask your friend for a new link."
          onRetry={reload}
          action={
            <Link href="/sign-in" className="btn-outline mt-3 w-full">
              Back to sign in
            </Link>
          }
        />
      </main>
    );
  }

  const { inviter, sampleVouches } = state.data;
  const layout = [
    "absolute left-0 top-0 w-[200px]",
    "absolute right-0 top-[26px] w-[172px]",
    "absolute left-[20px] top-[164px] w-[200px]",
  ];
  const tilts = [-4, 4, 3];

  return (
    <main className="mx-auto flex min-h-screen max-w-[430px] flex-col px-6 pb-8 pt-16">
      <div className="flex items-center gap-4">
        <Avatar name={inviter.name} size="xl" className="!h-[88px] !w-[88px] !text-[40px]" />
        <div>
          <p className="text-sm font-bold">{inviter.name}</p>
          <p className="text-sm text-muted">Sent you an invite</p>
        </div>
      </div>
      <h1 className="mt-8 font-display text-[40px] font-extrabold leading-[44px] tracking-tight">
        {inviter.name} invited you to Vouch.
      </h1>
      <p className="mt-4 text-muted">
        TV shows and anime, recommended by people you actually know. Join {inviter.name} and see what they
        have vouched for.
      </p>
      <div aria-hidden className="relative mt-8 h-[320px]">
        {sampleVouches.slice(0, 3).map((v, i) => (
          <MiniCard
            key={v.vouch.id}
            kind={v.show.kind}
            title={v.show.title}
            name={inviter.name}
            tilt={tilts[i]}
            className={layout[i]}
          />
        ))}
      </div>
      <div className="mt-auto pt-6">
        <Link href={`/sign-in?invite=${encodeURIComponent(code)}`} className="btn-primary w-full">
          Sign up with email
        </Link>
        <p className="mt-4 text-center text-sm text-muted">
          Already on Vouch?{" "}
          <Link href="/sign-in" className="font-bold text-cream underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
