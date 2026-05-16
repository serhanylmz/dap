import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { CardView } from "@/components/card-view";
import { ColdIntro } from "@/components/cold-intro";
import { serhan } from "@/data/serhan";
import { listAllPublicCards } from "@/lib/db/cards";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [session, allCards] = await Promise.all([
    getSession(),
    listAllPublicCards(),
  ]);
  const seedCard = session.me ?? serhan.card;

  const cities = new Set(allCards.map((c) => c.origin.city)).size;
  const events = new Set(allCards.flatMap((c) => c.eventTags)).size;

  const gridCards = allCards.slice(0, 6);

  return (
    <>
      <AppNav
        signedIn={session.signedIn}
        me={session.me}
        admin={session.admin}
        inboxCount={session.inboxCount}
      />

      <main className="max-w-6xl mx-auto px-5 sm:px-8">
        {/* HERO */}
        <section className="pt-24 sm:pt-32 pb-20 sm:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-12 lg:gap-20 items-end">
            <div>
              <h1 className="font-display text-[14vw] sm:text-[88px] lg:text-[120px] leading-[0.85] tracking-[-0.04em] text-ink">
                builders
                <br />
                <span className="font-display-wonk text-accent">on file.</span>
              </h1>
              <p className="mt-8 text-[17px] text-ink-soft leading-relaxed max-w-md">
                a pre-arrival network for builders heading to san francisco
                events. drop your card. browse the directory. draft a
                specific, grounded cold intro to anyone on it.
              </p>
            </div>

            <aside className="border-l border-rule sm:pl-10 lg:pl-12 self-stretch flex flex-col justify-end pb-4">
              <Stat label="cards on file" value={allCards.length.toString().padStart(3, "0")} />
              <Stat label="origin cities" value={cities.toString().padStart(2, "0")} />
              <Stat label="events covered" value={events.toString().padStart(2, "0")} />
            </aside>
          </div>
        </section>

        {/* COLD-INTRO BRIEFING */}
        <section className="py-20 border-t border-ink/15">
          <ColdIntro target={seedCard} availableTargets={allCards} />
        </section>

        {/* BUILDERS GRID */}
        <section className="py-20 border-t border-ink/15">
          <div className="flex items-baseline justify-between gap-4 mb-12">
            <h2 className="font-display text-4xl sm:text-5xl leading-[0.95] tracking-tight text-ink">
              builders on record.
            </h2>
            <Link href="/all" className="label hover:text-ink shrink-0">
              browse all {allCards.length} →
            </Link>
          </div>

          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-7 gap-y-14">
            {gridCards.map((c, i) => (
              <li key={c.handle}>
                <CardView card={c} variant="grid" index={i} />
              </li>
            ))}
          </ul>
        </section>

        {/* JOIN */}
        {!session.signedIn && (
          <section className="py-20 border-t border-ink/15">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-end">
              <div>
                <h2 className="font-display text-5xl sm:text-6xl leading-[0.95] tracking-tight text-ink max-w-lg">
                  drop your card.
                  <br />
                  <span className="font-display-italic text-accent">
                    takes two minutes.
                  </span>
                </h2>
                <p className="mt-5 text-[15px] text-mute max-w-md leading-relaxed">
                  with a referral link, instant access. without one, manual
                  review.
                </p>
              </div>
              <Link
                href="/join"
                className="label-strong px-6 py-3 border border-ink hover:bg-ink hover:text-paper transition-colors whitespace-nowrap"
              >
                file your card →
              </Link>
            </div>
          </section>
        )}

        {/* FOOTER */}
        <footer className="py-14 mt-8 border-t border-ink/15 grid grid-cols-2 sm:grid-cols-4 gap-6 text-[12px] text-mute leading-relaxed">
          <div>
            <span className="label-strong block mb-2 text-ink">dap.cards</span>
            <p>unofficial. opt-in.</p>
            <p>public-data only.</p>
          </div>
          <div>
            <span className="label block mb-2">curator</span>
            <p>
              <a
                href="https://serhanyilmaz.org/"
                target="_blank"
                rel="noopener noreferrer"
              >
                serhan yilmaz
              </a>
            </p>
          </div>
          <div>
            <span className="label block mb-2">browse</span>
            <p><Link href="/all">directory</Link></p>
            <p><Link href="/join">drop a card</Link></p>
          </div>
          <div>
            <span className="label block mb-2">status</span>
            <p className="text-accent">
              <span className="inline-block w-1.5 h-1.5 bg-accent mr-1 align-middle" />
              accepting submissions
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-rule last:border-b-0 py-3 flex items-baseline justify-between gap-4">
      <span className="label text-mute">{label}</span>
      <span className="font-mono text-2xl text-ink tracking-tight tabular-nums">
        {value}
      </span>
    </div>
  );
}
