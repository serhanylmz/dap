import { AppNav } from "@/components/app-nav";
import { JoinForm } from "@/components/join-form";
import { getCardByHandleForDisplay } from "@/lib/db/cards";
import { lookupReferralCode } from "@/lib/db/referrals";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ ref?: string; from?: string }> };

export default async function JoinPage({ searchParams }: Props) {
  const [{ ref, from }, session] = await Promise.all([
    searchParams,
    getSession(),
  ]);

  let referral: { code: string; inviterName: string; used: boolean } | null = null;
  if (ref) {
    const lookup = await lookupReferralCode(ref);
    if (lookup) {
      const inviter = await getCardByHandleForDisplay(lookup.inviterHandle);
      referral = {
        code: ref,
        inviterName: inviter?.name ?? lookup.inviterHandle,
        used: lookup.used,
      };
    }
  }

  const valid = referral && !referral.used;

  return (
    <>
      <AppNav
        signedIn={session.signedIn}
        me={session.me}
        admin={session.admin}
        inboxCount={session.inboxCount}
      />
      <main className="max-w-4xl mx-auto px-5 sm:px-8 py-20 sm:py-24">
        <div className="mb-16 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-12 items-end">
          <div>
            <h1 className="font-display text-7xl sm:text-8xl leading-[0.88] tracking-tight text-ink">
              file your
              <br />
              <span className="font-display-italic text-accent">card.</span>
            </h1>
            <p className="mt-6 text-[16px] text-mute leading-relaxed max-w-md">
              takes two minutes. set your handle, write your headline, pick
              the events you&apos;re heading to.
            </p>
          </div>

          <aside className="border border-ink/40 p-5 bg-paper-card">
            {valid && referral && (
              <>
                <span className="badge-amber">referral · instant access</span>
                <p className="text-[14px] text-ink mt-3 leading-relaxed">
                  invited by{" "}
                  <span className="font-medium font-display-italic">
                    {referral.inviterName}
                  </span>
                  . you skip manual review.
                </p>
              </>
            )}
            {referral && referral.used && (
              <>
                <span className="stamp text-classified">link expended</span>
                <p className="text-[13px] text-mute mt-3 leading-relaxed">
                  already used. you can still submit — your card goes into
                  manual review.
                </p>
              </>
            )}
            {!referral && (
              <>
                <span className="stamp text-mute">manual review queue</span>
                <p className="text-[13px] text-mute mt-3 leading-relaxed">
                  no referral link — your card lands in review. ask a friend
                  on dap for one. every member has 10.
                </p>
              </>
            )}
            {from && (
              <p className="mt-3 text-[12px] text-soft leading-relaxed">
                we didn&apos;t recognize{" "}
                <span className="font-mono">{from}</span>. drop a card and
                you can sign in next time.
              </p>
            )}
          </aside>
        </div>

        <JoinForm
          referralCode={valid ? (referral?.code ?? null) : null}
          referralInviterName={valid ? referral?.inviterName : undefined}
          prefilledEmail={from}
        />
      </main>
    </>
  );
}
