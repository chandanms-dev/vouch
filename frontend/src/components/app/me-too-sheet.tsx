"use client";

import { useEffect, useState } from "react";
import { api, type AnticipationView, type VouchView } from "@/lib/api";
import { cn, joinNames } from "@/lib/format";
import { Sheet, SheetClose } from "@/components/ui/sheet";
import { ScoreBadge, TypeBadge } from "@/components/ui/primitives";
import { KIND } from "@/components/ui/kind";

export function MeTooSheet({
  open,
  item,
  onClose,
  onDone,
  onVouchFirst,
}: {
  open: boolean;
  item: AnticipationView | null;
  onClose: () => void;
  onDone: () => void;
  onVouchFirst: () => void;
}) {
  const [mine, setMine] = useState<VouchView[] | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let live = true;
    setMine(null);
    setError(null);
    setBusy(false);
    api.vouches.mine().then((m) => {
      if (!live) return;
      setMine(m);
      setPicked(m[0]?.vouch.id ?? null);
    });
    return () => {
      live = false;
    };
  }, [open, item?.id]);

  const names = item ? item.waiting.map((w) => w.user.name.split(" ")[0]!) : [];
  const shown = names.length > 2 ? [...names.slice(0, 2), `${names.length - 2} more`] : names;
  const picks = mine?.find((m) => m.vouch.id === picked);

  async function send() {
    if (!item || !picked) return;
    setBusy(true);
    try {
      await api.anticipations.meToo(item.id, picked);
      onDone();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send");
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} label="Say Me too">
      <div className="px-6 pb-6 pt-4 md:pt-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-[28px] font-extrabold leading-8">Why are you in?</h2>
            <p className="mt-2 text-sm text-muted">Link one of your vouches so friends know your taste.</p>
          </div>
          <SheetClose onClick={onClose} />
        </div>

        {mine === null ? (
          <div className="mt-4 space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[72px] animate-pulse-soft rounded-2xl bg-raised" />
            ))}
          </div>
        ) : mine.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-raised p-5 text-center">
            <p className="font-semibold">A vouch of your own comes first.</p>
            <p className="mt-1 text-sm text-muted">Me too needs a vouch so friends can see your taste.</p>
            <button type="button" onClick={onVouchFirst} className="btn-primary mt-4 w-full">
              Vouch something first
            </button>
          </div>
        ) : (
          <>
            <ul role="radiogroup" aria-label="Your vouches" className="mt-4 space-y-2">
              {mine.map((m) => {
                const selected = m.vouch.id === picked;
                return (
                  <li key={m.vouch.id}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setPicked(m.vouch.id)}
                      className={cn(
                        "press focus-ring flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left",
                        selected ? cn(KIND[m.show.kind].field, "border-transparent text-ink") : "border-muted/50 bg-raised",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                          selected ? "border-ink" : "border-muted",
                        )}
                      >
                        {selected && <span className="h-3 w-3 rounded-full bg-ink" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <TypeBadge kind={m.show.kind} onField={selected} className="h-6 text-xs" />
                        <span className="mt-1 block truncate font-display text-lg font-extrabold">{m.show.title}</span>
                      </span>
                      <ScoreBadge value={m.vouch.rating} size="sm" tilted={false} />
                    </button>
                  </li>
                );
              })}
            </ul>
            {picks && (
              <p className="mt-4 text-sm text-muted" aria-live="polite">
                {joinNames(shown)} will see: “Me too, because I loved {picks.show.title}.”
              </p>
            )}
            {error && (
              <p role="alert" className="mt-3 text-sm font-semibold text-pink">
                {error}
              </p>
            )}
            <button type="button" onClick={send} disabled={!picked || busy} className="btn-primary mt-5 w-full">
              {busy ? "Sending…" : "Send me too"}
            </button>
          </>
        )}
        <button type="button" onClick={onClose} className="press focus-ring mt-2 h-12 w-full rounded-full text-base font-extrabold">
          Cancel
        </button>
      </div>
    </Sheet>
  );
}
