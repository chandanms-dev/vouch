"use client";

import { useEffect, useState } from "react";

export function Toast({ toast }: { toast: { id: number; message: string } | null }) {
  const [visible, setVisible] = useState<typeof toast>(null);

  useEffect(() => {
    if (!toast) return;
    setVisible(toast);
    const t = setTimeout(() => setVisible(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  if (!visible) return null;
  return (
    <div
      key={visible.id}
      role="status"
      className="fixed inset-x-0 bottom-28 z-[60] flex justify-center px-4 md:bottom-8"
    >
      <span className="animate-pop-in rounded-full bg-cream px-5 py-3 text-sm font-extrabold text-ink">
        {visible.message}
      </span>
    </div>
  );
}
