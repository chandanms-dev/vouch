"use client";

import { Sheet } from "./sheet";

/** Confirm a destructive action. Built on Sheet, so it traps focus and closes on Esc. */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = "Keep it",
  busy,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Sheet open={open} onClose={busy ? () => undefined : onClose} label={title}>
      <div className="px-6 pb-6 pt-4 md:pt-8">
        <h2 className="font-display text-h2 font-extrabold">{title}</h2>
        <p className="mt-3 text-muted">{body}</p>
        <button type="button" onClick={onConfirm} disabled={busy} className="btn-primary mt-6 w-full">
          {busy ? "Deleting…" : confirmLabel}
        </button>
        <button type="button" onClick={onClose} disabled={busy} autoFocus className="btn-outline mt-3 w-full">
          {cancelLabel}
        </button>
      </div>
    </Sheet>
  );
}
