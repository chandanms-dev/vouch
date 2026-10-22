import { createHttpApi } from "./http";
import { mockApi, devMagicLinkToken as mockMagicLinkToken } from "./mock";
import type { VouchApi } from "./types";

/**
 * Chosen at build time. With NEXT_PUBLIC_API_BASE_URL set the app talks to the real backend over HTTP;
 * without it, it runs on the in-browser mock. Components only ever import `api`.
 */
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

export const isMockApi = !baseUrl;
export const api: VouchApi = baseUrl ? createHttpApi(baseUrl) : mockApi;

/** Mock only: stands in for the link in the email. Returns null against the real API. */
export const devMagicLinkToken = (email: string): string | null => (isMockApi ? mockMagicLinkToken(email) : null);
export { EMPTY_EMAIL as PROTOTYPE_EMPTY_EMAIL } from "./mock-data";
export * from "./types";
