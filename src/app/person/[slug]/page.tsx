import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntityCard, Section } from "@/components/cards";
import { EntityPage } from "@/components/entity-page";
import { Aside, Facts, LinkList } from "@/components/fact-list";
import { formatDate } from "@/lib/calendar";
import { eventCard } from "@/lib/site";
import { loadWorld, regionName } from "@/lib/world";

export const dynamicParams = false;
export const generateStaticParams = () => loadWorld().people.map((p) => ({ slug: p.slug }));
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = loadWorld().person.get((await params).slug);
  return p ? { title: p.name, description: p.title || p.text.slice(0, 160) } : {};
}

export default async function PersonPage({ params }: { params: Promise<{ slug: string }> }) {
  const w = loadWorld();
  const p = w.person.get((await params).slug);
  if (!p) notFound();
  const events = p.events.map((s) => w.event.get(s)!).sort((a, b) => a.sort - b.sort);
  // People who appear in the same events
  const together = new Map<string, number>();
  for (const e of events) for (const o of e.people) if (o.slug !== p.slug) together.set(o.slug, (together.get(o.slug) ?? 0) + 1);
  const companions = [...together].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([s]) => w.person.get(s)!);
  const color = w.faction.get(p.factions[0])?.color;
  return (
    <EntityPage
      eyebrow="Person"
      name={p.name}
      detail={p.title}
      image={p.image}
      imageAlt={p.imageAlt}
      color={color}
      rounded
      html={p.html}
      events={events.map((e) => eventCard(w, e))}
      aside={
        <>
          <Aside title="At a glance">
            <Facts
              items={[
                ["Born", p.born ? <span key="b" className="tabular">{formatDate(p.born, w.calendar)}</span> : null],
                ["Died", p.died ? <span key="d" className="tabular">{formatDate(p.died, w.calendar)}</span> : null],
                ["Region", p.region ? regionName(w, p.region) : null],
                ["Also called", p.aliases.length ? p.aliases.join(", ") : null],
              ]}
            />
          </Aside>
          {p.factions.length ? (
            <Aside title="Factions">
              <LinkList items={p.factions.map((f) => ({ href: `/faction/${f}/`, label: w.faction.get(f)!.name, detail: w.faction.get(f)!.factionKind }))} />
            </Aside>
          ) : null}
        </>
      }
    >
      {companions.length ? (
        <Section id="companions" title="Often alongside">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {companions.map((c) => <li key={c.slug}><EntityCard href={`/person/${c.slug}/`} name={c.name} detail={c.title} image={c.image} color={w.faction.get(c.factions[0])?.color} rounded /></li>)}
          </ul>
        </Section>
      ) : null}
    </EntityPage>
  );
}
