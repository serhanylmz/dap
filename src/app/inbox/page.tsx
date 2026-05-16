import Link from "next/link";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { Avatar } from "@/components/avatar";
import { InboxActions } from "@/components/inbox-actions";
import { fileNumber } from "@/lib/file-number";
import { listAllPublicCards } from "@/lib/db/cards";
import { listInbox, type Friendship } from "@/lib/db/friends";
import { getSession } from "@/lib/session";
import type { Card } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const session = await getSession();
  if (!session.signedIn) redirect("/login?next=/inbox");
  if (!session.me) redirect("/login?error=no_card");

  const myHandle = session.me.handle;
  const [inbox, allCards] = await Promise.all([
    listInbox(myHandle),
    listAllPublicCards(),
  ]);

  const byHandle = new Map<string, Card>();
  for (const c of allCards) byHandle.set(c.handle, c);

  function otherParty(f: Friendship): Card | null {
    const handle = f.requester_handle === myHandle ? f.recipient_handle : f.requester_handle;
    return byHandle.get(handle) ?? null;
  }

  return (
    <>
      <AppNav
        signedIn={session.signedIn}
        me={session.me}
        admin={session.admin}
        inboxCount={session.inboxCount}
      />
      <main className="max-w-5xl mx-auto px-5 sm:px-8 py-20 sm:py-24">
        <header className="mb-16">
          <h1 className="font-display text-7xl sm:text-8xl leading-[0.88] tracking-tight text-ink">
            your
            <br />
            <span className="font-display-italic text-accent">transmissions.</span>
          </h1>
        </header>

        <div className="space-y-20">
          <Section
            label="incoming"
            count={inbox.incoming.length}
            accent={inbox.incoming.length > 0}
            empty="no incoming requests."
          >
            {inbox.incoming.map((f) => {
              const other = otherParty(f);
              if (!other) return null;
              return (
                <Row key={f.id} card={other}>
                  <InboxActions friendshipId={f.id} />
                </Row>
              );
            })}
          </Section>

          <Section
            label="outgoing · awaiting reply"
            count={inbox.outgoing.length}
            empty="no outgoing requests."
          >
            {inbox.outgoing.map((f) => {
              const other = otherParty(f);
              if (!other) return null;
              return (
                <Row key={f.id} card={other}>
                  <span className="label text-soft">awaiting reply</span>
                </Row>
              );
            })}
          </Section>

          <Section
            label="confirmed contacts"
            count={inbox.accepted.length}
            empty="no contacts yet — request someone from the directory."
          >
            {inbox.accepted.map((f) => {
              const other = otherParty(f);
              if (!other) return null;
              return (
                <Row key={f.id} card={other}>
                  <Link
                    href={`/intro?to=${other.handle}`}
                    className="label-strong px-3 py-1.5 border border-ink/40 hover:border-ink hover:bg-ink hover:text-paper transition-colors"
                  >
                    brief →
                  </Link>
                </Row>
              );
            })}
          </Section>
        </div>
      </main>
    </>
  );
}

function Section({
  label,
  count,
  empty,
  accent,
  children,
}: {
  label: string;
  count: number;
  empty: string;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between border-b border-ink/30 pb-3 mb-2">
        <h2 className={`label-strong ${accent ? "text-accent" : ""}`}>{label}</h2>
        <span className="label text-mute tabular-nums">{count}</span>
      </div>
      {count === 0 ? (
        <p className="mt-8 text-[14px] text-soft">{empty}</p>
      ) : (
        <ul className="divide-y divide-rule-soft">{children}</ul>
      )}
    </section>
  );
}

function Row({ card, children }: { card: Card; children: React.ReactNode }) {
  return (
    <li className="py-6 grid grid-cols-[auto_auto_1fr_auto] items-center gap-4">
      <span className="label text-faint w-12">№ {fileNumber(card.handle)}</span>
      <Link href={`/${card.handle}`} className="hover:no-underline">
        <Avatar card={card} size="sm" />
      </Link>
      <div className="min-w-0">
        <Link
          href={`/${card.handle}`}
          className="text-[15px] font-medium text-ink hover:no-underline hover:underline decoration-1 underline-offset-2"
        >
          {card.name}
        </Link>{" "}
        <span className="label text-mute">@{card.handle}</span>
        <p className="font-display-italic text-[14px] text-ink-soft leading-snug mt-1 line-clamp-1 max-w-md">
          {card.headline}
        </p>
        <p className="label text-soft mt-1.5">{card.origin.city.toLowerCase()}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </li>
  );
}
