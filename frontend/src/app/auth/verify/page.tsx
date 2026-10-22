"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/components/providers";

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <Verify />
    </Suspense>
  );
}

function Verify() {
  const router = useRouter();
  const params = useSearchParams();
  const { setUser } = useAuth();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // links work once
    ran.current = true;
    const token = params.get("token") ?? "";
    api.auth.verifyMagicLink(token).then(
      (s) => {
        setUser(s.user);
        router.replace("/feed");
      },
      (e) => {
        const expired = e instanceof ApiError && (e.code === "token_expired" || e.code === "token_invalid");
        router.replace(expired ? "/auth/expired" : "/sign-in");
      },
    );
  }, [params, router, setUser]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6" aria-busy="true">
      <p className="font-display text-h2 font-extrabold animate-pulse-soft">Signing you in…</p>
    </main>
  );
}
