"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { VouchCardBody, type CardData } from "@/components/ui/cards";
import { AuthorPill, Logo, TagPill } from "@/components/ui/primitives";
import { cn } from "@/lib/format";

const SEVERANCE: CardData = {
  kind: "tv", title: "Severance", meta: "TV · 2022 · Dan Erickson",
  review: "Office horror that is really about grief. Do not read anything about it first.",
  tags: ["mind-bending", "slow-burn"], rating: 9, author: "Maya", timeLabel: "2d ago",
};
const FRIEREN: CardData = {
  kind: "anime", title: "Frieren: Beyond Journey's End", meta: "Anime · 2023 · Madhouse",
  review: "An elf outlives her friends and then goes to learn who they were. Quietly devastating, weirdly funny.",
  tags: ["cry-trip", "found-family"], rating: 10, author: "Dev", timeLabel: "2d ago",
};
const BOCCHI: CardData = {
  kind: "anime", title: "Bocchi the Rock!", meta: "Anime · 2022 · CloverWorks",
  review: "Painfully relatable and the funniest thing I watched all year.",
  tags: ["feel-good", "short"], rating: 9, author: "Priya", timeLabel: "4d ago",
};
const BEAR: CardData = {
  kind: "tv", title: "The Bear", meta: "TV · 2022 · Christopher Storer",
  review: "Loud kitchen, tender centre. Season two is the one.",
  tags: ["feel-good", "intense"], rating: 8, author: "Sam", timeLabel: "3d ago",
};
const FRIEREN_FOF: CardData = {
  kind: "anime", title: "Frieren: Beyond Journey's End", meta: "Anime · 2023 · Madhouse",
  review: "Slow at first, then I watched it twice. Go in blind.",
  tags: ["slow-burn", "rewatch"], rating: 9, author: "Arjun", via: "Dev", timeLabel: "1w ago",
};

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function LandingPage() {
  return (
    <div className="overflow-x-clip bg-ink">
      <Nav />
      <main>
        <Hero />
        <HowItWorks />
        <Path />
        <Code />
      </main>
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-5 md:px-20 md:py-7">
      <Logo className="text-logo" />
      <nav aria-label="Landing" className="flex items-center gap-6 text-label font-bold">
        <a href="#how" className="hidden hover:text-lime md:inline">How it works</a>
        <a href="#path" className="hidden hover:text-lime md:inline">Why “via”</a>
        <a href="#code" className="hidden hover:text-lime md:inline">Invite code</a>
        <a href="#code" className="press focus-ring inline-flex h-11 items-center rounded-full bg-cream px-4 text-ink">
          Join the waitlist
        </a>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-auto grid max-w-[1440px] gap-10 px-6 pb-16 pt-10 md:grid-cols-[1fr_1.1fr] md:items-center md:gap-8 md:px-20 md:pb-28 md:pt-14">
      <div>
        <h1 className="font-display text-hero-sm font-extrabold md:text-hero">
          Taste you can trust.
        </h1>
        <p className="mt-6 max-w-[420px] text-body md:text-lead">
          Vouch is where your friends, and their friends, drop the TV shows and anime they actually loved.
          Every one comes with a name.
        </p>
        <div className="mt-8 flex flex-col gap-3 md:flex-row">
          <button type="button" onClick={() => scrollTo("code")} className="btn-primary md:h-12">
            Join the waitlist
          </button>
          <button type="button" onClick={() => scrollTo("code")} className="btn-outline md:h-12">
            I have a code
          </button>
        </div>
      </div>

      {/* Mobile: two stacked cards */}
      <div aria-hidden className="relative h-[580px] md:hidden">
        <VouchCardBody level={0} data={SEVERANCE} className="absolute left-0 top-2 w-[300px] -rotate-6" />
        <VouchCardBody level={0} data={FRIEREN} className="absolute right-0 top-[310px] w-[310px] rotate-3" />
      </div>
      {/* Desktop: four-card collage */}
      <div aria-hidden className="relative hidden h-[640px] md:block">
        <VouchCardBody compact level={0} data={SEVERANCE} className="absolute left-0 top-[40px] w-[240px] -rotate-6" />
        <VouchCardBody compact level={0} data={FRIEREN} className="absolute right-0 top-0 w-[240px] rotate-[-7deg]" />
        <VouchCardBody compact level={0} data={BOCCHI} className="absolute left-[14px] top-[320px] w-[250px] -rotate-6" />
        <VouchCardBody compact level={0} data={BEAR} className="absolute right-[6px] top-[340px] w-[240px] -rotate-3" />
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-[1440px] scroll-mt-4 px-6 py-12 md:px-20 md:py-24">
      <h2 className="font-display text-heading font-extrabold md:text-hero-sm">How vouching works</h2>
      <div className="mt-8 grid gap-4 md:grid-cols-3 md:gap-4">
        <article className="rounded-card bg-lavender p-6 text-ink md:min-h-[300px] md:p-8">
          <h3 className="font-display text-hero-sm font-extrabold">Vouch it.</h3>
          <p className="mt-4 text-label">Rate it out of 10 and say why, in your own words. Add a tag or two if you like.</p>
          <div className="mt-6 flex items-center gap-3">
            <span style={{ transform: "rotate(-6deg)" }} className="inline-flex h-[72px] w-[72px] items-center justify-center rounded-[22px] bg-cream font-display text-stamp-lg font-extrabold">
              9
            </span>
            <div className="flex flex-col gap-2">
              <TagPill>slow-burn</TagPill>
              <TagPill>romance</TagPill>
            </div>
          </div>
        </article>
        <article className="rounded-card bg-lime p-6 text-ink md:min-h-[300px] md:p-8">
          <h3 className="font-display text-hero-sm font-extrabold">Pass it on.</h3>
          <p className="mt-4 text-label">
            It lands in your friends’ feeds with your name on it. Their friends see it too, marked via you.
          </p>
          <div className="mt-6 flex flex-col items-start gap-2">
            <AuthorPill name="Maya" />
            <AuthorPill name="Arjun" via="Dev" />
            <AuthorPill name="Dev" />
            <AuthorPill name="Noor" via="Maya" />
          </div>
        </article>
        <article className="rounded-card bg-pink p-6 text-ink md:min-h-[300px] md:p-8">
          <h3 className="font-display text-hero-sm font-extrabold">Me too.</h3>
          <p className="mt-4 text-label">
            See something upcoming? Tap Me too, then link one of your own vouches so they know your taste.
          </p>
          <span className="mt-5 inline-flex h-10 items-center rounded-full bg-ink px-5 text-label font-extrabold text-cream">Me too</span>
          <div className="mt-3 flex flex-col items-start gap-2">
            <TagPill>because I loved Severance</TagPill>
            <TagPill>because I loved Frieren</TagPill>
          </div>
        </article>
      </div>
    </section>
  );
}

