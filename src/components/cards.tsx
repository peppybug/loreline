import Link from "next/link";
import { initials, type EventCardData } from "@/lib/site";

/** A picture if the page has one, otherwise a monogram tile in the faction's (or the site's) colour. */
export function Crest({ name, image, alt = "", color, className = "h-14 w-14 text-xl", rounded = false }: { name: string; image?: string | null; alt?: string; color?: string | null; className?: string; rounded?: boolean }) {
  const shape = rounded ? "rounded-full" : "rounded-xs";
  if (image) return <img src={image} alt={alt} className={`${className} ${shape} shrink-0 object-cover`} loading="lazy" />;
  const c = color ?? "var(--thread)";
  return (
    <span
      aria-hidden="true"
      className={`${className} ${shape} flex shrink-0 items-center justify-center font-display font-semibold`}
      style={{ background: `color-mix(in srgb, ${c} 14%, var(--surface))`, color: `color-mix(in srgb, ${c} 80%, var(--ink))`, boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${c} 30%, transparent)` }}
    >
      {initials(name)}
    </span>
  );
}

export function EventCard({ e, compact = false }: { e: EventCardData; compact?: boolean }) {
  return (
    <Link href={`/event/${e.slug}/`} className="card-link group flex h-full flex-col overflow-hidden rounded-sm border border-line bg-surface">
      {e.image && !compact ? <img src={e.image} alt="" className="aspect-[16/9] w-full object-cover" loading="lazy" /> : null}
      <span className="flex flex-1 flex-col p-4">
        <span className="text-xs text-muted tabular">{e.years} · {e.regionName}</span>
        <span className="card-title mt-1 font-display text-[1.4rem] font-semibold leading-tight">{e.title}</span>
        {!compact ? <span className="mt-2 line-clamp-3 text-sm text-ink-2">{e.summary}</span> : null}
        <span className="mt-auto pt-3 text-xs font-medium text-muted">{e.categoryName}</span>
      </span>
    </Link>
  );
}

export function EntityCard({ href, name, detail, image, color, rounded }: { href: string; name: string; detail?: string; image?: string | null; color?: string | null; rounded?: boolean }) {
  return (
    <Link href={href} className="card-link group flex items-center gap-3 rounded-sm border border-line bg-surface p-3">
      <Crest name={name} image={image} color={color} rounded={rounded} className="h-12 w-12 text-lg" />
      <span className="min-w-0">
        <span className="card-title block font-display text-lg font-semibold leading-tight">{name}</span>
        {detail ? <span className="block truncate text-xs text-muted">{detail}</span> : null}
      </span>
    </Link>
  );
}

export function Section({ id, title, children, action }: { id?: string; title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-h` : undefined} className="mt-16">
      <div className="flex items-end justify-between gap-4 border-b border-line pb-2">
        <h2 id={id ? `${id}-h` : undefined} className="text-xl">{title}</h2>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function RelationLegend({ className = "" }: { className?: string }) {
  return (
    <dl className={`grid gap-2.5 text-sm ${className}`}>
      <div className="flex items-start gap-3">
        <dt className="mt-2.5 shrink-0"><svg width="40" height="6" aria-hidden="true"><line x1="0" y1="3" x2="40" y2="3" stroke="var(--thread)" strokeWidth="2.5" /></svg><span className="sr-only">Solid line</span></dt>
        <dd><strong className="font-semibold">Led to.</strong> A direct cause.</dd>
      </div>
      <div className="flex items-start gap-3">
        <dt className="mt-2.5 shrink-0"><svg width="40" height="6" aria-hidden="true"><line x1="0" y1="3" x2="40" y2="3" stroke="var(--thread)" strokeWidth="2" strokeDasharray="7 4" /></svg><span className="sr-only">Dashed line</span></dt>
        <dd><strong className="font-semibold">Contributed to.</strong> One cause among several.</dd>
      </div>
      <div className="flex items-start gap-3">
        <dt className="mt-2.5 shrink-0"><svg width="40" height="6" aria-hidden="true"><line x1="0" y1="3" x2="40" y2="3" stroke="var(--line-strong)" strokeWidth="2" strokeDasharray="2 4" strokeLinecap="round" /></svg><span className="sr-only">Dotted line</span></dt>
        <dd><strong className="font-semibold">Followed by.</strong> Came next, without causing it.</dd>
      </div>
    </dl>
  );
}
