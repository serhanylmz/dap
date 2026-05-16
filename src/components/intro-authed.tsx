"use client";

import type { Card, JudgeVerdict } from "@/lib/types";
import { useRef, useState } from "react";
import { Avatar } from "@/components/avatar";
import { TargetPicker } from "@/components/target-picker";
import { fileNumber } from "@/lib/file-number";

type StageId = "extract" | "path" | "retrieve" | "search" | "draft" | "judge" | "revise";
const STAGES: { id: StageId; label: string }[] = [
  { id: "extract", label: "extract" },
  { id: "path", label: "path" },
  { id: "retrieve", label: "retrieve" },
  { id: "search", label: "search" },
  { id: "draft", label: "draft" },
  { id: "judge", label: "judge" },
];

type DebugInfo = {
  retrievedIds: { id: string; score: number }[];
  webFindings: string[];
  verdict: JudgeVerdict | null;
  pass: 1 | 2;
};

type RelationState =
  | "none"
  | "pending_outgoing"
  | "pending_incoming"
  | "accepted"
  | "rejected";

type Relation = { state: RelationState; friendshipId?: string };

type Props = {
  source: Card;
  targets: Card[];
  userEmail: string;
  initialTargetHandle?: string;
  relations: Record<string, Relation>;
};

export function IntroAuthed({
  source,
  targets,
  initialTargetHandle,
  relations: initialRelations,
}: Props) {
  const initial =
    targets.find((t) => t.handle === initialTargetHandle) ?? targets[0] ?? null;
  const [selected, setSelected] = useState<Card | null>(initial);
  const [notes, setNotes] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [stage, setStage] = useState<StageId | null>(null);
  const [streamed, setStreamed] = useState("");
  const [finalText, setFinalText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<DebugInfo>({
    retrievedIds: [],
    webFindings: [],
    verdict: null,
    pass: 1,
  });
  const [pathState, setPathState] = useState<{
    handles: string[];
    names: Record<string, string>;
  } | null>(null);
  const [relations, setRelations] =
    useState<Record<string, Relation>>(initialRelations);
  const [friendBusy, setFriendBusy] = useState(false);
  const [friendError, setFriendError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  function resetOutput() {
    setStreamed("");
    setFinalText("");
    setError(null);
    setStage(null);
    setPathState(null);
    setDebug({ retrievedIds: [], webFindings: [], verdict: null, pass: 1 });
    setFriendError(null);
  }

  async function generate() {
    if (!selected || isRunning) return;
    setIsRunning(true);
    resetOutput();

    const controller = new AbortController();
    abortRef.current = controller;

    let res: Response;
    try {
      res = await fetch("/api/intro/authed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: selected.handle,
          additional_notes: notes.trim() || undefined,
        }),
        signal: controller.signal,
      });
    } catch (e) {
      setIsRunning(false);
      setError(
        e instanceof Error && e.name === "AbortError" ? "cancelled." : "network error."
      );
      return;
    }

    if (!res.ok || !res.body) {
      const message = await res.text();
      setIsRunning(false);
      setError(message || `request failed (${res.status})`);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let sep: number;
        while ((sep = buffer.indexOf("\n\n")) !== -1) {
          const raw = buffer.slice(0, sep);
          buffer = buffer.slice(sep + 2);
          const lines = raw.split("\n");
          let event = "message";
          let dataLine = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) event = line.slice(7);
            else if (line.startsWith("data: ")) dataLine = line.slice(6);
          }
          if (!dataLine) continue;
          let data: unknown;
          try {
            data = JSON.parse(dataLine);
          } catch {
            continue;
          }
          switch (event) {
            case "stage": {
              const id = (data as { id: StageId }).id;
              setStage(id);
              if (id === "revise") {
                setDebug((d) => ({ ...d, pass: 2 }));
                setStreamed("");
              }
              break;
            }
            case "path": {
              setPathState(data as { handles: string[]; names: Record<string, string> });
              break;
            }
            case "retrieved": {
              setDebug((d) => ({
                ...d,
                retrievedIds: (data as { chunks: { id: string; score: number }[] }).chunks,
              }));
              break;
            }
            case "search": {
              setDebug((d) => ({
                ...d,
                webFindings: (data as { findings: string[] }).findings ?? [],
              }));
              break;
            }
            case "token": {
              setStreamed((prev) => prev + (data as { text: string }).text);
              break;
            }
            case "verdict": {
              setDebug((d) => ({ ...d, verdict: data as JudgeVerdict }));
              break;
            }
            case "final": {
              setFinalText((data as { text: string }).text);
              break;
            }
            case "error": {
              setError((data as { message: string }).message);
              break;
            }
            case "done": {
              setStage(null);
              setIsRunning(false);
              break;
            }
          }
        }
      }
    } catch (e) {
      if (!(e instanceof Error && e.name === "AbortError")) {
        setError(e instanceof Error ? e.message : "stream error");
      }
    } finally {
      setIsRunning(false);
    }
  }

  async function sendFriendRequest() {
    if (!selected || friendBusy) return;
    setFriendBusy(true);
    setFriendError(null);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient: selected.handle }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFriendError(typeof data.error === "string" ? data.error : "failed.");
        setFriendBusy(false);
        return;
      }
      setRelations((prev) => ({
        ...prev,
        [selected.handle]: { state: "pending_outgoing" },
      }));
    } catch {
      setFriendError("network error.");
    } finally {
      setFriendBusy(false);
    }
  }

  const showingFinal = finalText.length > 0;
  const showingStream = streamed.length > 0 && !showingFinal;
  const targetRelation: Relation = selected
    ? relations[selected.handle] ?? { state: "none" }
    : { state: "none" };

  return (
    <div>
      {/* Header / dossier line */}
      <div className="border-b border-ink pb-3 mb-10 flex items-baseline justify-between gap-4">
        <span className="label-strong">BRIEFING REQUEST · AUTHED</span>
        <span className="label text-mute hidden sm:inline">
          № {fileNumber(source.handle)} · APPLICANT ON FILE
        </span>
      </div>

      {/* Two-card header — applicant + subject */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 items-stretch mb-10">
        <PartyCard
          label="applicant"
          card={source}
        />
        <div className="flex items-center justify-center text-faint">
          <span className="font-display-italic text-3xl">→</span>
        </div>
        {selected ? (
          <PartyCard label="subject" card={selected} highlight />
        ) : (
          <div className="border border-rule p-4 flex items-center justify-center min-h-[120px]">
            <span className="label text-faint">no subject — pick one below</span>
          </div>
        )}
      </div>

      {/* Picker + notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
        <div>
          <TargetPicker
            label="select subject"
            hint={
              targets.length === 0
                ? "no one else on file — invite a friend"
                : `${targets.length} ${targets.length === 1 ? "subject" : "subjects"} on file.`
            }
            value={selected ?? source}
            options={targets}
            onChange={(c) => {
              setSelected(c);
              resetOutput();
            }}
            disabled={isRunning || targets.length === 0}
          />
        </div>

        <div>
          <label className="block">
            <span className="label-strong block mb-1">additional notes</span>
            <span className="block text-[11px] text-soft mb-2 leading-relaxed">
              optional. anything that&apos;d sharpen the intro — a paper they
              wrote, a problem you&apos;re stuck on, an event you&apos;ll both be at.
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isRunning}
              maxLength={600}
              rows={4}
              placeholder="(none)"
              className="w-full bg-paper-card border border-ink/40 focus:border-ink py-2 px-3 text-[14px] outline-none transition-colors resize-none leading-relaxed disabled:opacity-50"
            />
          </label>
        </div>
      </div>

      <div className="flex items-center gap-4 pb-10 border-b border-ink/15">
        <button
          onClick={generate}
          disabled={isRunning || !selected}
          className="label-strong px-6 py-3 bg-ink text-paper hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-ink"
        >
          {isRunning
            ? "drafting…"
            : selected
            ? `brief ${selected.name.split(" ")[0].toLowerCase()} →`
            : "no target"}
        </button>
      </div>

      {/* Output area */}
      {(stage || streamed || finalText || error || pathState) && (
        <section className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-10">
          <aside className="space-y-6">
            <div>
              <span className="label-strong block mb-3">pipeline</span>
              <StageRail current={stage} pass={debug.pass} />
            </div>
            {pathState && <PathDisplay path={pathState} />}
            {(debug.retrievedIds.length > 0 || debug.webFindings.length > 0 || debug.verdict) && (
              <details className="border-t border-rule-soft pt-3 group">
                <summary className="label cursor-pointer hover:text-ink list-none flex items-center gap-2">
                  <span className="inline-block w-3 transition-transform group-open:rotate-90">›</span>
                  pipeline trace
                </summary>
                <div className="mt-3 pl-4 border-l border-rule space-y-3 font-mono text-[11px] text-mute leading-relaxed">
                  {debug.retrievedIds.length > 0 && (
                    <div>
                      <div className="text-soft mb-1">retrieved (bm25)</div>
                      {debug.retrievedIds.map((r) => (
                        <div key={r.id} className="flex justify-between">
                          <span>{r.id}</span>
                          <span className="text-soft tabular-nums">{r.score}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {debug.webFindings.length > 0 && (
                    <div>
                      <div className="text-soft mb-1">web search · findings</div>
                      <ul className="space-y-0.5">
                        {debug.webFindings.map((f, i) => (
                          <li key={i} className="text-mute">w{i + 1}. {f}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {debug.verdict && (
                    <div>
                      <div className="text-soft mb-1">judge</div>
                      <div>
                        passes=
                        <span className={debug.verdict.passes ? "text-ink" : "text-classified"}>
                          {String(debug.verdict.passes)}
                        </span>{" "}
                        · score={debug.verdict.score}
                      </div>
                      {debug.verdict.issues.length > 0 && (
                        <ul className="mt-1 space-y-0.5">
                          {debug.verdict.issues.map((iss, i) => (
                            <li key={i} className="text-soft">· {iss}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                  {debug.pass === 2 && (
                    <div className="text-accent">rejected pass 1 → revise pass triggered.</div>
                  )}
                </div>
              </details>
            )}
          </aside>

          <div className="space-y-5">
            <div className="flex items-baseline justify-between gap-4">
              <span className="label-strong">briefing output</span>
              <span className="label text-mute">
                {finalText ? "delivered" : isRunning ? "in progress" : "ready"}
              </span>
            </div>

            <div className="min-h-[180px]">
              {showingStream && (
                <p className="font-display-italic text-xl sm:text-2xl leading-relaxed text-ink whitespace-pre-wrap">
                  {streamed}
                  <Caret />
                </p>
              )}
              {showingFinal && (
                <p className="font-display-italic text-xl sm:text-2xl leading-relaxed text-ink whitespace-pre-wrap">
                  {finalText}
                </p>
              )}
              {error && <p className="label text-classified mt-3">{error}</p>}
            </div>

            {showingFinal && selected && (
              <FriendActions
                relation={targetRelation}
                targetName={selected.name.split(" ")[0]}
                onRequest={sendFriendRequest}
                busy={friendBusy}
                error={friendError}
              />
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function PartyCard({
  label,
  card,
  highlight,
}: {
  label: string;
  card: Card;
  highlight?: boolean;
}) {
  return (
    <div
      className={`border ${
        highlight ? "border-accent" : "border-ink/40"
      } bg-paper-card px-3 py-3 grid grid-cols-[auto_1fr] gap-3 items-center`}
    >
      <Avatar card={card} size="sm" />
      <div className="min-w-0">
        <span
          className={`label-strong ${highlight ? "text-accent" : ""} block`}
        >
          {label}
        </span>
        <p className="text-[14px] text-ink truncate mt-0.5 font-medium">
          {card.name}
        </p>
        <p className="label text-mute mt-0.5">№ {fileNumber(card.handle)}</p>
      </div>
    </div>
  );
}

function PathDisplay({
  path,
}: {
  path: { handles: string[]; names: Record<string, string> };
}) {
  if (path.handles.length === 0) {
    return (
      <div>
        <span className="label-strong block mb-2">graph path</span>
        <p className="text-[12px] text-soft leading-relaxed">
          no mutual connection. truly cold.
        </p>
      </div>
    );
  }
  return (
    <div>
      <span className="label-strong block mb-2">
        graph path · {path.handles.length === 2 ? "direct" : `${path.handles.length - 2} hop`}
      </span>
      <ol className="space-y-1">
        {path.handles.map((h, i) => (
          <li key={h} className="flex items-baseline gap-2">
            <span className="label text-faint w-4">{i + 1}.</span>
            <span className="text-[13px] text-ink lowercase">
              {path.names[h] ?? h}
            </span>
            {i < path.handles.length - 1 && (
              <span className="text-faint">·</span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function FriendActions({
  relation,
  targetName,
  onRequest,
  busy,
  error,
}: {
  relation: Relation;
  targetName: string;
  onRequest: () => void;
  busy: boolean;
  error: string | null;
}) {
  const lower = targetName.toLowerCase();
  let content: React.ReactNode;
  switch (relation.state) {
    case "accepted":
      content = (
        <p className="label text-accent">
          ✓ you and {lower} are confirmed contacts
        </p>
      );
      break;
    case "pending_outgoing":
      content = <p className="label text-soft">request transmitted — awaiting reply</p>;
      break;
    case "pending_incoming":
      content = (
        <p className="label text-accent">
          {lower} has sent you a request — check inbox
        </p>
      );
      break;
    case "rejected":
      content = <p className="label text-soft">request was declined</p>;
      break;
    case "none":
    default:
      content = (
        <button
          onClick={onRequest}
          disabled={busy}
          className="label-strong px-3 py-1.5 border border-ink hover:bg-ink hover:text-paper transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {busy ? "transmitting…" : `transmit request to ${lower} →`}
        </button>
      );
  }
  return (
    <div className="pt-4 border-t border-rule-soft">
      {content}
      {error && <p className="label text-classified mt-2">{error}</p>}
    </div>
  );
}

function Caret() {
  return (
    <span className="inline-block w-[0.5em] h-[1em] -mb-[0.1em] ml-[0.05em] bg-accent animate-pulse" />
  );
}

function StageRail({ current, pass }: { current: StageId | null; pass: 1 | 2 }) {
  const baseIdx = current ? STAGES.findIndex((s) => s.id === current) : -1;
  const idx = current === "revise" ? STAGES.length - 1 : baseIdx;
  return (
    <ol className="border border-ink/30 divide-y divide-ink/30">
      {STAGES.map((s, i) => {
        const state = i < idx ? "past" : i === idx ? "current" : "future";
        return (
          <li
            key={s.id}
            className={`px-3 py-2 flex items-center justify-between gap-3 ${
              state === "current"
                ? "bg-accent text-paper"
                : state === "past"
                ? "bg-paper-card text-mute"
                : "bg-transparent text-faint"
            }`}
          >
            <span className="label-strong text-current">
              0{i + 1} · {s.label}
            </span>
            <span className="label-strong text-current">
              {state === "current" ? "●" : state === "past" ? "✓" : "○"}
            </span>
          </li>
        );
      })}
      {pass === 2 && (
        <li className="px-3 py-2 bg-classified text-paper flex items-center justify-between gap-3">
          <span className="label-strong text-current">revise pass</span>
          <span className="label-strong text-current">↻</span>
        </li>
      )}
    </ol>
  );
}
