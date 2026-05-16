import type { Card } from "@/lib/types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

// xs/sm are 1:1 (used in nav, inline). md/lg/xl are 4:5 portrait (used in cards).
const DIMS: Record<Size, { w: string; h: string; text: string; ratio: "1/1" | "4/5" }> = {
  xs: { w: "h-7 w-7", h: "", text: "text-[10px]", ratio: "1/1" },
  sm: { w: "h-10 w-10", h: "", text: "text-[11px]", ratio: "1/1" },
  md: { w: "w-16", h: "aspect-[4/5]", text: "text-base", ratio: "4/5" },
  lg: { w: "w-28", h: "aspect-[4/5]", text: "text-xl", ratio: "4/5" },
  xl: { w: "w-48", h: "aspect-[4/5]", text: "text-3xl", ratio: "4/5" },
};

type CardLike = Pick<Card, "name" | "handle"> & { photo_url?: string | null };

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "·";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Stable tones from handle — restricted to warm archival palette.
function tonesFromHandle(handle: string): { bg: string; fg: string } {
  let h = 0;
  for (let i = 0; i < handle.length; i++) h = (h * 31 + handle.charCodeAt(i)) >>> 0;
  const palette = [
    { bg: "#E5DCC6", fg: "#3F3625" }, // wheat
    { bg: "#D9CFAE", fg: "#3D3422" }, // straw
    { bg: "#E4D2B7", fg: "#523825" }, // tan
    { bg: "#CDC9B4", fg: "#37352B" }, // sage-stone
    { bg: "#D8C9B5", fg: "#4A3923" }, // sand
    { bg: "#E3D5BD", fg: "#43321F" }, // bone
  ];
  return palette[h % palette.length];
}

export function Avatar({
  card,
  size = "md",
  className = "",
}: {
  card: CardLike;
  size?: Size;
  className?: string;
}) {
  const dims = DIMS[size];
  const initials = initialsFromName(card.name);
  const tones = tonesFromHandle(card.handle);

  const isPortrait = dims.ratio === "4/5";
  const ringClass = isPortrait
    ? "border border-ink shadow-[2px_2px_0_rgba(14,13,11,0.06)]"
    : "border border-ink";

  if (card.photo_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={card.photo_url}
        alt={card.name}
        className={`${dims.w} ${dims.h} object-cover ${ringClass} ${className}`}
      />
    );
  }

  return (
    <div
      className={`${dims.w} ${dims.h} flex items-center justify-center font-mono uppercase tracking-[0.08em] select-none ${ringClass} ${dims.text} ${className}`}
      style={{ backgroundColor: tones.bg, color: tones.fg }}
      aria-label={card.name}
    >
      {initials}
    </div>
  );
}
