"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase-browser";

type Props = {
  initialError?: string;
  next?: string;
};

export function LoginForm({ initialError, next }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(
    initialError === "invalid_link"
      ? "that link expired or was already used. try again."
      : initialError === "no_card"
      ? "no approved card found for this email. drop one first."
      : null
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = email.trim().toLowerCase();
    if (!cleaned) return;
    setSubmitting(true);
    setError(null);

    try {
      const pre = await fetch("/api/auth/precheck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleaned }),
      });
      const data = (await pre.json().catch(() => ({}))) as { hasCard?: boolean };
      if (!data.hasCard) {
        router.push(`/join?from=${encodeURIComponent(cleaned)}`);
        return;
      }
    } catch {
      // fall through
    }

    const supabase = createBrowserSupabase();
    const redirectTo = new URL("/auth/callback", window.location.origin);
    if (next) redirectTo.searchParams.set("next", next);

    const { error: err } = await supabase.auth.signInWithOtp({
      email: cleaned,
      options: {
        emailRedirectTo: redirectTo.toString(),
        shouldCreateUser: true,
      },
    });

    setSubmitting(false);
    if (err) setError(err.message);
    else setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-5">
        <div className="badge-amber">transmission sent</div>
        <p className="font-display-italic text-2xl leading-snug text-ink">
          check your inbox.
        </p>
        <p className="font-mono text-[12px] text-mute break-all">{email}</p>
        <p className="text-[13px] text-mute leading-relaxed">
          tap the link to sign in. expires in 60 minutes. you can close this
          tab.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <span className="label-strong block mb-1">email · subject ID</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.org"
          className="w-full bg-paper border border-ink/40 focus:border-ink py-2 px-3 text-[15px] outline-none transition-colors"
          required
          autoFocus
          maxLength={160}
          autoComplete="email"
        />
      </div>

      <button
        type="submit"
        disabled={submitting || !email.trim()}
        className="w-full label-strong px-4 py-2.5 bg-ink text-paper hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-ink"
      >
        {submitting ? "transmitting…" : "request sign-in link →"}
      </button>

      {error && <p className="label text-classified">{error}</p>}
    </form>
  );
}
