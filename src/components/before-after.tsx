import Link from "next/link";
import type { EventCardData } from "@/lib/site";

type Rel = { e: EventCardData; note: string | null };

const LINE = {
  solid: <line x1="0" y1="4" x2="28" y2="4" stroke="var(--thread)" strokeWidth="2.5" />,
  dashed: <line x1="0" y1="4" x2="28" y2="4" stroke="var(--thread)" strokeWidth="2" strokeDasharray="6 4" />,
  dotted: <line x1="0" y1="4" x2="28" y2="4" stroke="var(--line-strong)" strokeWidth="2" strokeDasharray="1.5 4" strokeLinecap="round" />,
};

function Group({ title, style, items }: { title: string; style: keyof typeof LINE; items: Rel[] }) {
  if (!items.length) return null;
  return (
    <div>
      <h3 className="flex items-center gap-2 font-sans text-sm font-semibold">
        <svg width="28" height="8" aria-hidden="true">{LINE[style]}</svg>
        {title}
      </h3>
      <ul className="mt-2 grid gap-2">
        {items.map(({ e, note }) => (
          <li key={e.slug}>
            <Link href={`/event/${e.slug}/`} className="card-link group block rounded-sm border border-line bg-surface p-3">
              <span className="block text-xs text-muted tabular">{e.years}</span>
              <span className="card-title block font-display text-lg font-semibold leading-snug">{e.title}</span>
              {note ? <span className="mt-1 block text-xs text-ink-2">{note}</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const Arrow = () => (
  <svg viewBox="0 0 24 24" className="mx-auto h-6 w-6 rotate-90 text-thread lg:mt-24 lg:rotate-0" aria-hidden="true">
    <path d="M4 12h15m-5-5 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function BeforeAfter({ current, before, after }: { current: EventCardData; before: { causedBy: Rel[]; contributing: Rel[]; precededBy: Rel[] }; after: { ledTo: Rel[]; contributedTo: Rel[]; followedBy: Rel[] } }) {
  const hasBefore = before.causedBy.length + before.contributing.length + before.precededBy.length > 0;
  const hasAfter = after.ledTo.length + after.contributedTo.length + after.followedBy.length > 0;
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_auto_minmax(0,0.8fr)_auto_1fr] lg:gap-4">
      <div className="grid gap-5">
        <p className="eyebrow">What came before</p>
        {hasBefore ? (
          <>
            <Group title="Caused by" style="solid" items={before.causedBy} />
            <Group title="Contributing causes" style="dashed" items={before.contributing} />
            <Group title="Preceded by" style="dotted" items={before.precededBy} />
          </>
        ) : (
          <p className="text-sm text-ink-2">Nothing earlier is linked to this event yet.</p>
        )}
      </div>
      <Arrow />
      <div className="rounded-sm border-2 border-ink bg-surface p-4 lg:mt-14">
        <p className="text-xs text-muted tabular">{current.years}</p>
        <p className="mt-0.5 font-display text-xl font-semibold leading-snug">{current.title}</p>
        {current.location ? <p className="mt-2 text-xs text-ink-2">{current.location}</p> : null}
      </div>
      <Arrow />
      <div className="grid gap-5">
        <p className="eyebrow">What happened next</p>
        {hasAfter ? (
          <>
            <Group title="Led to" style="solid" items={after.ledTo} />
            <Group title="Contributed to" style="dashed" items={after.contributedTo} />
            <Group title="Followed by" style="dotted" items={after.followedBy} />
          </>
        ) : (
          <p className="text-sm text-ink-2">Nothing later is linked to this event yet.</p>
        )}
      </div>
    </div>
  );
}
