import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntityCard, Section } from "@/components/cards";
import { EntityPage } from "@/components/entity-page";
import { Aside, Facts } from "@/components/fact-list";
import { formatDate } from "@/lib/calendar";
import { eventCard } from "@/lib/site";
import { loadWorld, regionName } from "@/lib/world";

export const dynamicParams = false;
export const generateStaticParams = () => loadWorld().factions.map((f) => ({ slug: f.slug }));
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const f = loadWorld().faction.get((await params).slug);
  return f ? { title: f.name, description: f.text.slice(0, 160) } : {};
}

export default async function FactionPage({ params }: { params: Promise<{ slug: string }> }) {
  const w = loadWorld();
  const f = w.faction.get((await params).slug);
  if (!f) notFound();
  const events = f.events.map((s) => w.event.get(s)!).sort((a, b) => a.sort - b.sort);
  const members = f.members.map((m) => w.person.get(m)!);
  return (
    <EntityPage
      eyebrow={f.factionKind || "Faction"}
      name={f.name}
      image={f.image}
      imageAlt={f.imageAlt}
      color={f.color}
      html={f.html}
      events={events.map((e) => eventCard(w, e))}
      eventsTitle="Involved in"
      aside={
        <Aside title="At a glance">
          <Facts
            items={[
              ["Kind", f.factionKind],
              ["Founded", f.founded ? <span key="f" className="tabular">{formatDate(f.founded, w.calendar)}</span> : null],
              ["Ended", f.dissolved ? <span key="d" className="tabular">{formatDate(f.dissolved, w.calendar)}</span> : null],
              ["Region", f.region ? regionName(w, f.region) : null],
              ["Also called", f.aliases.length ? f.aliases.join(", ") : null],
            ]}
          />
        </Aside>
      }
    >
      {members.length ? (
        <Section id="members" title={`Members · ${members.length}`}>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((m) => <li key={m.slug}><EntityCard href={`/person/${m.slug}/`} name={m.name} detail={m.title} image={m.image} color={f.color} rounded /></li>)}
          </ul>
        </Section>
      ) : null}
    </EntityPage>
  );
}
