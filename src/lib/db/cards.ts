import type { Card, EventTag } from "@/lib/types";
import {
  isSupabaseConfigured,
  isSupabaseServiceConfigured,
  supabasePublic,
  supabaseService,
} from "@/lib/supabase";
import { serhan } from "@/data/serhan";

function parseAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);
}

function getStaticOwners(): Record<string, Card> {
  const ownerHandle = (process.env.STATIC_OWNER_HANDLE ?? "").trim();
  if (!ownerHandle || ownerHandle !== serhan.card.handle) return {};
  const map: Record<string, Card> = {};
  for (const email of parseAdminEmails()) map[email] = serhan.card;
  return map;
}

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return parseAdminEmails().includes(email.toLowerCase().trim());
}

type CardRow = {
  handle: string;
  name: string;
  voice: "casual" | "formal";
  headline: string;
  building: string;
  ask: string;
  offer: string;
  event_tags: string[];
  origin_city: string;
  origin_country: string;
  links: { label: string; href: string }[];
  artifacts: { detail: string; url?: string }[];
  photo_url?: string | null;
};

const CARD_COLS =
  "handle,name,voice,headline,building,ask,offer,event_tags,origin_city,origin_country,links,artifacts,photo_url";

function rowToCard(row: CardRow): Card {
  return {
    handle: row.handle,
    name: row.name,
    voice: row.voice,
    headline: row.headline,
    building: row.building,
    ask: row.ask,
    offer: row.offer,
    eventTags: row.event_tags as EventTag[],
    origin: { city: row.origin_city, country: row.origin_country },
    links: row.links ?? [],
    artifacts: row.artifacts ?? [],
    photo_url: row.photo_url ?? null,
  };
}

export async function getVerifiedCard(handle: string): Promise<Card | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabasePublic()
    .from("cards")
    .select(CARD_COLS)
    .eq("handle", handle)
    .eq("verified", true)
    .maybeSingle();
  if (error) {
    console.error("getVerifiedCard:", error.message);
    return null;
  }
  return data ? rowToCard(data as CardRow) : null;
}

// Includes the static serhan baseline.
export async function getVerifiedCount(): Promise<number> {
  if (!isSupabaseConfigured()) return 1;
  const { count, error } = await supabasePublic()
    .from("cards")
    .select("handle", { count: "exact", head: true })
    .eq("verified", true);
  if (error) {
    console.error("getVerifiedCount:", error.message);
    return 1;
  }
  return (count ?? 0) + 1;
}

// Used by the auth flow — looks up the card whose email matches a signed-in user.
// Uses the service-role client because cards.email isn't in the public select projection.
export async function getCardForUser(email: string): Promise<Card | null> {
  const normalized = email.toLowerCase().trim();
  const fallback = getStaticOwners()[normalized] ?? null;
  if (!isSupabaseServiceConfigured()) return fallback;
  const { data, error } = await supabaseService()
    .from("cards")
    .select(CARD_COLS)
    .ilike("email", normalized)
    .eq("verified", true)
    .maybeSingle();
  if (error) {
    console.error("getCardForUser:", error.message);
    return fallback;
  }
  if (data) return rowToCard(data as CardRow);
  return fallback;
}

export type CardUpdate = Partial<{
  name: string;
  headline: string;
  building: string;
  ask: string;
  offer: string;
  event_tags: string[];
  origin_city: string;
  origin_country: string;
  links: { label: string; href: string }[];
  photo_url: string | null;
}>;

