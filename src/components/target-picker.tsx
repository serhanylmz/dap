"use client";

import { Avatar } from "@/components/avatar";
import { fileNumber } from "@/lib/file-number";
import type { Card } from "@/lib/types";
import { useEffect, useRef, useState } from "react";

type Props = {
  value: Card;
  options: Card[];
  onChange: (next: Card) => void;
  disabled?: boolean;
  label?: string;
  hint?: string;
};

export function TargetPicker({
  value,
  options,
  onChange,
  disabled,
  label,
  hint,
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open && listRef.current) {
      const selected = listRef.current.querySelector<HTMLElement>(
        '[data-selected="true"]'
      );
      selected?.scrollIntoView({ block: "nearest" });
    }
  }, [open]);

  return (
    <div className="block">
      {label && (
        <span className="label-strong block mb-1">{label}</span>
      )}
      {hint && (
        <span className="block text-[11px] text-soft mb-2 leading-relaxed">
          {hint}
        </span>
      )}
      <div ref={wrapRef} className="relative">
        <button
          type="button"
          onClick={() => !disabled && setOpen((o) => !o)}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="w-full flex items-center justify-between gap-4 bg-paper-card border border-ink/40 hover:border-ink focus:border-ink py-2.5 px-3 outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50 text-left"
        >
          <span className="flex items-center gap-3 min-w-0">
            <Avatar card={value} size="sm" />
            <span className="min-w-0">
              <span className="block text-[14px] text-ink truncate font-medium">
                {value.name}
              </span>
              <span className="label text-mute mt-0.5 block">
                № {fileNumber(value.handle)} · @{value.handle}
              </span>
            </span>
          </span>
          <span className="flex items-center gap-2 shrink-0 text-mute">
            <span className="label hidden sm:inline">
              {value.origin.city.toLowerCase()}
            </span>
            <Chevron open={open} />
          </span>
        </button>

        {open && (
          <div
            ref={listRef}
            role="listbox"
            className="absolute top-full left-0 right-0 mt-1 max-h-96 overflow-y-auto bg-paper-card border border-ink shadow-[3px_3px_0_rgba(14,13,11,0.08)] z-50"
          >
            {options.map((c) => {
              const isSel = c.handle === value.handle;
              return (
                <button
                  type="button"
                  key={c.handle}
                  data-selected={isSel}
                  role="option"
                  aria-selected={isSel}
                  onClick={() => {
                    onChange(c);
                    setOpen(false);
                  }}
                  className={
                    "w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors border-b border-rule-soft last:border-b-0 " +
                    (isSel
                      ? "bg-accent-wash"
                      : "hover:bg-paper-deep")
                  }
                >
                  <Avatar card={c} size="sm" />
                  <span className="flex flex-col min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className="text-[14px] font-medium text-ink truncate">
                        {c.name}
                      </span>
                      <span className="label text-mute">@{c.handle}</span>
                    </span>
                    <span className="label text-soft mt-0.5">
                      № {fileNumber(c.handle)} · {c.origin.city.toLowerCase()} ·{" "}
                      {c.eventTags[0]?.toLowerCase() ?? ""}
                    </span>
                  </span>
                  {isSel && (
                    <span className="label text-accent shrink-0">selected</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      className={"transition-transform " + (open ? "rotate-180" : "")}
      aria-hidden
    >
      <path
        d="M2 4l3 3 3-3"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="square"
      />
    </svg>
  );
}
