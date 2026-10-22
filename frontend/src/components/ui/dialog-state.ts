"use client";

import { useSyncExternalStore } from "react";

/** Counts open dialogs/sheets so other UI (toasts) can wait for them to close. */
let open = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function registerDialog(): () => void {
  open += 1;
  emit();
  return () => {
    open -= 1;
    emit();
  };
}

export function useDialogOpen(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => open > 0,
    () => false,
  );
}
