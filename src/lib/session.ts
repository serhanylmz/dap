import { createServerSupabase } from "@/lib/supabase-server";
import { getCardForUser, isAdmin } from "@/lib/db/cards";
import { listInbox } from "@/lib/db/friends";
import type { Card } from "@/lib/types";

export type SessionInfo = {
  signedIn: boolean;
  me: Card | null;
  email: string | null;
  admin: boolean;
  inboxCount: number;
};

export async function getSession(): Promise<SessionInfo> {
  const supa = await createServerSupabase();
  const {
    data: { user },
  } = await supa.auth.getUser();

  if (!user?.email) {
    return { signedIn: false, me: null, email: null, admin: false, inboxCount: 0 };
  }

  const email = user.email;
  const me = await getCardForUser(email);
  const admin = isAdmin(email);

  let inboxCount = 0;
  if (me) {
    const inbox = await listInbox(me.handle);
    inboxCount = inbox.incoming.length;
  }

  return { signedIn: true, me, email, admin, inboxCount };
}
