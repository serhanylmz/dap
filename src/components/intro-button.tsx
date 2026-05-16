import Link from "next/link";

type Props = {
  handle: string;
  signedIn: boolean;
  isSelf: boolean;
};

export function IntroButton({ handle, signedIn, isSelf }: Props) {
  if (isSelf) return null;
  const target = `/intro?to=${encodeURIComponent(handle)}`;
  const href = signedIn ? target : `/login?next=${encodeURIComponent(target)}`;
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-ink/40 hover:border-ink hover:bg-ink hover:text-paper font-mono text-[10px] uppercase tracking-[0.18em] transition-colors whitespace-nowrap"
    >
      brief
      <span aria-hidden>→</span>
    </Link>
  );
}
