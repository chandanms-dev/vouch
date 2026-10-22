"use client";

import { useEffect, useRef, useState } from "react";
import { useDialogOpen } from "./dialog-state";

/** Shows one toast at a time. While a dialog or sheet is open the toast waits, then appears when it closes. */
export function Toast({ toast }: { toast: { id: number; message: string } | null }) {
  const [visible, setVisible] = useState<typeof toast>(null);
  const dialogOpen = useDialogOpen();
  const shownId = useRef<number | null>(null);

  useEffect(() => {
    if (!toast || dialogOpen) {
      setVisible(null);
      return;
    }
    if (shownId.current === toast.id) return;
    shownId.current = toast.id;
    setVisible(toast);
    const t = setTimeout(() => setVisible(null), 2600);
    return () => clearTimeout(t);
  }, [toast, dialogOpen]);

  if (!visible) return null;
  return (
    <div
      key={visible.id}
      role="status"
      className="fixed inset-x-0 bottom-28 z-[60] flex justify-center px-4 md:bottom-8"
    >
      <span className="animate-pop-in rounded-full bg-cream px-5 py-3 text-label font-extrabold text-ink">
        {visible.message}
      </span>
    </div>
  );
}
