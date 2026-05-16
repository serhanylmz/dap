import { NextRequest } from "next/server";
import {
  generateReferralCode,
  listReferralsByInviter,
} from "@/lib/db/referrals";
import { getCardForUser, getReferralsRemaining, isAdmin } from "@/lib/db/cards";
import { createServerSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

async function requireMe() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "not signed in" as const, status: 401 };
  const me = await getCardForUser(user.email);
  if (!me) return { error: "no card for this email" as const, status: 403 };
  return { me, email: user.email };
}

export async function GET() {
  const r = await requireMe();
  if ("error" in r) {
    return Response.json({ error: r.error }, { status: r.status });
  }
  const admin = isAdmin(r.email);
  const [codes, remaining] = await Promise.all([
    listReferralsByInviter(r.me.handle),
    admin ? Promise.resolve(Number.POSITIVE_INFINITY) : getReferralsRemaining(r.me.handle),
  ]);
  return Response.json({
    handle: r.me.handle,
    admin,
    remaining,
    codes,
  });
}

export async function POST(_req: NextRequest) {
  const r = await requireMe();
  if ("error" in r) {
    return Response.json({ error: r.error }, { status: r.status });
  }
  const admin = isAdmin(r.email);
  const result = await generateReferralCode(r.me.handle, { unlimited: admin });
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }
  return Response.json({ ok: true, code: result.code });
}
