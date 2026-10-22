// NEXT_PUBLIC_API_BASE_URL is the backend's origin (for example http://localhost:5080). When it is set, the
// browser never talks to it directly: the app calls the same-origin path /api/* and Next proxies it here.
// Same origin means the refresh cookie is first-party (SameSite=Lax works) and no CORS is needed.
// See docs/api-contract.md, "Same-origin proxy".
const target = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "");

if (target && !/^https?:\/\/[^/]+/.test(target)) {
  throw new Error(`NEXT_PUBLIC_API_BASE_URL must be an absolute http(s) URL, got "${target}"`);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return target ? [{ source: "/api/:path*", destination: `${target}/:path*` }] : [];
  },
};

export default nextConfig;
