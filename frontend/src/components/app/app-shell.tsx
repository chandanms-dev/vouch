"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useApp, useAuth } from "@/components/providers";
import { PlusIcon } from "@/components/ui/icons";
import { Avatar, ComingSoon, Logo } from "@/components/ui/primitives";
import { cn } from "@/lib/format";

const NAV = [
  { href: "/feed", label: "Feed", soon: false },
  { href: "/spaces", label: "Spaces", soon: true },
  { href: "/plans", label: "Plans", soon: true },
  { href: "/me", label: "Me", soon: false },
] as const;

function isActive(path: string, href: string) {
  if (href === "/me") return path === "/me" || path.startsWith("/friends");
  if (href === "/feed") return path === "/feed" || path.startsWith("/show") || path.startsWith("/u/");
  return path.startsWith(href);
}

export function AppShell({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const { openComposer } = useApp();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (status === "signed-out") router.replace("/sign-in");
  }, [status, router]);

  // Detail screens in the Figma export carry no tab bar on mobile.
  const hideTabs = path.startsWith("/show/") || path.startsWith("/u/");

  if (status !== "signed-in" || !user) {
    return <div className="min-h-screen bg-ink" aria-busy="true" />;
  }

  return (
    <div className="min-h-screen bg-ink md:pl-60">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-surface px-5 pb-6 pt-8 md:flex">
        <Link href="/feed" className="focus-ring rounded-lg">
          <Logo className="text-[32px]" />
        </Link>
        <nav aria-label="Main" className="mt-8 flex flex-col gap-1">
          {NAV.map((n) => {
            const active = isActive(path, n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "press focus-ring flex h-10 items-center rounded-full px-4 text-sm font-bold",
                  active ? "bg-raised text-cream" : "text-muted hover:text-cream",
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto">
          <button type="button" onClick={() => openComposer()} className="btn-primary w-full">
            + Vouch
          </button>
          <Link href="/me" className="focus-ring mt-4 flex items-center gap-2 rounded-full text-sm font-bold">
            <Avatar name={user.name} size="sm" />
            {user.name}
          </Link>
        </div>
      </aside>

      <main className={hideTabs ? "pb-10 md:pb-12" : "pb-32 md:pb-12"}>{children}</main>

      {/* Mobile tab bar */}
      <nav
        aria-label="Main"
        hidden={hideTabs}
        className={cn("fixed inset-x-0 bottom-0 z-30 flex h-[84px] items-center justify-between bg-surface px-2 pb-2 md:hidden", hideTabs && "hidden")}
      >
        {[NAV[0], NAV[1]].map((n) => (
          <TabLink key={n.href} item={n} active={isActive(path, n.href)} />
        ))}
        <button
          type="button"
          onClick={() => openComposer()}
          aria-label="Add a vouch"
          className="press focus-ring -mt-1 inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-cream text-ink"
        >
          <PlusIcon width={26} height={26} />
        </button>
        {[NAV[2], NAV[3]].map((n) => (
          <TabLink key={n.href} item={n} active={isActive(path, n.href)} />
        ))}
      </nav>
    </div>
  );
}

function TabLink({ item, active }: { item: (typeof NAV)[number]; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "press focus-ring flex min-w-[64px] flex-col items-center justify-center whitespace-nowrap rounded-full px-3 py-2 text-[13px] font-bold leading-4",
        active ? "bg-raised text-cream" : "text-muted",
      )}
    >
      {item.label}
      {item.soon && <ComingSoon className="mt-0.5" />}
    </Link>
  );
}
