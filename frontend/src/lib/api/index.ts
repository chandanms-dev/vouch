import { createHttpApi } from "./http";
import { lazyApi } from "./lazy";
import type { VouchApi } from "./types";

/**
 * Chosen at build time from NEXT_PUBLIC_API_BASE_URL (the backend's origin, used by the `/api` rewrite in
 * next.config.mjs; see docs/api-contract.md). Set: the real client calls the same-origin `/api` path.
 * Unset: the in-browser mock, loaded lazily on first use.
 *
 * `process.env.NEXT_PUBLIC_API_BASE_URL` is written out in full in each condition on purpose: the build
 * replaces it with its value, so with the real API selected the mock (and its seed data) is dead code and is
 * not emitted at all. Do not move it into a variable or a helper.
 */
export const isMockApi = !process.env.NEXT_PUBLIC_API_BASE_URL;

// A conditional expression, not an early return: the build evaluates the test and skips the dead branch
// entirely, so with the real API selected the `import("./mock")` below is never even bundled.
export const api: VouchApi = process.env.NEXT_PUBLIC_API_BASE_URL
  ? createHttpApi("/api")
  : lazyApi(() => import("./mock").then((m) => m.mockApi));

/** Mock only: stands in for the link in the email. Resolves to null against the real API. */
export async function devMagicLinkToken(email: string): Promise<string | null> {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return null;
  } else {
    return (await import("./mock")).devMagicLinkToken(email);
  }
}

export { EMPTY_EMAIL as PROTOTYPE_EMPTY_EMAIL } from "./demo-constants";
export * from "./types";
