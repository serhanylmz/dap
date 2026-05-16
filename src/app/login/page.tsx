import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { LoginForm } from "@/components/login-form";
import { getSession } from "@/lib/session";

type Props = { searchParams: Promise<{ error?: string; next?: string }> };

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: Props) {
  const [{ error, next }, session] = await Promise.all([
    searchParams,
    getSession(),
  ]);

  return (
    <>
      <AppNav
        signedIn={session.signedIn}
        me={session.me}
        admin={session.admin}
        inboxCount={session.inboxCount}
      />
      <main className="flex flex-col">
        <div className="flex-1 flex flex-col justify-center max-w-5xl w-full mx-auto px-5 sm:px-8 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-12 lg:gap-24 items-start">
            <section>
              <h1 className="font-display text-7xl sm:text-8xl lg:text-9xl leading-[0.85] tracking-tight text-ink">
                identify
                <br />
                <span className="font-display-italic text-accent">
                  yourself.
                </span>
              </h1>

              <p className="mt-8 text-[16px] text-mute leading-relaxed max-w-md">
                enter the email on your card. we transmit a one-tap sign-in
                link to your inbox. expires in an hour.
              </p>
              <p className="mt-3 text-[14px] text-soft max-w-md leading-relaxed">
                no card on file?{" "}
                <Link href="/join" className="underline">
                  drop one
                </Link>
                . unrecognized emails get routed to intake automatically.
              </p>
            </section>

            <aside className="border border-ink p-7 bg-paper-card">
              <LoginForm initialError={error} next={next} />
            </aside>
          </div>
        </div>

        <footer className="border-t border-ink/15 mt-auto">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-5 flex flex-wrap items-center justify-between gap-3 label text-soft">
            <span>magic-link auth · no passwords</span>
            <span>
              by signing in you appear in the directory at{" "}
              <Link href="/all" className="hover:text-ink">
                dap.cards/all
              </Link>
            </span>
          </div>
        </footer>
      </main>
    </>
  );
}
