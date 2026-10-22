"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth } from "@/components/providers";
import { AlertIcon } from "@/components/ui/icons";
import { IllustrationTile } from "@/components/ui/primitives";
import { cn } from "@/lib/format";

export function ErrorState({
  title = "Something went sideways.",
  body = "We could not load that. Check your connection and try again.",
  onRetry,
  action,
  compact,
}: {
  title?: string;
  body?: string;
  onRetry?: () => void;
  action?: ReactNode;
  /** Smaller layout for use inside a sheet or a section. */
  compact?: boolean;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "mx-auto flex max-w-[360px] flex-col items-center px-6 text-center animate-fade-in",
        compact ? "pt-6" : "py-20",
      )}
    >
      <IllustrationTile tone="sky" tilt={6} className={compact ? "h-[88px] w-[88px] rounded-[24px]" : "h-28 w-28 rounded-[28px]"}>
        <AlertIcon />
      </IllustrationTile>
      <h2 className={cn("font-display font-extrabold", compact ? "mt-6 text-xl leading-6" : "mt-10 text-[32px] leading-9")}>
        {title}
      </h2>
      <p className={cn("text-muted", compact ? "mt-3 text-sm" : "mt-3")}>{body}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className={cn("btn-primary w-full", compact ? "mt-5" : "mt-8")}>
          Retry
        </button>
      )}
      {action}
    </div>
  );
}

/** Nothing to show: a search with no matches, a profile with no vouches, a filter with no items. */
export function EmptyState({
  tone = "lavender",
  icon,
  title,
  body,
  action,
  compact,
}: {
  tone?: "lime" | "pink" | "sky" | "lavender";
  icon: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex max-w-[360px] flex-col items-center px-6 text-center animate-fade-in",
        compact ? "pt-8" : "py-16",
      )}
    >
      <IllustrationTile tone={tone} tilt={8} className="h-[88px] w-[88px] rounded-[24px]">
        {icon}
      </IllustrationTile>
      <h3 className="mt-6 max-w-[280px] font-display text-xl font-extrabold leading-6">{title}</h3>
      {body && <p className="mt-3 max-w-[300px] text-sm text-muted">{body}</p>}
      {action && <div className="mt-6 w-full max-w-[260px]">{action}</div>}
    </div>
  );
}

/** Unknown route, show or person. Links home, and to the feed when signed in. */
export function NotFoundView({
  title = "That page wandered off.",
  body = "The link may be wrong, or it may have been removed.",
}: {
  title?: string;
  body?: string;
}) {
  const { status } = useAuth();
  return (
    <div className="mx-auto flex max-w-[360px] flex-col items-center px-6 py-20 text-center animate-fade-in">
      <IllustrationTile tone="lavender" tilt={-6} label="404" className="h-36 w-32 rounded-[28px]">
        <span className="font-display text-[40px] font-extrabold leading-none">?</span>
      </IllustrationTile>
      <h1 className="mt-10 font-display text-[32px] font-extrabold leading-9">{title}</h1>
      <p className="mt-3 text-muted">{body}</p>
      <Link href="/" className={cn("mt-8 w-full", status === "signed-in" ? "btn-outline" : "btn-primary")}>
        Go home
      </Link>
      {status === "signed-in" && (
        <Link href="/feed" className="btn-primary mt-3 w-full">
          Back to your feed
        </Link>
      )}
    </div>
  );
}

export function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className="mx-auto flex max-w-[360px] flex-col items-center px-6 py-24 text-center animate-fade-in">
      <IllustrationTile tone="lavender" tilt={-6} className="h-28 w-28 rounded-[28px]">
        <span className="font-display text-xl font-extrabold">Soon</span>
      </IllustrationTile>
      <h1 className="mt-10 font-display text-h1 font-extrabold">{title}</h1>
      <p className="mt-3 text-muted">Coming soon. {title} is not part of the first release.</p>
    </div>
  );
}
