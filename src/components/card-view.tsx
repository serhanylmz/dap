import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { fileNumber } from "@/lib/file-number";
import type { Card } from "@/lib/types";

type Variant = "full" | "compact" | "grid";

type Props = {
  card: Card;
  action?: React.ReactNode;
  variant?: Variant;
  index?: number;
};

export function CardView({ card, action, variant = "full", index }: Props) {
  if (variant === "compact") return <CompactRow card={card} action={action} index={index} />;
  if (variant === "grid") return <GridCard card={card} index={index} />;
  return <FullCard card={card} action={action} index={index} />;
}

function FullCard({ card, action }: { card: Card; action?: React.ReactNode; index?: number }) {
  const fn = fileNumber(card.handle);
  return (
    <article>
      <div className="flex items-baseline justify-between gap-4 border-b border-ink pb-3 mb-10">
        <span className="label-strong">№ {fn}</span>
        <span className="label text-mute">@{card.handle}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[13rem_1fr] gap-8 sm:gap-12">
        {/* Portrait + sidebar metadata */}
        <aside>
          <Avatar card={card} size="xl" />
          <dl className="mt-4 space-y-1.5">
            <MetaRow label="handle">@{card.handle}</MetaRow>
            <MetaRow label="origin">
              {card.origin.city.toLowerCase()}, {card.origin.country.toLowerCase()}
            </MetaRow>
            <MetaRow label="attending">
              {card.eventTags.map((t) => (
                <span key={t} className="block">
                  {t.toLowerCase()}
                </span>
              ))}
            </MetaRow>
          </dl>
          {action && <div className="mt-4">{action}</div>}
        </aside>

        {/* Main content column */}
        <div className="min-w-0 space-y-7">
          <header>
            <h2 className="font-display text-4xl sm:text-5xl leading-[0.95] tracking-tight text-ink">
              {card.name}
            </h2>
            <p className="mt-4 font-display-italic text-xl sm:text-2xl text-ink-soft leading-snug max-w-xl">
              {card.headline}
            </p>
          </header>

          <Section label="currently building">{card.building}</Section>
          <Section label="asking for">{card.ask}</Section>
          <Section label="offering">{card.offer}</Section>

          {card.artifacts.length > 0 && (
            <section>
              <SectionLabel>shipped — on file</SectionLabel>
              <ul className="mt-3 space-y-1.5">
                {card.artifacts.map((a, i) => (
                  <li
                    key={i}
                    className="grid grid-cols-[2rem_1fr] gap-3 text-[14px] text-ink leading-snug"
                  >
                    <span className="label text-faint pt-1">
                      ·{String(i + 1).padStart(2, "0")}
                    </span>
                    <span>
                      {a.url ? (
                        <a href={a.url} target="_blank" rel="noopener noreferrer">
                          {a.detail}
                        </a>
                      ) : (
                        a.detail
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {card.links.length > 0 && (
            <section>
              <SectionLabel>links</SectionLabel>
              <nav className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-mute">
                {card.links.map((l, i) => (
                  <a
                    key={i}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-ink"
                  >
                    {l.label} ↗
                  </a>
                ))}
              </nav>
            </section>
          )}
        </div>
      </div>
    </article>
  );
}

function CompactRow({ card, action, index }: { card: Card; action?: React.ReactNode; index?: number }) {
  const fn = fileNumber(card.handle);
  return (
    <article className="grid grid-cols-[auto_auto_1fr_auto] gap-4 sm:gap-5 items-center py-4 group">
      <span className="label text-faint w-12 shrink-0">№ {fn}</span>
      <Link href={`/${card.handle}`} className="shrink-0 hover:no-underline">
        <Avatar card={card} size="md" />
      </Link>
      <div className="min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <Link
            href={`/${card.handle}`}
            className="text-[15px] font-medium text-ink hover:no-underline group-hover:underline decoration-1 underline-offset-2"
          >
            {card.name}
          </Link>
          <span className="label text-mute">@{card.handle}</span>
        </div>
        <p className="mt-1 font-display-italic text-[15px] text-ink-soft leading-snug line-clamp-1 max-w-2xl">
          {card.headline}
        </p>
        <p className="mt-1.5 label text-soft">
          {card.origin.city.toLowerCase()} ·{" "}
          {card.eventTags.slice(0, 2).join(" · ").toLowerCase()}
        </p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
      {typeof index === "number" && <span className="hidden" />}
    </article>
  );
}

function GridCard({ card, index }: { card: Card; index?: number }) {
  const fn = fileNumber(card.handle);
  return (
    <Link
      href={`/${card.handle}`}
      className="block group hover:no-underline"
    >
      <article className="relative">
        <div className="flex items-baseline justify-between mb-2">
          <span className="label text-faint">№ {fn}</span>
          {typeof index === "number" && (
            <span className="label text-faint">
              {String(index + 1).padStart(3, "0")} / dossier
            </span>
          )}
        </div>
        <Avatar card={card} size="lg" className="w-full" />
        <div className="mt-3">
          <h3 className="text-[15px] font-medium text-ink leading-tight">
            {card.name}
          </h3>
          <p className="label text-mute mt-0.5">@{card.handle}</p>
          <p className="font-display-italic text-[14px] text-ink-soft leading-snug mt-2 line-clamp-2">
            {card.headline}
          </p>
          <p className="label text-soft mt-2">
            {card.origin.city.toLowerCase()}
          </p>
        </div>
      </article>
    </Link>
  );
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-rule-soft pt-1.5">
      <dt className="label text-mute">{label}</dt>
      <dd className="text-[12px] text-ink mt-0.5 font-mono leading-snug">
        {children}
      </dd>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <SectionLabel>{label}</SectionLabel>
      <p className="mt-2 text-[15px] text-ink leading-relaxed max-w-xl">
        {children}
      </p>
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rule-section">
      <span className="label">{children}</span>
    </div>
  );
}
