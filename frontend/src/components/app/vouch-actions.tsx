"use client";

import { useState } from "react";
import { api, type VouchView } from "@/lib/api";
import { useApp } from "@/components/providers";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const BTN =
  "press focus-ring inline-flex h-9 items-center rounded-full border-2 border-ink px-4 text-sm font-extrabold text-ink disabled:opacity-50";

/** Edit and Delete for the viewer's own vouch. Render only when the viewer is the author. */
export function OwnVouchActions({ view }: { view: VouchView }) {
  const { openComposer, refresh, notify } = useApp();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    try {
      await api.vouches.remove(view.vouch.id);
      setConfirming(false);
      refresh();
      notify("Vouch deleted");
    } catch {
      notify("Could not delete that vouch. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="relative z-10 mt-3 flex gap-2">
        <button type="button" onClick={() => openComposer({ show: view.show, vouch: view.vouch })} className={BTN}>
          Edit
        </button>
        <button type="button" onClick={() => setConfirming(true)} className={BTN}>
          Delete
        </button>
      </div>
      <ConfirmDialog
        open={confirming}
        title={`Delete your vouch for ${view.show.title}?`}
        body="It disappears from your profile and from your friends’ feeds. You can vouch for it again any time."
        confirmLabel="Delete vouch"
        busy={busy}
        onConfirm={remove}
        onClose={() => setConfirming(false)}
      />
    </>
  );
}
