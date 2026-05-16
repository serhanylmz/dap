import { randomBytes } from "node:crypto";
import {
  isSupabaseServiceConfigured,
  supabaseService,
} from "@/lib/supabase";

export type ReferralCode = {
  code: string;
  inviter_handle: string;
  used_by_handle: string | null;
  used_at: string | null;
  created_at: string;
};

function newCode(): string {
  return randomBytes(8).toString("hex");
}

/**
 * Generate a new referral code for the inviter.
 * If unlimited=true (admin), no counter decrement.
 * Otherwise atomically decrements cards.referrals_remaining.
 */
export async function generateReferralCode(
  inviterHandle: string,
  options: { unlimited: boolean }
): Promise<{ ok: true; code: string } | { ok: false; error: string }> {
  if (!isSupabaseServiceConfigured()) {
    return { ok: false, error: "service not configured" };
  }
  const supa = supabaseService();

  if (!options.unlimited) {
    const { data: card, error: readErr } = await supa
      .from("cards")
      .select("referrals_remaining")
      .eq("handle", inviterHandle)
      .maybeSingle();

    if (readErr || !card) {
      return { ok: false, error: "couldn't find your card" };
    }

    const remaining = (card.referrals_remaining as number) ?? 0;
    if (remaining <= 0) {
      return { ok: false, error: "you have no referrals left" };
    }

    const { error: decErr } = await supa
      .from("cards")
      .update({ referrals_remaining: remaining - 1 })
      .eq("handle", inviterHandle)
      .eq("referrals_remaining", remaining);

    if (decErr) {
      return { ok: false, error: "couldn't reserve a referral slot" };
    }
  }

  // Retry a couple of times on collision (very unlikely with 16 hex chars).
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = newCode();
    const { error } = await supa.from("referral_codes").insert({
      code,
      inviter_handle: inviterHandle,
    });
    if (!error) return { ok: true, code };
    if (error.code !== "23505") {
      // not a unique-violation — bail
      console.error("generateReferralCode:", error.message);
      return { ok: false, error: "failed to generate a code" };
    }
  }
  return { ok: false, error: "exhausted retries generating a code" };
}

/**
 * Atomically consume a referral code if it's valid and unused.
 * Returns the inviter handle on success.
 */
export async function consumeReferralCode(
  code: string,
  newCardHandle: string
): Promise<{ ok: true; inviterHandle: string } | { ok: false; error: string }> {
  if (!isSupabaseServiceConfigured()) {
    return { ok: false, error: "service not configured" };
  }
  if (!/^[a-z0-9]{12,32}$/.test(code)) {
    return { ok: false, error: "invalid code format" };
  }
  const supa = supabaseService();

  // Conditional update: only succeeds if used_at is still null.
  const { data, error } = await supa
    .from("referral_codes")
    .update({
      used_by_handle: newCardHandle,
      used_at: new Date().toISOString(),
    })
    .eq("code", code)
    .is("used_at", null)
    .select("inviter_handle")
    .maybeSingle();

  if (error) {
    console.error("consumeReferralCode:", error.message);
    return { ok: false, error: "couldn't validate the referral code" };
  }
  if (!data) {
    return { ok: false, error: "referral code is invalid or already used" };
  }
  return { ok: true, inviterHandle: data.inviter_handle as string };
}

/**
 * Lookup-only — for display purposes (does NOT consume).
 */
export async function lookupReferralCode(
  code: string
): Promise<{ inviterHandle: string; used: boolean } | null> {
  if (!isSupabaseServiceConfigured()) return null;
  if (!/^[a-z0-9]{12,32}$/.test(code)) return null;
  const { data } = await supabaseService()
    .from("referral_codes")
    .select("inviter_handle,used_at")
    .eq("code", code)
    .maybeSingle();
  if (!data) return null;
  return {
    inviterHandle: data.inviter_handle as string,
    used: data.used_at !== null,
  };
}

export async function listReferralsByInviter(
  inviterHandle: string
): Promise<ReferralCode[]> {
  if (!isSupabaseServiceConfigured()) return [];
  const { data, error } = await supabaseService()
    .from("referral_codes")
    .select("*")
    .eq("inviter_handle", inviterHandle)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as ReferralCode[];
}
