"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/components/providers";
import { useAsync } from "@/hooks/use-async";
import { VouchCard } from "@/components/ui/cards";
import { Avatar, Skeleton, TagPill } from "@/components/ui/primitives";
import { ErrorState } from "@/components/app/states";

export default function MePage() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const [vouches, reload] = useAsync(() => api.vouches.mine(), []);
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
        {/* The Figma export has no edit-profile screen yet; the button is inert. */}
        <button type="button" className="btn-outline h-11 text-sm">
          Edit profile
        </button>
        <Link href="/friends" className="btn-primary h-11 text-sm">
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
        {vouches.status === "loading" && <Skeleton className="mt-4 h-60 !rounded-card" />}
        {vouches.status === "error" && <ErrorState onRetry={reload} />}
        {vouches.status === "ready" && vouches.data.length === 0 && (
          <p className="mt-4 rounded-card bg-surface p-5 text-muted">You have not vouched for anything yet. Tap + to start.</p>
        )}
        {vouches.status === "ready" && (
          <ul className="mt-4 space-y-4">
            {vouches.data.map((v) => (
              <li key={v.vouch.id}>
                <VouchCard view={v} youId={user.id} href={`/show/${v.show.id}`} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <button
        type="button"
        onClick={async () => {
          await api.auth.signOut();
          setUser(null);
          router.replace("/sign-in");
        }}
        className="press focus-ring mt-10 text-sm font-bold text-muted underline underline-offset-4"
      >
        Sign out
      </button>
    </div>
  );
}