function Path() {
  return (
    <section id="path" className="scroll-mt-4 bg-surface">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-6 py-14 md:grid-cols-2 md:items-center md:px-20 md:py-24">
        <div>
          <h2 className="font-display text-heading font-extrabold md:text-hero-sm">
            Every vouch
            <br className="hidden md:block" /> shows its path.
          </h2>
          <p className="mt-5 max-w-[440px] text-muted">
            A friend’s vouch is solid and full colour. A friend of a friend is dashed and quieter, and always says who
            connects you. You never borrow taste from a stranger.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 md:items-start md:gap-4">
          <figure>
            <VouchCardBody level={0} data={FRIEREN} />
            <figcaption className="mt-3 text-label text-muted">A friend: Dev. Solid, full colour, just his name.</figcaption>
          </figure>
          <figure>
            <VouchCardBody level={0} data={FRIEREN_FOF} />
            <figcaption className="mt-3 text-label text-muted">
              A friend of a friend: Arjun, via Dev. Quieter, with the path shown.
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

function Code() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function enter(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim();
    if (c) router.push(`/i/${encodeURIComponent(c)}`);
  }
  async function join(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.waitlist.join(email);
      setJoined(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "h-14 w-full rounded-full bg-cream px-6 text-body text-ink outline-none placeholder:text-ink/65 focus-visible:ring-2 focus-visible:ring-ink";
  return (
    <section id="code" className="scroll-mt-4 bg-lime text-ink">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-6 py-14 md:grid-cols-[1fr_1fr] md:items-center md:px-20 md:py-24">
        <div>
          <h2 className="font-display text-hero-sm font-extrabold md:text-hero-md">
            Got a code?
            <br /> Come in.
          </h2>
          <p className="mt-5 max-w-[440px] text-body">
            Vouch is invite-only while it grows friend by friend. No code yet? Join the waitlist and we’ll tell you when
            your spot opens.
          </p>
        </div>
        <div>
          <form onSubmit={enter}>
            <label htmlFor="code-input" className="text-label font-bold">
              Invite code
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="code-input"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="maya-4TLF"
                className={cn(field, "flex-1")}
              />
              <button type="submit" className="btn press h-14 bg-ink px-6 text-cream">
                Enter
              </button>
            </div>
          </form>
          <form onSubmit={join} className="mt-6">
            <label htmlFor="waitlist-email" className="text-label font-bold">
              Not invited yet?
            </label>
            {joined ? (
              <p role="status" className="mt-2 rounded-full bg-cream px-6 py-4 font-bold animate-pop-in">
                You are on the list. We will email you when your spot opens.
              </p>
            ) : (
              <>
                <div className="mt-2 flex gap-2">
                  <input
                    id="waitlist-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className={cn(field, "flex-1")}
                  />
                  <button type="submit" disabled={busy} className="btn press h-14 bg-ink px-6 text-cream">
                    {busy ? "Joining…" : "Join the waitlist"}
                  </button>
                </div>
                {error && (
                  <p role="alert" className="mt-2 text-label font-bold">
                    {error}
                  </p>
                )}
              </>
            )}
          </form>
          <p className="mt-6 text-label">
            Already in?{" "}
            <Link href="/sign-in" className="font-extrabold underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mx-auto max-w-[1440px] px-6 pb-8 pt-16 md:px-20 md:pt-24">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <p
          aria-hidden
          className="font-display text-ghost-sm font-extrabold md:text-ghost"
        >
          vouch
        </p>
        <nav aria-label="Footer" className="flex flex-col gap-2 text-label font-bold">
          <a href="#how" className="focus-ring inline-flex min-h-11 items-center rounded">How it works</a>
          <a href="#path" className="focus-ring inline-flex min-h-11 items-center rounded">Why “via”</a>
          <a href="#code" className="focus-ring inline-flex min-h-11 items-center rounded">Invite code</a>
          <a href="#code" className="focus-ring inline-flex min-h-11 items-center rounded">Join the waitlist</a>
        </nav>
      </div>
      <p className="mt-10 text-meta text-muted">Invite-only. Made for friends who trust each other’s taste.</p>
    </footer>
  );
}
