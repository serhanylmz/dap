import { AppNav } from "@/components/app-nav";
import { CardView } from "@/components/card-view";
import { ColdIntro } from "@/components/cold-intro";
import { IntroButton } from "@/components/intro-button";
import { serhan } from "@/data/serhan";
import { getVerifiedCard } from "@/lib/db/cards";
import { getSession } from "@/lib/session";
import { notFound } from "next/navigation";
import Link from "next/link";

const RESERVED = new Set([
  "all", "join", "api", "auth", "intro", "inbox",
  "login", "profile", "admin", "referrals", "_next", "favicon.ico",
]);

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ handle: string }> };

export default async function CardPage({ params }: Props) {
  const { handle } = await params;
  if (RESERVED.has(handle)) notFound();

  const [session, dbCard] = await Promise.all([
    getSession(),
    getVerifiedCard(handle),
  ]);
  const card = dbCard ?? (handle === "serhan" ? serhan.card : null);
  if (!card) notFound();

  const myHandle = session.me?.handle ?? null;

  return (
    <>
      <AppNav
        signedIn={session.signedIn}
        me={session.me}
        admin={session.admin}
        inboxCount={session.inboxCount}
      />

      <main className="max-w-5xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
        <div className="mb-10">
          <Link href="/all" className="label hover:text-ink">
            ← directory
          </Link>
        </div>

        <CardView
          card={card}
          action={
            <IntroButton
              handle={card.handle}
              signedIn={session.signedIn}
              isSelf={card.handle === myHandle}
            />
          }
        />

        <section className="mt-24 pt-16 border-t border-ink/15">
          <ColdIntro target={card} />
        </section>
      </main>
    </>
  );
}
