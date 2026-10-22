"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useApp } from "@/components/providers";
import { ClockIcon } from "@/components/ui/icons";
import { IllustrationTile } from "@/components/ui/primitives";

export default function ExpiredPage() {
  const router = useRouter();
  const { pendingEmail: email } = useApp();
  const [busy, setBusy] = useState(false);

  async function resend() {
    if (!email) return router.push("/sign-in");
    setBusy(true);
    try {
      await api.auth.requestMagicLink(email);
      router.push("/auth/check-email");
    } catch {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[430px] flex-col px-6 pb-8 pt-24">
      <IllustrationTile tone="pink" tilt={6} label="Expired" className="mx-auto h-40 w-36 rounded-[28px] animate-pop-in">
        <ClockIcon />
      </IllustrationTile>
      <h1 className="mt-16 font-display text-title font-extrabold">That link has expired.</h1>
      <p className="mt-4 text-muted">
        Magic links work once and last 15 minutes. Send a new one to {email || "your email"} and tap it on this phone.
      </p>
      <div className="mt-auto pt-10">
        <button type="button" onClick={resend} disabled={busy} className="btn-primary w-full">
          {busy ? "Sending…" : "Send a new link"}
        </button>
        <button type="button" onClick={() => router.push("/sign-in")} className="btn-outline mt-3 w-full">
          Back to sign in
        </button>
      </div>
    </main>
  );
}
