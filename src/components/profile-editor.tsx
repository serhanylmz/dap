"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/avatar";
import type { Card } from "@/lib/types";

const EVENT_OPTIONS = [
  "SS26 SF",
  "Edge Esmeralda 26",
  "AI Engineer Summit",
  "NeurIPS SF satellite",
  "Manifest 26",
  "In SF, any week",
] as const;

export function ProfileEditor({ initial }: { initial: Card }) {
  const router = useRouter();
  const [card, setCard] = useState<Card>(initial);
  const [name, setName] = useState(initial.name);
  const [headline, setHeadline] = useState(initial.headline);
  const [building, setBuilding] = useState(initial.building);
  const [ask, setAsk] = useState(initial.ask);
  const [offer, setOffer] = useState(initial.offer);
  const [tags, setTags] = useState<string[]>(initial.eventTags);
  const [city, setCity] = useState(initial.origin.city);
  const [country, setCountry] = useState(initial.origin.country);
  const [twitter, setTwitter] = useState(
    initial.links
      .find((l) => l.href.includes("x.com"))
      ?.href.replace(/^https?:\/\/x\.com\//, "") ?? ""
  );
  const [github, setGithub] = useState(
    initial.links
      .find((l) => l.href.includes("github.com"))
      ?.href.replace(/^https?:\/\/github\.com\//, "") ?? ""
  );
  const [site, setSite] = useState(
    initial.links.find((l) => !l.href.includes("x.com") && !l.href.includes("github.com"))
      ?.href ?? ""
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [photoBusy, setPhotoBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/profile/photo", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "upload failed.");
      } else if (data.card) {
        setCard(data.card);
        router.refresh();
      }
    } catch {
      setError("network error.");
    } finally {
      setPhotoBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

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

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          headline: headline.trim(),
          building: building.trim(),
          ask: ask.trim(),
          offer: offer.trim(),
          event_tags: tags,
          origin_city: city.trim(),
          origin_country: country.trim(),
          links,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "save failed.");
        setSaving(false);
        return;
      }
      if (data.card) setCard(data.card);
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSave} className="grid grid-cols-1 lg:grid-cols-[14rem_1fr] gap-10">
      {/* PHOTO + IDENTITY SIDEBAR */}
      <aside>
        <div className="relative group">
          <Avatar card={card} size="xl" />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={photoBusy}
            className="absolute inset-0 flex items-center justify-center bg-ink/0 group-hover:bg-ink/60 transition-colors label-strong text-paper opacity-0 group-hover:opacity-100 disabled:cursor-wait"
            aria-label="upload photo"
          >
            {photoBusy ? "uploading…" : "upload portrait"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={onPhotoChange}
          />
        </div>
        <p className="label text-soft mt-3 leading-relaxed">
          4:5 portrait · jpeg/png/webp · max 5 MB
        </p>

        <div className="mt-6 space-y-1.5">
          <MetaRow label="handle">@{card.handle}</MetaRow>
          <MetaRow label="status">verified · active</MetaRow>
        </div>

        <div className="mt-8 flex flex-col gap-2">
          <button
            type="submit"
            disabled={saving}
            className="label-strong px-4 py-2.5 bg-ink text-paper hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-ink"
          >
            {saving ? "saving…" : "save changes →"}
          </button>
          {saved && <span className="label text-accent">saved ✓</span>}
          {error && <p className="label text-classified">{error}</p>}
        </div>
      </aside>

      {/* FORM FIELDS */}
      <div className="space-y-7">
        <Field label="full name">
          <Input value={name} onChange={setName} maxLength={80} required />
        </Field>

        <Field label="headline · self-description">
          <Input value={headline} onChange={setHeadline} maxLength={200} required />
        </Field>

        <Field label="currently building">
          <Textarea value={building} onChange={setBuilding} maxLength={280} rows={2} required />
        </Field>

        <Field label="asking for">
          <Textarea value={ask} onChange={setAsk} maxLength={400} rows={3} required />
        </Field>

        <Field label="offering">
          <Textarea value={offer} onChange={setOffer} maxLength={400} rows={3} required />
        </Field>

        <Field label="events attending">
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
        </Field>

        <Field label="origin">
          <div className="grid grid-cols-2 gap-3">
            <Input value={city} onChange={setCity} placeholder="city" maxLength={60} required />
            <Input value={country} onChange={setCountry} placeholder="country" maxLength={60} required />
          </div>
        </Field>

        <Field label="links">
          <div className="space-y-2.5">
            <Input value={twitter} onChange={setTwitter} placeholder="x handle (no @)" maxLength={40} />
            <Input value={github} onChange={setGithub} placeholder="github username" maxLength={40} />
            <Input value={site} onChange={setSite} placeholder="https://your-site.com" maxLength={120} />
          </div>
        </Field>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label-strong block mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-rule-soft pt-1.5">
      <dt className="label text-mute">{label}</dt>
      <dd className="text-[12px] text-ink mt-0.5 font-mono leading-snug">{children}</dd>
    </div>
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
