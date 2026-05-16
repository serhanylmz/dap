"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Code = {
  code: string;
  used_by_handle: string | null;
  used_at: string | null;
  created_at: string;
};

type Props = {
  initialRemaining: number;
  initialCodes: Code[];
  unlimited: boolean;
  baseUrl: string;
};

export function ReferralsPanel({
  initialRemaining,
  initialCodes,
  unlimited,
  baseUrl,
}: Props) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(initialRemaining);
  const [codes, setCodes] = useState<Code[]>(initialCodes);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function generate() {
    if (busy) return;
    if (!unlimited && remaining <= 0) {
      setError("no referrals left.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/referrals", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "failed.");
        setBusy(false);
        return;
      }
      const newCode: Code = {
        code: data.code,
        used_by_handle: null,
        used_at: null,
        created_at: new Date().toISOString(),
      };
      setCodes((prev) => [newCode, ...prev]);
      if (!unlimited) setRemaining((r) => r - 1);
      router.refresh();
    } catch {
      setError("network error.");
    } finally {
      setBusy(false);
    }
  }

  async function copy(code: string) {
    const url = `${baseUrl}/join?ref=${code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(code);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // no-op fallback
    }
  }

  const used = codes.filter((c) => c.used_at).length;
  const unused = codes.length - used;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[18rem_1fr] gap-10">
      <aside className="border border-ink/40 bg-paper-card p-6 self-start">
        <span className="label-strong block mb-3">your allocation</span>
        <div className="font-mono text-7xl text-ink leading-none tabular-nums">
          {unlimited ? "∞" : String(remaining).padStart(2, "0")}
        </div>
        <p className="label text-mute mt-2">
          {unlimited ? "admin · unlimited" : `${remaining === 1 ? "referral" : "referrals"} remaining`}
        </p>

        <button
          onClick={generate}
          disabled={busy || (!unlimited && remaining <= 0)}
          className="mt-6 w-full label-strong px-4 py-2.5 bg-ink text-paper hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-ink"
        >
          {busy ? "issuing…" : "issue new code →"}
        </button>

        {error && <p className="label text-classified mt-3">{error}</p>}

        <dl className="mt-8 space-y-1.5">
          <MetaRow label="issued total">{codes.length}</MetaRow>
          <MetaRow label="redeemed">{used}</MetaRow>
          <MetaRow label="open">{unused}</MetaRow>
        </dl>
      </aside>

      <section>
        <div className="flex items-baseline justify-between border-b border-ink/30 pb-2 mb-1">
          <h3 className="label-strong">issued codes</h3>
          <span className="label text-mute">{codes.length} total</span>
        </div>

        {codes.length === 0 ? (
          <p className="mt-6 text-[14px] text-mute">
            no codes issued. press the button to generate your first invite.
          </p>
        ) : (
          <ul className="divide-y divide-rule-soft">
            {codes.map((c) => (
              <li
                key={c.code}
                className="py-4 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-center"
              >
                <div className="min-w-0">
                  <div className="font-mono text-[13px] text-ink break-all">
                    <span className="text-mute">{baseUrl}/join?ref=</span>
                    <span className={c.used_at ? "text-soft line-through" : "text-accent"}>
                      {c.code}
                    </span>
                  </div>
                  <div className="mt-1.5 label text-soft">
                    {c.used_at ? (
                      <>
                        redeemed by{" "}
                        <span className="text-mute">
                          @{c.used_by_handle ?? "—"}
                        </span>
                      </>
                    ) : (
                      "open · unused"
                    )}
                    {" · issued "}
                    {new Date(c.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
                {!c.used_at && (
                  <button
                    onClick={() => copy(c.code)}
                    className="label-strong px-3 py-1.5 border border-ink/40 hover:border-ink hover:bg-ink hover:text-paper transition-colors whitespace-nowrap"
                  >
                    {copied === c.code ? "copied ✓" : "copy link"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-rule-soft pt-1.5 flex items-baseline justify-between">
      <dt className="label text-mute">{label}</dt>
      <dd className="font-mono text-[14px] text-ink tabular-nums">{children}</dd>
    </div>
  );
}
