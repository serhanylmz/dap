import type { Card, CorpusChunk, Profile } from "@/lib/types";
import { serhan } from "@/data/serhan";
import { getVerifiedCard } from "@/lib/db/cards";

const STATIC_PROFILES: Record<string, Profile> = {
  serhan,
};

export async function resolveTarget(handle: string): Promise<Profile | null> {
  if (STATIC_PROFILES[handle]) return STATIC_PROFILES[handle];
  const card = await getVerifiedCard(handle);
  return card ? synthesizeProfile(card) : null;
}

/**
 * Build a Profile (corpus + voice samples) from any Card.
 * Use this for cards stored in Supabase that don't ship with a hand-crafted corpus.
 * The hand-crafted Serhan profile in data/serhan.ts is still preferred for him.
 */
export function synthesizeProfile(card: Card): Profile {
  const corpus: CorpusChunk[] = [
    {
      id: "headline",
      topic: "headline (their self-description)",
      content: card.headline,
      tags: [],
    },
    {
      id: "building",
      topic: "what they're building",
      content: card.building,
      tags: [],
    },
    {
      id: "ask",
      topic: "what they're asking for",
      content: card.ask,
      tags: [],
    },
    {
      id: "offer",
      topic: "what they offer",
      content: card.offer,
      tags: [],
    },
    ...card.artifacts.map((a, i) => ({
      id: `artifact-${i}`,
      topic: "shipped",
      content: a.detail,
      tags: [],
    })),
  ];

  // Voice samples are the card's own text — the closest thing we have to their writing.
  const voiceSamples = [
    card.headline,
    card.building,
    card.ask,
    card.offer,
  ].filter((s) => s.trim().length > 0);

  return { card, corpus, voiceSamples };
}
