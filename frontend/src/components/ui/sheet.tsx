"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/format";
import { CloseIcon } from "./icons";

const EXIT_MS = 220;

/**
 * Bottom sheet below 768px, centred modal above. Enter is slower than exit
 * (320ms drawer curve in, 220ms out); both are transitions, so they can be
 * interrupted. Mobile sheets can be dragged down by the handle area, with a
 * velocity-based dismiss.
 */
export function Sheet({
  open,
  onClose,
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startY: number; startT: number; id: number } | null>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(raf);
    }
    setShown(false);
    const t = setTimeout(() => setMounted(false), EXIT_MS);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, [open, onClose]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (window.matchMedia("(min-width: 768px)").matches || drag.current) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { startY: e.clientY, startT: Date.now(), id: e.pointerId };
    if (panelRef.current) panelRef.current.style.transition = "none";
  }, []);
  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId || !panelRef.current) return;
    const dy = e.clientY - d.startY;
    // Friction instead of a hard stop when dragging upward.
    const y = dy < 0 ? dy / (1 + Math.abs(dy) / 40) : dy;
    panelRef.current.style.transform = `translateY(${y}px)`;
  }, []);
  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const d = drag.current;
      if (!d || d.id !== e.pointerId || !panelRef.current) return;
      drag.current = null;
      const dy = e.clientY - d.startY;
      const velocity = Math.abs(dy) / Math.max(1, Date.now() - d.startT);
      panelRef.current.style.transition = "";
      panelRef.current.style.transform = "";
      if (dy > 100 || (dy > 20 && velocity > 0.11)) onClose();
    },
    [onClose],
  );

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <div
        onClick={onClose}
        aria-hidden
        className={cn(
          "absolute inset-0 bg-ink/70 transition-opacity ease-out",
          shown ? "opacity-100 duration-300" : "opacity-0 duration-200",
        )}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={cn(
          "relative flex max-h-[92dvh] w-full flex-col overflow-y-auto rounded-t-[32px] bg-surface text-cream outline-none",
          "md:max-w-[440px] md:rounded-[32px]",
          "transition-[transform,opacity] will-change-transform",
          shown
            ? "translate-y-0 opacity-100 duration-[320ms] ease-drawer md:scale-100"
            : "translate-y-full opacity-100 duration-[220ms] ease-out md:translate-y-0 md:scale-95 md:opacity-0",
        )}
      >
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="flex shrink-0 touch-none justify-center pt-3 md:hidden"
        >
          <span className="h-1 w-10 rounded-full bg-muted/60" />
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function SheetClose({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close"
      className="press focus-ring inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-raised text-cream"
    >
      <CloseIcon width={20} height={20} />
    </button>
  );
}
