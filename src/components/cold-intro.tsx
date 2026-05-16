"use client";

import type { Card, JudgeVerdict } from "@/lib/types";
import { useRef, useState } from "react";
import { TargetPicker } from "@/components/target-picker";

type StageId = "extract" | "retrieve" | "search" | "draft" | "judge" | "revise";
const STAGES: { id: StageId; label: string }[] = [
  { id: "extract", label: "extract" },
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

type Props = {
  target: Card;
  availableTargets?: Card[];
};

export function ColdIntro({ target, availableTargets }: Props) {
  const [selected, setSelected] = useState<Card>(target);
  const [name, setName] = useState("");
  const [work, setWork] = useState("");
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
  const abortRef = useRef<AbortController | null>(null);

  const firstName = selected.name.split(" ")[0].toLowerCase();
  const hasPicker = (availableTargets?.length ?? 0) > 1;

  async function generate() {
    if (!name.trim() || !work.trim() || isRunning) return;
    setIsRunning(true);
    setStreamed("");
    setFinalText("");
    setError(null);
    setDebug({ retrievedIds: [], webFindings: [], verdict: null, pass: 1 });
    setStage(null);

    const controller = new AbortController();
    abortRef.current = controller;

    let res: Response;
    try {
      res = await fetch("/api/intro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          work: work.trim(),
          target: selected.handle,
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

  function cancel() {
    abortRef.current?.abort();
    setIsRunning(false);
    setStage(null);
  }

  const showingFinal = finalText.length > 0;
  const showingStream = streamed.length > 0 && !showingFinal;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-10 lg:gap-14">
      {/* LEFT — input form */}
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-4xl sm:text-5xl leading-[0.9] tracking-tight text-ink">
            draft a cold intro
            <br />
            <span className="font-display-italic text-accent">to anyone on file.</span>
          </h2>
          <p className="mt-3 text-[14px] text-mute leading-relaxed max-w-md">
            four agents in sequence: extract your interests, retrieve the
            target&apos;s relevant work, draft in their voice, judge for
            specificity.
          </p>
        </div>

        {hasPicker && availableTargets && (
          <TargetPicker
            label="intro to"
            hint={`writing as ${selected.name.toLowerCase()}, in their voice.`}
            value={selected}
            options={availableTargets}
            onChange={(c) => {
              setSelected(c);
              setStreamed("");
              setFinalText("");
              setError(null);
              setStage(null);
              setDebug({ retrievedIds: [], webFindings: [], verdict: null, pass: 1 });
            }}
            disabled={isRunning}
          />
        )}

        <Field label="your name">
          <Input
            value={name}
            onChange={setName}
            placeholder="ada"
            disabled={isRunning}
            maxLength={80}
          />
        </Field>

        <Field label="what you're building">
          <Input
            value={work}
            onChange={setWork}
            placeholder="voice agents that handle insurance claims"
            disabled={isRunning}
            maxLength={240}
          />
        </Field>

        <div className="flex items-center gap-4">
          <button
            onClick={generate}
            disabled={isRunning || !name.trim() || !work.trim()}
            className="label-strong px-5 py-2.5 bg-ink text-paper hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-ink"
          >
            {isRunning ? "drafting…" : `brief ${firstName} →`}
          </button>
          {isRunning && (
            <button
              onClick={cancel}
              className="label text-mute hover:text-classified"
            >
              cancel
            </button>
          )}
        </div>
      </div>

      {/* RIGHT — output panel */}
      <div className="lg:border-l lg:border-ink/15 lg:pl-10 space-y-5">
        <div className="flex items-baseline justify-between gap-4">
          <span className="label-strong">briefing output</span>
          <span className="label text-mute">
            {finalText ? "delivered" : isRunning ? "in progress" : "ready"}
          </span>
        </div>

        <StageRail current={stage} pass={debug.pass} />

        <div className="min-h-[140px] relative">
          {!stage && !streamed && !finalText && !error && (
            <p className="font-display-italic text-xl text-faint leading-relaxed">
              fill in the fields and request a briefing.
            </p>
          )}

          {showingStream && (
            <p className="font-display-italic text-[19px] sm:text-xl leading-relaxed text-ink whitespace-pre-wrap">
              {streamed}
              <Caret />
            </p>
          )}

          {showingFinal && (
            <p className="font-display-italic text-[19px] sm:text-xl leading-relaxed text-ink whitespace-pre-wrap">
              {finalText}
            </p>
          )}

          {error && <p className="label text-classified mt-3">{error}</p>}
        </div>

        {(debug.retrievedIds.length > 0 || debug.webFindings.length > 0 || debug.verdict) && (
          <details className="group border-t border-rule-soft pt-3">
            <summary className="label cursor-pointer hover:text-ink list-none flex items-center gap-2">
              <span className="inline-block w-3 transition-transform group-open:rotate-90">›</span>
              pipeline trace
            </summary>
            <div className="mt-3 pl-4 border-l border-rule space-y-3 font-mono text-[11px] text-mute leading-relaxed">
              {debug.retrievedIds.length > 0 && (
                <div>
                  <div className="text-soft mb-1">retrieved · bm25 top-k</div>
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
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label-strong block mb-1">{label}</span>
      {children}
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
      autoComplete="off"
      className="w-full bg-paper-card border border-ink/40 focus:border-ink py-2 px-3 text-[15px] outline-none transition-colors disabled:opacity-50"
    />
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
    <ol className="flex items-stretch gap-0 border border-ink/30 divide-x divide-ink/30">
      {STAGES.map((s, i) => {
        const state = i < idx ? "past" : i === idx ? "current" : "future";
        return (
          <li
            key={s.id}
            className={`flex-1 px-2 py-1.5 ${
              state === "current"
                ? "bg-accent text-paper"
                : state === "past"
                ? "bg-paper-card text-mute"
                : "bg-transparent text-faint"
            }`}
          >
            <div className="label-strong text-current text-[9px] flex items-center justify-between gap-1">
              <span>0{i + 1}</span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
