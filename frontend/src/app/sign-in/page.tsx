"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, PROTOTYPE_EMPTY_EMAIL } from "@/lib/api";
import { useApp } from "@/components/providers";
import { MiniCard } from "@/components/ui/cards";
import { Logo } from "@/components/ui/primitives";

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignIn />
    </Suspense>
  );
}

function SignIn() {
  const router = useRouter();
  const params = useSearchParams();
  const invite = params.get("invite") ?? undefined;
  const { setPendingEmail } = useApp();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(address: string) {
    setBusy(true);
    setError(null);
    try {
      await api.auth.requestMagicLink(address, invite);
      setPendingEmail(address.trim());
      router.push("/auth/check-email");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    void send(email);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[430px] flex-col px-6 pb-8 pt-14">
      <Logo className="text-[96px]" />
      <h1 className="mt-6 max-w-[320px] font-display text-2xl font-extrabold leading-7">
        Recommendations from people you actually know.
      </h1>

      <div aria-hidden className="relative mt-6 h-[340px] w-full">
        <MiniCard kind="tv" title="Severance" name="Maya" score={9} tilt={-4} className="absolute left-[-8px] top-0 w-[200px]" />
        <MiniCard kind="anime" title="Frieren" name="Dev" score={10} tilt={4} className="absolute right-[-8px] top-1 w-[184px]" />
        <MiniCard kind="tv" title="The Bear" name="Sam" score={8} tilt={-4} className="absolute left-0 top-[140px] w-[186px]" />
        <MiniCard kind="anime" title="Bocchi the Rock!" name="Priya" score={9} tilt={3} className="absolute right-0 top-[188px] w-[190px]" />
      </div>

      <form onSubmit={submit} className="mt-auto pt-6">
        <label htmlFor="email" className="sr-only">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="h-14 w-full rounded-2xl bg-surface px-4 text-base text-cream outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-lime"
        />
        {error && (
          <p role="alert" className="mt-2 text-sm font-semibold text-pink">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy || !email.trim()} className="btn-primary mt-4 h-14 w-full">
          {busy ? "Sending…" : "Send me a magic link"}
        </button>
        <p className="mt-4 text-center text-sm text-muted">
          Vouch is invite-only. Got a code?{" "}
          <Link href="/#code" className="font-bold text-cream underline underline-offset-4">
            Enter invite
          </Link>
        </p>
        <p className="mt-3 text-center text-xs text-muted">
          Prototype: any email opens the full demo feed.
          <button
            type="button"
            disabled={busy}
            onClick={() => void send(PROTOTYPE_EMPTY_EMAIL)}
            className="focus-ring mx-auto flex min-h-11 items-center rounded font-bold text-cream underline underline-offset-4"
          >
            Prototype: see empty state
          </button>
        </p>
      </form>
    </main>
  );
}
