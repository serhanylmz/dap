import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { ReferralsPanel } from "@/components/referrals-panel";
import { getReferralsRemaining } from "@/lib/db/cards";
import { listReferralsByInviter } from "@/lib/db/referrals";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ReferralsPage() {
  const session = await getSession();
  if (!session.signedIn) redirect("/login?next=/referrals");
  if (!session.me) redirect("/login?error=no_card");

  const [remaining, codes] = await Promise.all([
    session.admin ? Promise.resolve(0) : getReferralsRemaining(session.me.handle),
    listReferralsByInviter(session.me.handle),
  ]);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://dap.cards";

  return (
    <>
      <AppNav
        signedIn={session.signedIn}
        me={session.me}
        admin={session.admin}
        inboxCount={session.inboxCount}
      />
      <main className="max-w-5xl mx-auto px-5 sm:px-8 py-20 sm:py-24">
        <div className="mb-16">
          <h1 className="font-display text-7xl sm:text-8xl leading-[0.88] tracking-tight text-ink">
            sponsor an
            <br />
            <span className="font-display-italic text-accent">applicant.</span>
          </h1>
          <p className="mt-6 text-[16px] text-mute leading-relaxed max-w-md">
            each link is one-time. recipients skip manual review.
          </p>
        </div>

        <ReferralsPanel
          initialRemaining={remaining}
          initialCodes={codes}
          unlimited={session.admin}
          baseUrl={baseUrl}
        />
      </main>
    </>
  );
}
