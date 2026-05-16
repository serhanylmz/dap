"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function InboxActions({ friendshipId }: { friendshipId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"accept" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(action: "accept" | "reject") {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch("/api/friends/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendship_id: friendshipId, action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "failed.");
        setBusy(null);
        return;
      }
      router.refresh();
    } catch {
      setError("network error.");
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <button
          onClick={() => act("accept")}
          disabled={busy !== null}
          className="label-strong px-3 py-1.5 bg-ink text-paper hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {busy === "accept" ? "…" : "approve"}
        </button>
        <button
          onClick={() => act("reject")}
          disabled={busy !== null}
          className="label-strong px-3 py-1.5 border border-ink/30 text-mute hover:text-classified hover:border-classified transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {busy === "reject" ? "…" : "reject"}
        </button>
      </div>
      {error && <p className="label text-classified">{error}</p>}
    </div>
  );
}
