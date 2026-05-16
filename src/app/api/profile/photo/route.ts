import { NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getCardForUser, upsertOwnCard } from "@/lib/db/cards";
import { supabaseService } from "@/lib/supabase";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

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

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "no file uploaded" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return Response.json(
      { error: "image must be jpeg, png, or webp" },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: "image must be under 5 MB" },
      { status: 400 }
    );
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const key = `${me.handle}-${Date.now()}.${ext}`;

  const supa = supabaseService();
  const arrayBuffer = await file.arrayBuffer();
  const { error: upErr } = await supa.storage
    .from("avatars")
    .upload(key, arrayBuffer, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: true,
    });

  if (upErr) {
    return Response.json({ error: upErr.message }, { status: 500 });
  }

  const { data: pub } = supa.storage.from("avatars").getPublicUrl(key);
  const photoUrl = pub.publicUrl;

  const upsert = await upsertOwnCard(user.email, me.handle, { photo_url: photoUrl });
  if (!upsert.ok) {
    return Response.json({ error: upsert.error }, { status: 500 });
  }

  return Response.json({ ok: true, photo_url: photoUrl, card: upsert.card });
}
