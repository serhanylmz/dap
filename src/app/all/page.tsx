import { AppNav } from "@/components/app-nav";
import { CardView } from "@/components/card-view";
import { IntroButton } from "@/components/intro-button";
import { listAllPublicCards } from "@/lib/db/cards";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DirectoryPage() {
  const [session, all] = await Promise.all([
    getSession(),
    listAllPublicCards(),
  ]);
  const myHandle = session.me?.handle ?? null;

  const cities = new Set(all.map((c) => c.origin.city)).size;
  const events = new Set(all.flatMap((c) => c.eventTags)).size;

  return (
    <>
      <AppNav
        signedIn={session.signedIn}
        me={session.me}
        admin={session.admin}
        inboxCount={session.inboxCount}
      />
      <main className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-24">
        <header className="mb-16">
          <h1 className="font-display text-7xl sm:text-8xl leading-[0.88] tracking-tight text-ink">
            the registry.
          </h1>

          <dl className="mt-10 grid grid-cols-3 lg:grid-cols-4 gap-x-10 gap-y-2 border-t border-ink/30 pt-5">
            <Stat label="cards" value={all.length.toString().padStart(3, "0")} />
            <Stat label="cities" value={cities.toString().padStart(2, "0")} />
            <Stat label="events" value={events.toString().padStart(2, "0")} />
            <Stat label="status" value="OPEN" accent />
          </dl>
        </header>

        <ul className="divide-y divide-rule-soft border-y border-rule-soft">
          {all.map((c, i) => (
            <li
              key={c.handle}
              className="px-1 sm:px-2 -mx-1 sm:-mx-2 hover:bg-paper-card transition-colors"
            >
              <CardView
                card={c}
                variant="compact"
                index={i}
                action={
                  <IntroButton
                    handle={c.handle}
                    signedIn={session.signedIn}
                    isSelf={c.handle === myHandle}
                  />
                }
              />
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <dt className="label text-mute">{label}</dt>
      <dd
        className={`font-mono text-2xl ${accent ? "text-accent" : "text-ink"} tabular-nums mt-1`}
      >
        {value}
      </dd>
    </div>
  );
}
