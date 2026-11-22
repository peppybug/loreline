import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BeforeAfter } from "@/components/before-after";
import { EventCard, Section } from "@/components/cards";
import { Aside, Facts, LinkList } from "@/components/fact-list";
import { MapView } from "@/components/map-view";
import { eventCard } from "@/lib/site";
import { assetUrl, categoryName, eraOf, loadWorld, meanwhile, regionName, relationsOf } from "@/lib/world";

export const dynamicParams = false;
export const generateStaticParams = () => loadWorld().events.map((e) => ({ slug: e.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const e = loadWorld().event.get((await params).slug);
  return e ? { title: e.name, description: e.summary } : {};
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const w = loadWorld();
  const e = w.event.get((await params).slug);
  if (!e) notFound();
  const card = eventCard(w, e);
  const rel = relationsOf(w, e.slug);
  const toCards = (list: { event: typeof e; note: string | null }[]) => list.map((r) => ({ e: eventCard(w, r.event), note: r.note }));
  const era = eraOf(w, e.era);
  const idx = w.events.indexOf(e);
  const [prev, next] = [w.events[idx - 1], w.events[idx + 1]];
  const others = meanwhile(w, e);
  const mapped = e.places.map((p) => w.place.get(p)!).filter((p) => p.map);

  return (
    <article className="container-page pt-10">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex flex-wrap gap-x-2">
          <li><Link className="hover:text-ink" href="/timeline/">Timeline</Link></li>
          {era ? <li>/ <Link className="hover:text-ink" href={`/era/${era.slug}/`}>{era.name}</Link></li> : null}
          <li>/ <Link className="hover:text-ink" href={`/region/${e.region}/`}>{regionName(w, e.region)}</Link></li>
        </ol>
      </nav>
      <header className="mt-5 max-w-4xl">
        <p className="text-sm font-medium text-thread tabular">{card.when}</p>
        <h1 className="mt-2 text-[2.6rem] leading-[1.03] sm:text-3xl">{e.name}</h1>
        <p className="mt-5 font-serif text-xl leading-relaxed text-ink-2">{e.summary}</p>
      </header>

      {e.image ? (
        <figure className="mt-8">
          <img src={e.image} alt={e.imageAlt} className="max-h-[520px] w-full rounded-xs object-cover" />
          {e.imageCredit ? <figcaption className="mt-2 text-xs text-muted">{e.imageCredit}</figcaption> : null}
        </figure>
      ) : null}

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="prose-lore" dangerouslySetInnerHTML={{ __html: e.html }} />
        <aside className="grid content-start gap-5">
          <Aside title="At a glance">
            <Facts
              items={[
                ["When", <span key="w" className="tabular">{card.when}</span>],
                ["Where", e.location],
                ["Era", era ? <Link key="e" className="link" href={`/era/${era.slug}/`}>{era.name}</Link> : null],
                ["Region", <Link key="r" className="link" href={`/region/${e.region}/`}>{regionName(w, e.region)}</Link>],
                ["Kind", categoryName(w, e.category)],
              ]}
            />
          </Aside>
          {e.people.length ? (
            <Aside title="People">
              <LinkList items={e.people.map((p) => ({ href: `/person/${p.slug}/`, label: w.person.get(p.slug)!.name, detail: p.role ?? w.person.get(p.slug)!.title }))} />
            </Aside>
          ) : null}
          {e.factions.length ? (
            <Aside title="Factions">
              <LinkList items={e.factions.map((f) => ({ href: `/faction/${f}/`, label: w.faction.get(f)!.name, detail: w.faction.get(f)!.factionKind }))} />
            </Aside>
          ) : null}
          {e.places.length ? (
            <Aside title="Places">
              <LinkList items={e.places.map((p) => ({ href: `/place/${p}/`, label: w.place.get(p)!.name, detail: w.place.get(p)!.placeKind }))} />
              {w.config.map && mapped.length ? (
                <div className="mt-4">
                  <MapView src={assetUrl(w.config.map.image)!} width={w.config.map.width} height={w.config.map.height} alt={w.config.map.alt} pins={mapped.map((p) => ({ slug: p.slug, name: p.name, x: p.map![0], y: p.map![1] }))} highlight={mapped.map((p) => p.slug)} />
                </div>
              ) : null}
            </Aside>
          ) : null}
        </aside>
      </div>

      <Section id="before-after" title="Before and after" action={<Link className="link text-sm" href={`/connections/${e.slug}/`}>Open the connections map</Link>}>
        <BeforeAfter
          current={card}
          before={{ causedBy: toCards(rel.causedBy), contributing: toCards(rel.contributing), precededBy: toCards(rel.precededBy) }}
          after={{ ledTo: toCards(rel.ledTo), contributedTo: toCards(rel.contributedTo), followedBy: toCards(rel.followedBy) }}
        />
      </Section>

      {rel.partOf.length + rel.parts.length + rel.related.length ? (
        <Section id="related" title="Related">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...rel.partOf, ...rel.parts, ...rel.related].map((r) => <li key={r.event.slug}><EventCard e={eventCard(w, r.event)} compact /></li>)}
          </ul>
        </Section>
      ) : null}

      {others.length ? (
        <Section id="meanwhile" title="Meanwhile">
          <p className="-mt-1 mb-4 text-sm text-ink-2">Other events under way at about the same time.</p>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((o) => <li key={o.slug}><EventCard e={eventCard(w, o)} compact /></li>)}
          </ul>
        </Section>
      ) : null}

      <nav aria-label="Chronological" className="mt-16 grid gap-4 border-t border-line pt-6 sm:grid-cols-2">
        {prev ? (
          <Link href={`/event/${prev.slug}/`} className="group">
            <span className="eyebrow">← Earlier</span>
            <span className="block font-display text-lg font-semibold group-hover:underline">{prev.name}</span>
          </Link>
        ) : <span />}
        {next ? (
          <Link href={`/event/${next.slug}/`} className="group sm:text-right">
            <span className="eyebrow">Later →</span>
            <span className="block font-display text-lg font-semibold group-hover:underline">{next.name}</span>
          </Link>
        ) : null}
      </nav>
    </article>
  );
}
