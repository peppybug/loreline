import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntityCard, Section } from "@/components/cards";
import { EntityPage } from "@/components/entity-page";
import { eventCard } from "@/lib/site";
import { loadWorld } from "@/lib/world";

export const dynamicParams = false;
export const generateStaticParams = () => loadWorld().regions.map((r) => ({ slug: r.slug }));
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const r = loadWorld().regions.find((x) => x.slug === slug);
  return r ? { title: r.name, description: r.summary } : {};
}

export default async function RegionPage({ params }: { params: Promise<{ slug: string }> }) {
  const w = loadWorld();
  const { slug } = await params;
  const r = w.regions.find((x) => x.slug === slug);
  if (!r) notFound();
  const places = w.places.filter((p) => p.region === slug);
  return (
    <EntityPage eyebrow="Region" name={r.name} detail={r.summary} events={w.events.filter((e) => e.region === slug).map((e) => eventCard(w, e))} eventsTitle="Events">
      {places.length ? (
        <Section id="places" title="Places">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {places.map((p) => <li key={p.slug}><EntityCard href={`/place/${p.slug}/`} name={p.name} detail={p.placeKind} image={p.image} /></li>)}
          </ul>
        </Section>
      ) : null}
    </EntityPage>
  );
}
