import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { IntroAuthed } from "@/components/intro-authed";
import { serhan } from "@/data/serhan";
import { getCardForUser, listAllPublicCards } from "@/lib/db/cards";
import { listInbox } from "@/lib/db/friends";
import { getSession } from "@/lib/session";
import { createServerSupabase } from "@/lib/supabase-server";
import type { Card } from "@/lib/types";

export const dynamic = "force-dynamic";

type RelationState =
  | "none"
  | "pending_outgoing"
  | "pending_incoming"
  | "accepted"
  | "rejected";

type Props = { searchParams: Promise<{ to?: string }> };

export default async function IntroPage({ searchParams }: Props) {
  const { to } = await searchParams;

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    const next = to ? `/intro?to=${encodeURIComponent(to)}` : "/intro";
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  const source = await getCardForUser(user.email);
  if (!source) {
    await supabase.auth.signOut();
    redirect("/login?error=no_card");
  }

  const myHandle = source.handle;
  const [all, inbox, session] = await Promise.all([
    listAllPublicCards(),
    listInbox(myHandle),
    getSession(),
  ]);

  const targets: Card[] = all.filter((c) => c.handle !== source.handle);

  const relations: Record<string, { state: RelationState; friendshipId?: string }> = {};
  for (const f of [...inbox.incoming, ...inbox.outgoing, ...inbox.accepted]) {
    const other = f.requester_handle === myHandle ? f.recipient_handle : f.requester_handle;
    let state: RelationState = "none";
    if (f.status === "accepted") state = "accepted";
    else if (f.status === "rejected") state = "rejected";
    else if (f.status === "pending") {
      state = f.requester_handle === myHandle ? "pending_outgoing" : "pending_incoming";
    }
    relations[other] = { state, friendshipId: f.id };
  }

  const initialTarget = to ? targets.find((t) => t.handle === to) : undefined;

  void serhan;

  return (
    <>
      <AppNav
        signedIn={session.signedIn}
        me={source}
        admin={session.admin}
        inboxCount={session.inboxCount}
      />
      <main className="max-w-5xl mx-auto px-5 sm:px-8 py-20 sm:py-24">
        <IntroAuthed
          source={source}
          targets={targets}
          userEmail={user.email}
          initialTargetHandle={initialTarget?.handle}
          relations={relations}
        />
      </main>
    </>
  );
}
