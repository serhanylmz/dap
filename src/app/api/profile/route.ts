import { NextRequest } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase-server";
import { getCardForUser, upsertOwnCard } from "@/lib/db/cards";

export const runtime = "nodejs";

const PatchSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  headline: z.string().min(1).max(200).optional(),
  building: z.string().min(1).max(280).optional(),
  ask: z.string().min(1).max(400).optional(),
  offer: z.string().min(1).max(400).optional(),
  event_tags: z.array(z.string().min(1).max(40)).min(1).max(4).optional(),
  origin_city: z.string().min(1).max(60).optional(),
  origin_country: z.string().min(1).max(60).optional(),
  links: z
    .array(z.object({ label: z.string().min(1).max(40), href: z.string().url() }))
    .max(8)
    .optional(),
});

export async function PATCH(req: NextRequest) {
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

  let body: z.infer<typeof PatchSchema>;
  try {
    body = PatchSchema.parse(await req.json());
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof z.ZodError
            ? e.issues.map((i) => i.message).join("; ")
            : "invalid input",
      },
      { status: 400 }
    );
  }

  const result = await upsertOwnCard(user.email, me.handle, body);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }
  return Response.json({ ok: true, card: result.card });
}
