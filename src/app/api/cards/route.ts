import { NextRequest } from "next/server";
import { z } from "zod";
import {
  isSupabaseServiceConfigured,
  supabaseService,
} from "@/lib/supabase";
import { consumeReferralCode } from "@/lib/db/referrals";

export const runtime = "nodejs";

const CardSubmission = z.object({
  handle: z
    .string()
    .regex(/^[a-z0-9-]{2,32}$/, "lowercase letters, digits, hyphens; 2-32 chars"),
  name: z.string().min(1).max(80),
  headline: z.string().min(1).max(200),
  building: z.string().min(1).max(280),
  ask: z.string().min(1).max(400),
  offer: z.string().min(1).max(400),
  eventTags: z.array(z.string().min(1).max(40)).min(1).max(4),
  origin: z.object({
    city: z.string().min(1).max(60),
    country: z.string().min(1).max(60),
  }),
  links: z
    .array(z.object({ label: z.string().min(1).max(40), href: z.string().url() }))
    .max(8),
  email: z.string().email().max(160),
  ref: z.string().regex(/^[a-z0-9]{12,32}$/).optional(),
});

const RESERVED = new Set([
  "all",
  "api",
  "admin",
  "auth",
  "inbox",
  "intro",
  "join",
  "login",
  "referrals",
  "dap",
  "serhan",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

export async function POST(req: NextRequest) {
  if (!isSupabaseServiceConfigured()) {
    return Response.json(
      { error: "signup is temporarily off — supabase service key isn't configured." },
      { status: 503 }
    );
  }

  let body: z.infer<typeof CardSubmission>;
  try {
    body = CardSubmission.parse(await req.json());
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

  const handle = body.handle.toLowerCase().trim();
  if (RESERVED.has(handle)) {
    return Response.json({ error: "that handle is reserved." }, { status: 400 });
  }

  const email = body.email.toLowerCase().trim();
  const supa = supabaseService();

  // Validate + consume referral code (atomic). Determines verified status.
  let autoVerified = false;
  if (body.ref) {
    const ref = await consumeReferralCode(body.ref, handle);
    if (!ref.ok) {
      return Response.json({ error: ref.error }, { status: 400 });
    }
    autoVerified = true;
  }

  const { error: insertErr } = await supa.from("cards").insert({
    handle,
    name: body.name,
    headline: body.headline,
    building: body.building,
    ask: body.ask,
    offer: body.offer,
    event_tags: body.eventTags,
    origin_city: body.origin.city,
    origin_country: body.origin.country,
    links: body.links,
    artifacts: [],
    email,
    verified: autoVerified,
  });

  if (insertErr) {
    if (insertErr.code === "23505") {
      return Response.json({ error: "that handle is taken." }, { status: 409 });
    }
    console.error("insert card:", insertErr);
    return Response.json(
      { error: "couldn't save your card. try again in a moment?" },
      { status: 500 }
    );
  }

  return Response.json({ ok: true, verified: autoVerified, email });
}
