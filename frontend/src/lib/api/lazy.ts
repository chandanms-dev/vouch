import type { VouchApi } from "./types";

type Methods = Record<string, (...args: unknown[]) => Promise<unknown>>;

/**
 * A `VouchApi` whose implementation is loaded on first use. Every method already returns a promise, so
 * the loading is invisible to callers; `api.auth.getSession()` just resolves a little later the first time.
 */
export function lazyApi(load: () => Promise<VouchApi>): VouchApi {
  let loaded: Promise<VouchApi> | null = null;
  const impl = () => (loaded ??= load());
  return new Proxy({} as VouchApi, {
    get(_target, namespace) {
      if (typeof namespace !== "string") return undefined;
      return new Proxy(
        {},
        {
          get(_ns, method) {
            if (typeof method !== "string") return undefined;
            return async (...args: unknown[]) => {
              const api = (await impl()) as unknown as Record<string, Methods | undefined>;
              const fn = api[namespace]?.[method];
              if (!fn) throw new Error(`api.${namespace}.${method} is not available`);
              return fn.apply(api[namespace], args);
            };
          },
        },
      );
    },
  });
}