export async function upsertOwnCard(
  ownerEmail: string,
  handle: string,
  patch: CardUpdate
): Promise<{ ok: true; card: Card } | { ok: false; error: string }> {
  if (!isSupabaseServiceConfigured()) {
    return { ok: false, error: "service not configured" };
  }
  const supa = supabaseService();
  const email = ownerEmail.toLowerCase().trim();

  const { data: existing } = await supa
    .from("cards")
    .select("handle,email")
    .eq("handle", handle)
    .maybeSingle();

  if (existing) {
    if (existing.email !== email) {
      return { ok: false, error: "you don't own this card" };
    }
    const { error: updErr } = await supa.from("cards").update(patch).eq("handle", handle);
    if (updErr) return { ok: false, error: updErr.message };
  } else {
    const seed = getStaticOwners()[email];
    if (!seed || seed.handle !== handle) {
      return { ok: false, error: "no card exists for that handle" };
    }
    const insertRow = {
      handle: seed.handle,
      name: patch.name ?? seed.name,
      voice: seed.voice,
      headline: patch.headline ?? seed.headline,
      building: patch.building ?? seed.building,
      ask: patch.ask ?? seed.ask,
      offer: patch.offer ?? seed.offer,
      event_tags: patch.event_tags ?? seed.eventTags,
      origin_city: patch.origin_city ?? seed.origin.city,
      origin_country: patch.origin_country ?? seed.origin.country,
      links: patch.links ?? seed.links,
      artifacts: seed.artifacts,
      photo_url: patch.photo_url ?? null,
      email,
      verified: true,
    };
    const { error: insErr } = await supa.from("cards").insert(insertRow);
    if (insErr) return { ok: false, error: insErr.message };
  }

  const { data: latest, error: readErr } = await supa
    .from("cards")
    .select(CARD_COLS)
    .eq("handle", handle)
    .maybeSingle();
  if (readErr || !latest) {
    return { ok: false, error: readErr?.message ?? "couldn't reload card" };
  }
  return { ok: true, card: rowToCard(latest as CardRow) };
}

export async function listPendingCards(): Promise<(Card & { email: string; id: string; created_at: string })[]> {
  if (!isSupabaseServiceConfigured()) return [];
  const { data, error } = await supabaseService()
    .from("cards")
    .select(
      "id,handle,name,voice,headline,building,ask,offer,event_tags,origin_city,origin_country,links,artifacts,email,created_at"
    )
    .eq("verified", false)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("listPendingCards:", error.message);
    return [];
  }
  return (data ?? []).map((row) => {
    const r = row as CardRow & { id: string; email: string; created_at: string };
    return {
      ...rowToCard(r),
      id: r.id,
      email: r.email,
      created_at: r.created_at,
    };
  });
}

export async function setCardVerified(
  cardId: string,
  verified: boolean
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseServiceConfigured()) return { ok: false, error: "service not configured" };
  const { error } = await supabaseService()
    .from("cards")
    .update({ verified })
    .eq("id", cardId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteCard(cardId: string): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseServiceConfigured()) return { ok: false, error: "service not configured" };
  const { error } = await supabaseService().from("cards").delete().eq("id", cardId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Lightweight lookup by handle for display purposes (no email projected).
 * Searches static profiles first, then DB. Returns null on miss.
 */
export async function getCardByHandleForDisplay(handle: string): Promise<Card | null> {
  if (handle === serhan.card.handle) return serhan.card;
  return getVerifiedCard(handle);
}

export async function getReferralsRemaining(handle: string): Promise<number> {
  if (!isSupabaseServiceConfigured()) return 0;
  const { data, error } = await supabaseService()
    .from("cards")
    .select("referrals_remaining")
    .eq("handle", handle)
    .maybeSingle();
  if (error || !data) return 0;
  return (data.referrals_remaining as number) ?? 0;
}

/**
 * All public verified cards including Serhan's static card if he hasn't been inserted into DB yet.
 * Use for /all, /intro target list, etc.
 */
export async function listAllPublicCards(): Promise<Card[]> {
  const dbCards = await listVerifiedCards();
  const hasSerhan = dbCards.some((c) => c.handle === serhan.card.handle);
  return hasSerhan ? dbCards : [serhan.card, ...dbCards];
}

export async function listVerifiedCards(): Promise<Card[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabasePublic()
    .from("cards")
    .select(CARD_COLS)
    .eq("verified", true)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("listVerifiedCards:", error.message);
    return [];
  }
  return (data as CardRow[]).map(rowToCard);
}
