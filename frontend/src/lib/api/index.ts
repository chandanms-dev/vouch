import { mockApi } from "./mock";
import type { VouchApi } from "./types";

/** Swap this export for the real HTTP client when the backend exists. */
export const api: VouchApi = mockApi;
export { devMagicLinkToken } from "./mock";
export * from "./types";
