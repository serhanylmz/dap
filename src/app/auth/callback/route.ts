import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getCardForUser } from "@/lib/db/cards";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/intro";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=invalid_link`);
  }

  const supabase = await createServerSupabase();
  const { error, data } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user?.email) {
    return NextResponse.redirect(`${origin}/login?error=invalid_link`);
  }

  // Gate: must have an approved card. If not, sign out + bounce.
  const card = await getCardForUser(data.user.email);
  if (!card) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=no_card`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
