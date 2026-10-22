import { expect, test } from "@playwright/test";
import { createHttpApi } from "../src/lib/api/http";

// Exercises the real API client (not the mock) against a fake `fetch`: token handling, the shared
// refresh on 401, one retry, error mapping. No browser or server involved.

const user = { id: "u1", handle: "a", name: "A", tags: [] };
const json = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

interface Call {
  method: string;
  url: string;
  auth?: string;
  credentials?: RequestCredentials;
}

function fakeServer() {
  const s = { calls: [] as Call[], validToken: "tok1", refreshOk: true, refreshes: 0 };
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const headers = (init?.headers ?? {}) as Record<string, string>;
    const method = init?.method ?? "GET";
    s.calls.push({ method, url, auth: headers.Authorization, credentials: init?.credentials });
    if (url.endsWith("/auth/refresh") && method === "POST") {
      s.refreshes++;
      await new Promise((r) => setTimeout(r, 30));
      if (!s.refreshOk) return json(401, { code: "unauthenticated", message: "no", traceId: "t" });
      s.validToken = `tok${s.refreshes + 1}`;
      return json(200, { accessToken: s.validToken, expiresIn: 900, user });
    }
    if (url.endsWith("/auth/magic-link/verify")) return json(200, { accessToken: "tok1", expiresIn: 900, user });
    if (headers.Authorization !== `Bearer ${s.validToken}`) return json(401, { code: "unauthenticated", message: "expired" });
    if (url.includes("/vouches/nope")) return json(404, { code: "not_found", message: "gone", traceId: "trace-9" });
    if (url.includes("/shows/boom")) return new Response("oops", { status: 500 });
    return json(200, []);
  }) as typeof fetch;
  return s;
}

test("sends the bearer token with credentials included and tolerates a trailing slash in the base URL", async () => {
  const s = fakeServer();
  const api = createHttpApi("https://api.test/", () => undefined);
  await api.auth.verifyMagicLink("abc");
  await api.friends.list();
  const last = s.calls.at(-1)!;
  expect(last.url).toBe("https://api.test/friends");
  expect(last.auth).toBe("Bearer tok1");
  expect(last.credentials).toBe("include");
});

test("concurrent 401s share one refresh and each request is retried once with the new token", async () => {
  const s = fakeServer();
  let lost = 0;
  const api = createHttpApi("https://api.test", () => lost++);
  await api.auth.verifyMagicLink("abc");
  s.validToken = "expired-on-the-server";
  s.calls.length = 0;
  await Promise.all([api.friends.list(), api.friends.requests(), api.invites.mine()]);
  expect(s.refreshes).toBe(1);
  expect(s.calls.filter((c) => c.url.endsWith("/auth/refresh"))).toHaveLength(1);
  expect(s.calls.filter((c) => c.auth === "Bearer tok2")).toHaveLength(3); // the retries
  expect(s.calls.filter((c) => c.auth === "Bearer tok1")).toHaveLength(3); // the first attempts
  expect(lost).toBe(0);
});

test("a failed refresh clears the session, signals it once and does not retry", async () => {
  const s = fakeServer();
  let lost = 0;
  const api = createHttpApi("https://api.test", () => lost++);
  await api.auth.verifyMagicLink("abc");
  s.validToken = "x";
  s.refreshOk = false;
  s.calls.length = 0;
  await expect(api.friends.list()).rejects.toMatchObject({ code: "unauthenticated" });
  expect(lost).toBe(1);
  expect(s.calls.map((c) => `${c.method} ${c.url}`)).toEqual(["GET https://api.test/friends", "POST https://api.test/auth/refresh"]);
});

test("maps error bodies, plain 5xx and network failures to ApiError", async () => {
  fakeServer();
  const api = createHttpApi("https://api.test", () => undefined);
  await api.auth.verifyMagicLink("abc");
  await expect(api.vouches.remove("nope")).rejects.toMatchObject({ code: "not_found", traceId: "trace-9", status: 404 });
  await expect(api.shows.get("boom")).rejects.toMatchObject({ code: "server_error", status: 500 });
  globalThis.fetch = (async () => {
    throw new TypeError("failed to fetch");
  }) as typeof fetch;
  await expect(api.feed.page()).rejects.toMatchObject({ code: "network" });
});

test("getSession is null, and does not redirect, when there is no refresh cookie", async () => {
  const s = fakeServer();
  s.refreshOk = false;
  let lost = 0;
  const api = createHttpApi("https://api.test", () => lost++);
  expect(await api.auth.getSession()).toBeNull();
  expect(lost).toBe(0);
});
