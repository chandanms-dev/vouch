import Link from "next/link";
import type { ReactNode } from "react";
import { cn, initial } from "@/lib/format";
import { KIND, type VisualKind } from "./kind";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("font-display font-extrabold leading-none tracking-[-0.04em]", className)}>
      vouch
    </span>
  );
}

const AVATAR_SIZES = { xs: "h-5 w-5 text-[10px]", sm: "h-6 w-6 text-[11px]", md: "h-9 w-9 text-sm", lg: "h-[72px] w-[72px] text-[32px]", xl: "h-[120px] w-[120px] text-[56px]" } as const;

export function Avatar({
  name,
  size = "md",
  tone = "cream",
  className,
}: {
  name: string;
  size?: keyof typeof AVATAR_SIZES;
  tone?: "cream" | "ink" | "lavender" | "lime" | "pink";
  className?: string;
}) {
  const tones = {
    cream: "bg-cream text-ink",
    ink: "bg-ink text-cream",
    lavender: "bg-lavender text-ink",
    lime: "bg-lime text-ink",
    pink: "bg-pink text-ink",
  };
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-display font-extrabold",
        AVATAR_SIZES[size],
        tones[tone],
        className,
      )}
    >
      {initial(name)}
    </span>
  );
}

/** Dark pill used on coloured cards, filled-field pill used on dark cards. */
export function TypeBadge({ kind, onField = true, className }: { kind: VisualKind; onField?: boolean; className?: string }) {
  const k = KIND[kind];
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-tag font-extrabold",
        onField ? "bg-ink text-cream" : cn(k.field, "text-ink"),
        className,
      )}
    >
      <span className={onField ? k.iconText : "text-ink"}>{k.icon}</span>
      {k.label}
    </span>
  );
}

export function TagPill({
  children,
  tone = "light",
  tilt,
}: {
  children: ReactNode;
  tone?: "light" | "dark";
  tilt?: number;
}) {
  return (
    <span
      style={tilt ? { transform: `rotate(${tilt}deg)` } : undefined}
      className={cn(
        "inline-flex h-7 items-center rounded-full px-3 text-tag font-semibold",
        tone === "light" ? "bg-cream text-ink" : "bg-raised text-cream",
      )}
    >
      {children}
    </span>
  );
}

export function ScoreBadge({ value, size = "lg", tilted = true }: { value: number; size?: "lg" | "sm"; tilted?: boolean }) {
  return (
    <span
      aria-label={`Rated ${value} out of 10`}
      style={tilted ? { transform: "rotate(-6deg)" } : undefined}
      className={cn(
        "inline-flex shrink-0 items-center justify-center bg-cream font-display font-extrabold text-ink",
        size === "lg" ? "h-14 w-14 rounded-[18px] text-[28px]" : "h-10 w-10 rounded-xl text-xl",
      )}
    >
      {value}
    </span>
  );
}

/**
 * "Maya" on friend cards, "Arjun · via Dev" (dashed) on friend-of-friend cards.
 * With `href` / `viaHref` the author and the via friend link to their profiles.
 */
export function AuthorPill({
  name,
  via,
  href,
  viaHref,
  size = "md",
}: {
  name: string;
  via?: string;
  href?: string;
  viaHref?: string;
  size?: "md" | "sm";
}) {
  const fof = !!via;
  const linkCls = "focus-ring hit-44 relative z-10 rounded-full hover:underline underline-offset-2";
  const who = (
    <>
      <Avatar name={name} size="sm" tone={fof ? "ink" : "cream"} />
      <span>{name}</span>
    </>
  );
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full font-bold",
        size === "md" ? "h-8 pl-1 pr-3 text-sm" : "h-7 pl-1 pr-2.5 text-xs",
        fof ? "border-2 border-dashed border-ink bg-cream text-ink" : "bg-ink text-cream",
      )}
    >
      {href ? (
        <Link href={href} className={cn(linkCls, "inline-flex items-center gap-2")}>
          {who}
        </Link>
      ) : (
        <span className="inline-flex items-center gap-2">{who}</span>
      )}
      {via && (
        <span className="font-semibold">
          <span aria-hidden>· </span>via{" "}
          {viaHref ? (
            <Link href={viaHref} className={linkCls}>
              {via}
            </Link>
          ) : (
            via
          )}
        </span>
      )}
    </span>
  );
}

export function ComingSoon({ className }: { className?: string }) {
  return <span className={cn("whitespace-nowrap text-[11px] font-bold leading-none text-lime", className)}>Coming soon</span>;
}

/** Tilted tile with an icon; used for empty/error/auth states. */
export function IllustrationTile({
  tone,
  tilt = -6,
  children,
  label,
  className,
}: {
  tone: "lime" | "pink" | "sky" | "lavender";
  tilt?: number;
  children: ReactNode;
  label?: string;
  className?: string;
}) {
  const tones = { lime: "bg-lime", pink: "bg-pink", sky: "bg-sky", lavender: "bg-lavender" };
  return (
    <div
      aria-hidden
      style={{ transform: `rotate(${tilt}deg)` }}
      className={cn("flex flex-col items-center justify-center gap-2 text-ink", tones[tone], className)}
    >
      {children}
      {label && (
        <span className="rounded-full bg-ink px-3 py-1 text-xs font-extrabold text-cream">{label}</span>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse-soft rounded-full bg-raised", className)} />;
}

export function BackButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("press focus-ring inline-flex h-11 items-center rounded-full bg-surface px-5 text-sm font-bold text-cream md:bg-surface", className)}
    >
      Back
    </button>
  );
}
