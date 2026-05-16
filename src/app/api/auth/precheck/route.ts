import { NextRequest } from "next/server";
import { z } from "zod";
import { getCardForUser } from "@/lib/db/cards";

export const runtime = "nodejs";

const Input = z.object({ email: z.string().email().max(160) });

export async function POST(req: NextRequest) {
  let body: z.infer<typeof Input>;
  try {
    body = Input.parse(await req.json());
  } catch {
    return Response.json({ hasCard: false }, { status: 400 });
  }
  const card = await getCardForUser(body.email.toLowerCase().trim());
  return Response.json({ hasCard: !!card });
}
