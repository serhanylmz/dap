import { NextRequest } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase-server";
import { getCardForUser } from "@/lib/db/cards";
import { createFriendRequest } from "@/lib/db/friends";

export const runtime = "nodejs";

const InputSchema = z.object({
  recipient: z.string().regex(/^[a-z0-9-]{2,32}$/),
});

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return Response.json({ error: "not signed in" }, { status: 401 });
  }

  const me = await getCardForUser(user.email);
  if (!me) {
    return Response.json({ error: "no card for this email" }, { status: 403 });
  }

  let body: z.infer<typeof InputSchema>;
  try {
    body = InputSchema.parse(await req.json());
  } catch {
    return Response.json({ error: "invalid input" }, { status: 400 });
  }

  const result = await createFriendRequest(me.handle, body.recipient);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }
  return Response.json({ ok: true, status: result.status });
}
