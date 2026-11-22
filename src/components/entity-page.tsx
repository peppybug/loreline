import Link from "next/link";
import type { EventCardData } from "@/lib/site";
import { Crest, Section } from "./cards";

/** Shared layout for people, places, factions, eras and regions. */
export function EntityPage({
  eyebrow,
  name,
  detail,
  image,
  imageAlt,
  color,
  rounded,
  html,
  aside,
  events,
  eventsTitle = "Appears in",
  children,
}: {
  eyebrow: string;
  name: string;
  detail?: string;
  image?: string | null;
  imageAlt?: string;
  color?: string | null;
  rounded?: boolean;
  html?: string;
  aside?: React.ReactNode;
  events: EventCardData[];
  eventsTitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <article className="container-page pt-10">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <Crest name={name} image={image} alt={imageAlt} color={color} rounded={rounded} className="h-24 w-24 text-4xl" />
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-1 text-[2.6rem] leading-[1.03] sm:text-3xl">{name}</h1>
          {detail ? <p className="mt-2 font-serif text-xl text-ink-2">{detail}</p> : null}
        </div>
      </header>
      <div className={`mt-10 grid gap-10 ${aside ? "lg:grid-cols-[minmax(0,1fr)_320px]" : ""}`}>
        {html ? <div className="prose-lore" dangerouslySetInnerHTML={{ __html: html }} /> : <div />}
        {aside ? <aside className="grid content-start gap-5">{aside}</aside> : null}
      </div>
      {children}
      {events.length ? (
        <Section id="events" title={`${eventsTitle} · ${events.length}`}>
          <ol className="border-l-2 border-line pl-6">
            {events.map((e) => (
              <li key={e.slug} className="relative pb-6 last:pb-0">
                <span aria-hidden="true" className="absolute -left-[31px] top-2 h-3 w-3 rounded-full border-2 border-paper bg-thread" />
                <Link href={`/event/${e.slug}/`} className="group block max-w-3xl">
                  <span className="text-xs text-muted tabular">{e.when} · {e.regionName}</span>
                  <span className="block font-display text-xl font-semibold leading-snug group-hover:underline group-hover:decoration-thread group-hover:decoration-1 group-hover:underline-offset-4">{e.title}</span>
                  <span className="mt-1 block text-sm text-ink-2">{e.summary}</span>
                </Link>
              </li>
            ))}
          </ol>
        </Section>
      ) : null}
    </article>
  );
}
