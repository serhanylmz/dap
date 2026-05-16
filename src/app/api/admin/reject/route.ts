import { NextRequest } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase-server";
import { deleteCard, isAdmin } from "@/lib/db/cards";

export const runtime = "nodejs";

const Input = z.object({ card_id: z.string().uuid() });

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return Response.json({ error: "not signed in" }, { status: 401 });
  }
  if (!isAdmin(user.email)) {
    return Response.json({ error: "not authorized" }, { status: 403 });
  }

  let body: z.infer<typeof Input>;
  try {
    body = Input.parse(await req.json());
  } catch {
    return Response.json({ error: "invalid input" }, { status: 400 });
  }

  const result = await deleteCard(body.card_id);
  if (!result.ok) {
    return Response.json({ error: result.error ?? "failed" }, { status: 500 });
  }
  return Response.json({ ok: true });
}
