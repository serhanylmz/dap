import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { ProfileEditor } from "@/components/profile-editor";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session.signedIn) redirect("/login?next=/profile");
  if (!session.me) redirect("/login?error=no_card");

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
            edit your
            <br />
            <span className="font-display-italic text-accent">file.</span>
          </h1>
          <p className="mt-6 text-[15px] text-mute max-w-md leading-relaxed">
            changes go live at{" "}
            <span className="font-mono text-[14px]">
              dap.cards/{session.me.handle}
            </span>{" "}
            the moment you save.
          </p>
        </div>

        <ProfileEditor initial={session.me} />
      </main>
    </>
  );
}
