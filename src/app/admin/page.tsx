import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { AdminActions } from "@/components/admin-actions";
import { fileNumber } from "@/lib/file-number";
import { listPendingCards } from "@/lib/db/cards";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  if (!session.signedIn) redirect("/login?next=/admin");
  if (!session.admin) notFound();

  const pending = await listPendingCards();

  return (
    <>
      <AppNav
        signedIn={session.signedIn}
        me={session.me}
        admin={session.admin}
        inboxCount={session.inboxCount}
      />
      <main className="max-w-5xl mx-auto px-5 sm:px-8 py-20 sm:py-24">
        <div className="mb-16 flex items-end justify-between gap-6 flex-wrap">
          <h1 className="font-display text-7xl sm:text-8xl leading-[0.88] tracking-tight text-ink">
            review
            <br />
            <span className="font-display-italic text-accent">queue.</span>
          </h1>
          <span className="label text-mute pb-2">
            {pending.length} {pending.length === 1 ? "submission" : "submissions"}
          </span>
        </div>

        {pending.length === 0 ? (
          <p className="text-[15px] text-mute">no pending submissions.</p>
        ) : (
          <ul className="divide-y divide-ink/15">
            {pending.map((c) => (
              <li
                key={c.id}
                className="py-10 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-x-8 gap-y-3 items-start"
              >
                <div className="space-y-3 min-w-0">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="label text-faint">№ {fileNumber(c.handle)}</span>
                    <Link href={`/${c.handle}`} className="text-[16px] font-medium text-ink">
                      {c.name}
                    </Link>
                    <span className="label text-mute">@{c.handle}</span>
                  </div>
                  <p className="font-display-italic text-[16px] text-ink leading-snug">
                    {c.headline}
                  </p>
                  <Row label="building">{c.building}</Row>
                  <Row label="ask">{c.ask}</Row>
                  <Row label="offer">{c.offer}</Row>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 label text-soft pt-1">
                    <span>{c.email}</span>
                    <span>
                      {c.origin.city.toLowerCase()}, {c.origin.country.toLowerCase()}
                    </span>
                    <span>{c.eventTags.join(" · ").toLowerCase()}</span>
                  </div>
                </div>
                <AdminActions cardId={c.id} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[4.5rem_1fr] gap-x-3 items-start">
      <dt className="label text-mute pt-0.5">{label}</dt>
      <dd className="text-[13px] text-ink leading-relaxed">{children}</dd>
    </div>
  );
}
