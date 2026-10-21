"use client";

import type { ReactNode } from "react";
import { AlertIcon } from "@/components/ui/icons";
import { IllustrationTile } from "@/components/ui/primitives";

export function ErrorState({
  title = "Something went sideways.",
  body = "We could not load that. Check your connection and try again.",
  onRetry,
  action,
}: {
  title?: string;
  body?: string;
  onRetry?: () => void;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-[360px] flex-col items-center px-6 py-20 text-center animate-fade-in">
      <IllustrationTile tone="sky" tilt={6} className="h-28 w-28 rounded-[28px]">
        <AlertIcon />
      </IllustrationTile>
      <h2 className="mt-10 font-display text-[32px] font-extrabold leading-9">{title}</h2>
      <p className="mt-3 text-muted">{body}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-primary mt-8 w-full">
          Try again
        </button>
      )}
      {action}
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
