"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, devMagicLinkToken, isMockApi } from "@/lib/api";
import { useApp } from "@/components/providers";
import { MailIcon } from "@/components/ui/icons";
import { IllustrationTile } from "@/components/ui/primitives";

export default function CheckEmailPage() {
  const router = useRouter();
  // The email lives in memory only, never in the URL. A refresh loses it, so start over.
  const { pendingEmail: email } = useApp();
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (!email) router.replace("/sign-in");
  }, [email, router]);
  if (!email) return null;

  async function resend() {
    try {
      await api.auth.requestMagicLink(email);
      setNote("A new link is on its way.");
    } catch {
      setNote("Could not send a new link. Try again.");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[430px] flex-col px-6 pb-8 pt-24">
      <IllustrationTile tone="lime" tilt={-6} label="Link sent" className="mx-auto h-40 w-36 rounded-[28px] animate-pop-in">
        <MailIcon />
      </IllustrationTile>
      <h1 className="mt-16 font-display text-[40px] font-extrabold leading-[44px] tracking-tight">Check your email.</h1>
      <p className="mt-4 text-muted">
        We sent a magic link to {email}. Tap it on this phone and you are in. It expires in 15 minutes.
      </p>
      <div className="mt-auto pt-10">
        {/* Mock only: stands in for opening the link from the email. With the real API the link arrives by email. */}
        {isMockApi && (
          <button
            type="button"
            onClick={() => router.push(`/auth/verify?token=${devMagicLinkToken(email)}`)}
            className="btn-primary w-full"
          >
            Open email app
          </button>
        )}
        <button type="button" onClick={() => router.push("/sign-in")} className="btn-outline mt-3 w-full">
          Use a different email
        </button>
        <p className="mt-4 text-center text-sm text-muted" aria-live="polite">
          {note ?? (
            <>
              Link not working?{" "}
              <button type="button" onClick={resend} className="underline underline-offset-4">
                Request a new one
              </button>
            </>
          )}
        </p>
        <p className="mt-3 text-center text-xs text-muted">
          Prototype:{" "}
          <button
            type="button"
            className="underline underline-offset-4"
            onClick={() => router.push("/auth/verify?token=expired")}
          >
            simulate an expired link
          </button>
        </p>
      </div>
    </main>
  );
}
