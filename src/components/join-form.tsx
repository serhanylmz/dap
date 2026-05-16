"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";

const EVENT_OPTIONS = [
  "SS26 SF",
  "Edge Esmeralda 26",
  "AI Engineer Summit",
  "NeurIPS SF satellite",
  "Manifest 26",
  "In SF, any week",
] as const;

type Props = {
  referralCode: string | null;
  referralInviterName?: string;
  prefilledEmail?: string;
};

export function JoinForm({ referralCode, prefilledEmail }: Props) {
  const [handle, setHandle] = useState("");
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [building, setBuilding] = useState("");
  const [ask, setAsk] = useState("");
  const [offer, setOffer] = useState("");
  const [tags, setTags] = useState<string[]>(["In SF, any week"]);
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [twitter, setTwitter] = useState("");
  const [github, setGithub] = useState("");
  const [site, setSite] = useState("");
  const [email, setEmail] = useState(prefilledEmail ?? "");

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{
    verified: boolean;
    handle: string;
    email: string;
    magicLinkSent: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (tags.length === 0) {
      setError("pick at least one event tag.");
      return;
    }

    const links: { label: string; href: string }[] = [];
    if (twitter.trim()) {
      const h = twitter.trim().replace(/^@/, "");
      links.push({ label: `x.com/${h}`, href: `https://x.com/${h}` });
    }
    if (github.trim()) {
      const h = github.trim();
      links.push({ label: `github / ${h}`, href: `https://github.com/${h}` });
    }
    if (site.trim()) {
      const url = site.trim().match(/^https?:\/\//) ? site.trim() : `https://${site.trim()}`;
      links.push({ label: url.replace(/^https?:\/\//, ""), href: url });
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: handle.toLowerCase().trim(),
          name: name.trim(),
          headline: headline.trim(),
          building: building.trim(),
          ask: ask.trim(),
          offer: offer.trim(),
          eventTags: tags,
          origin: { city: city.trim(), country: country.trim() },
          links,
          email: email.trim(),
          ref: referralCode ?? undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : `submission failed (${res.status}).`);
        setSubmitting(false);
        return;
      }

      let magicLinkSent = false;
      if (data.verified) {
        const supa = createBrowserSupabase();
        const redirectTo = new URL("/auth/callback", window.location.origin);
        const { error: otpErr } = await supa.auth.signInWithOtp({
          email: email.trim().toLowerCase(),
          options: { emailRedirectTo: redirectTo.toString(), shouldCreateUser: true },
        });
        magicLinkSent = !otpErr;
      }

      setDone({
        verified: !!data.verified,
        handle: handle.toLowerCase().trim(),
        email: email.trim(),
        magicLinkSent,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "network error");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="border border-ink p-8 bg-paper-card max-w-2xl">
        {done.verified ? (
          <>
            <span className="badge-amber">filed · approved</span>
            <h2 className="mt-5 font-display text-4xl leading-[0.95] tracking-tight">
              welcome to the dossier.
            </h2>
            <p className="mt-4 text-[15px] text-ink leading-relaxed">
              {done.magicLinkSent ? (
                <>
                  check{" "}
                  <span className="font-mono text-[14px]">{done.email}</span>{" "}
                  for a sign-in link. expires in an hour.
                </>
              ) : (
                <>
                  your card is live at{" "}
                  <span className="font-mono text-[14px]">
                    dap.cards/{done.handle}
                  </span>
                  .
                </>
              )}
            </p>
          </>
        ) : (
          <>
            <span className="stamp text-mute">pending · manual review</span>
            <h2 className="mt-5 font-display text-4xl leading-[0.95] tracking-tight">
              card received.
            </h2>
            <p className="mt-4 text-[14px] text-mute leading-relaxed">
              once approved you&apos;ll be able to sign in with the email you
              provided. ask a friend on dap for a referral link to skip the
              queue.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-7">
      <NumberedField n="01" label="handle" hint="lowercase, hyphens, 2-32 chars. becomes dap.cards/<handle>.">
        <Input value={handle} onChange={setHandle} placeholder="ada" maxLength={32} required />
      </NumberedField>

      <NumberedField n="02" label="full name">
        <Input value={name} onChange={setName} placeholder="ada lovelace" maxLength={80} required />
      </NumberedField>

      <div className="lg:col-span-2">
        <NumberedField n="03" label="headline · one-line self-description">
          <Input
            value={headline}
            onChange={setHeadline}
            placeholder="builder of analytical engines. occasional poet."
            maxLength={200}
            required
          />
        </NumberedField>
      </div>

      <div className="lg:col-span-2">
        <NumberedField n="04" label="currently building">
          <Textarea value={building} onChange={setBuilding} placeholder="..." maxLength={280} required rows={2} />
        </NumberedField>
      </div>

      <NumberedField n="05" label="asking for">
        <Textarea value={ask} onChange={setAsk} placeholder="..." maxLength={400} required rows={4} />
      </NumberedField>

      <NumberedField n="06" label="offering">
        <Textarea value={offer} onChange={setOffer} placeholder="..." maxLength={400} required rows={4} />
      </NumberedField>

      <div className="lg:col-span-2">
        <NumberedField n="07" label="events attending">
          <div className="flex flex-wrap gap-1.5">
            {EVENT_OPTIONS.map((tag) => {
              const on = tags.includes(tag);
              return (
                <button
                  type="button"
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={
                    "label-strong px-3 py-1.5 border transition-colors " +
                    (on
                      ? "border-ink bg-ink text-paper"
                      : "border-ink/30 text-mute hover:text-ink hover:border-ink")
                  }
                >
                  {tag.toLowerCase()}
                </button>
              );
            })}
          </div>
        </NumberedField>
      </div>

      <NumberedField n="08" label="origin">
        <div className="grid grid-cols-2 gap-3">
          <Input value={city} onChange={setCity} placeholder="city" maxLength={60} required />
          <Input value={country} onChange={setCountry} placeholder="country" maxLength={60} required />
        </div>
      </NumberedField>

      <NumberedField n="09" label="links (optional)">
        <div className="space-y-2.5">
          <Input value={twitter} onChange={setTwitter} placeholder="x handle (no @)" maxLength={40} />
          <Input value={github} onChange={setGithub} placeholder="github username" maxLength={40} />
          <Input value={site} onChange={setSite} placeholder="https://your-site.com" maxLength={120} />
        </div>
      </NumberedField>

      <div className="lg:col-span-2">
        <NumberedField n="10" label="email · how you'll sign in">
          <Input value={email} onChange={setEmail} placeholder="you@example.org" type="email" maxLength={160} required autoComplete="email" />
        </NumberedField>
      </div>

      <div className="lg:col-span-2 flex items-center gap-5 pt-6 border-t border-ink/15">
        <button
          type="submit"
          disabled={submitting}
          className="label-strong px-6 py-3 bg-ink text-paper hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-ink"
        >
          {submitting ? "filing…" : referralCode ? "file card · enter →" : "submit for review →"}
        </button>
        {error && <p className="label text-classified">{error}</p>}
      </div>
    </form>
  );
}

function NumberedField({
  n,
  label,
  hint,
  children,
}: {
  n: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline gap-3 mb-1.5">
        <span className="label-strong text-faint w-7 shrink-0">{n}</span>
        <span className="label-strong">{label}</span>
      </div>
      {hint && (
        <p className="ml-10 text-[11px] text-soft mb-2 leading-relaxed">{hint}</p>
      )}
      <div className="ml-10">{children}</div>
    </label>
  );
}

function Input({
  value,
  onChange,
  ...rest
}: {
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <input
      {...rest}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-paper-card border border-ink/40 focus:border-ink py-2 px-3 text-[14px] outline-none transition-colors"
    />
  );
}

function Textarea({
  value,
  onChange,
  ...rest
}: {
  value: string;
  onChange: (v: string) => void;
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange">) {
  return (
    <textarea
      {...rest}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-paper-card border border-ink/40 focus:border-ink py-2 px-3 text-[14px] outline-none transition-colors resize-none leading-relaxed"
    />
  );
}
