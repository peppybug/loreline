import Link from "next/link";
import { EntityCard, EventCard, Section } from "@/components/cards";
import { EraStrip } from "@/components/era-strip";
import { MapView } from "@/components/map-view";
import { SearchBox } from "@/components/search-box";
import { eventCard } from "@/lib/site";
import { formatYear } from "@/lib/calendar";
import { assetUrl, longestChain, loadWorld } from "@/lib/world";

export default function Home() {
  const w = loadWorld();
  const featured = (w.events.some((e) => e.featured) ? w.events.filter((e) => e.featured) : w.events).slice(0, 6);
  const chain = longestChain(w);
  const people = (w.people.some((p) => p.featured) ? w.people.filter((p) => p.featured) : w.people).slice(0, 6);
  const sample = w.people[0]?.name.split(" ")[0] ?? "a name";

  return (
    <div className="container-page">
      <section className="grid grid-cols-1 gap-10 pb-6 pt-14 md:pt-20 lg:grid-cols-[1.25fr_1fr] lg:items-end">
        <div>
          {w.config.author ? <p className="eyebrow">{w.config.author}</p> : null}
          <h1 className="mt-3 text-[2.75rem] leading-[1.02] sm:text-3xl">{w.config.name}</h1>
          {w.config.tagline ? <p className="mt-4 max-w-xl font-serif text-xl text-ink-2">{w.config.tagline}</p> : null}
        </div>
        <div className="lg:pb-2">
          <SearchBox placeholder={`Try “${sample}”, a place, or “${formatYear(w.events[Math.floor(w.events.length / 2)]?.start.year ?? 1, w.calendar)}”`} />
          <p className="mt-3 text-sm text-muted tabular">
            {w.events.length} events · {w.people.length} people · {w.places.length} places · {w.factions.length} factions · {w.relations.length} connections
          </p>
        </div>
      </section>

      {w.introHtml ? <div className="prose-lore mt-6 border-t border-line pt-8" dangerouslySetInnerHTML={{ __html: w.introHtml }} /> : null}

      {w.eras.length ? (
        <Section id="eras" title="The ages" action={<Link className="link text-sm" href="/timeline/">Open the timeline</Link>}>
          <EraStrip world={w} />
        </Section>
      ) : null}

      {chain.length >= 3 ? (
        <Section id="thread" title="Follow the thread" action={<Link className="link text-sm" href={`/connections/${chain[0].slug}/`}>See every connection</Link>}>
          <p className="max-w-2xl text-ink-2">One chain of cause and effect, from {chain[0].name} to {chain[chain.length - 1].name}.</p>
          <ol className="mt-5 grid gap-3 md:grid-flow-col md:auto-cols-fr">
            {chain.map((e, i) => (
              <li key={e.slug} className="relative">
                <Link href={`/event/${e.slug}/`} className="card-link group flex h-full flex-col rounded-sm border border-line bg-surface p-4">
                  <span className="text-xs text-muted tabular">{eventCard(w, e).years}</span>
                  <span className="card-title mt-1 font-display text-lg font-semibold leading-tight">{e.name}</span>
                </Link>
                {i < chain.length - 1 ? (
                  <svg viewBox="0 0 24 24" className="absolute left-1/2 top-full z-10 h-3 w-5 -translate-x-1/2 text-thread md:left-full md:top-1/2 md:h-5 md:w-3 md:-translate-x-0 md:-translate-y-1/2" aria-hidden="true" preserveAspectRatio="none">
                    <path d="M12 0v24" className="md:hidden" stroke="currentColor" strokeWidth="3" />
                    <path d="M0 12h24" className="hidden md:block" stroke="currentColor" strokeWidth="3" />
                  </svg>
                ) : null}
              </li>
            ))}
          </ol>
        </Section>
      ) : null}

      <Section id="featured" title="Turning points">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((e) => <li key={e.slug}><EventCard e={eventCard(w, e)} /></li>)}
        </ul>
      </Section>

      <div className="grid gap-x-10 lg:grid-cols-2">
        {people.length ? (
          <Section id="people" title="People" action={<Link className="link text-sm" href="/people/">All {w.people.length}</Link>}>
            <ul className="grid gap-3 sm:grid-cols-2">
              {people.map((p) => <li key={p.slug}><EntityCard href={`/person/${p.slug}/`} name={p.name} detail={p.title} image={p.image} color={w.faction.get(p.factions[0])?.color} rounded /></li>)}
            </ul>
          </Section>
        ) : null}
        {w.factions.length ? (
          <Section id="factions" title="Factions" action={<Link className="link text-sm" href="/factions/">All {w.factions.length}</Link>}>
            <ul className="grid gap-3 sm:grid-cols-2">
              {w.factions.slice(0, 6).map((f) => <li key={f.slug}><EntityCard href={`/faction/${f.slug}/`} name={f.name} detail={f.factionKind} image={f.image} color={f.color} /></li>)}
            </ul>
          </Section>
        ) : null}
      </div>

      {w.config.map ? (
        <Section id="map" title="The map" action={<Link className="link text-sm" href="/map/">Open the map</Link>}>
          <MapView src={assetUrl(w.config.map.image)!} width={w.config.map.width} height={w.config.map.height} alt={w.config.map.alt} pins={w.places.filter((p) => p.map).map((p) => ({ slug: p.slug, name: p.name, x: p.map![0], y: p.map![1], detail: p.placeKind }))} />
        </Section>
      ) : null}
    </div>
  );
}
