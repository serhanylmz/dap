"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import type { Card } from "@/lib/types";

type Props = {
  signedIn: boolean;
  me: Card | null;
  admin: boolean;
  inboxCount: number;
};

const SIGNED_OUT = [
  { href: "/all", label: "directory" },
  { href: "/join", label: "join" },
  { href: "/login", label: "sign in" },
];

const SIGNED_IN_BASE = [
  { href: "/all", label: "directory" },
  { href: "/intro", label: "briefing" },
  { href: "/inbox", label: "inbox" },
  { href: "/referrals", label: "referrals" },
  { href: "/profile", label: "profile" },
];

export function AppNav({ signedIn, me, admin, inboxCount }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  async function signOut() {
    const supa = createBrowserSupabase();
    await supa.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const items = signedIn
    ? admin
      ? [...SIGNED_IN_BASE, { href: "/admin", label: "admin" }]
      : SIGNED_IN_BASE
    : SIGNED_OUT;

  return (
    <header className="border-b border-ink/15 bg-paper/95 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between gap-6">
        <Link href="/" className="hover:no-underline shrink-0">
          <span className="label-strong">dap.cards</span>
        </Link>

        <nav className="flex items-center gap-1 overflow-x-auto -mx-2 px-2">
          {items.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const showCount = item.href === "/inbox" && inboxCount > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`label px-2 py-1 hover:text-ink whitespace-nowrap transition-colors ${
                  active ? "text-ink" : ""
                }`}
              >
                {item.label}
                {showCount && (
                  <span className="ml-1.5 inline-block bg-accent text-paper px-1 leading-[1.5] rounded-[1px]">
                    {inboxCount}
                  </span>
                )}
              </Link>
            );
          })}
          {signedIn && (
            <button
              onClick={signOut}
              className="label px-2 py-1 hover:text-classified whitespace-nowrap transition-colors"
            >
              logout
            </button>
          )}
        </nav>

        {signedIn && me ? (
          <Link
            href="/profile"
            className="shrink-0 hover:no-underline"
            aria-label="your profile"
          >
            <Avatar card={me} size="xs" />
          </Link>
        ) : (
          <span className="w-7 shrink-0" aria-hidden />
        )}
      </div>
    </header>
  );
}
