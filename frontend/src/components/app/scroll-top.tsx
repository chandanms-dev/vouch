"use client";

import { useLayoutEffect } from "react";

/** Detail screens always open at the top, whatever the previous page's scroll position was. */
export function ScrollTop({ id }: { id: string }) {
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);
  return null;
}
