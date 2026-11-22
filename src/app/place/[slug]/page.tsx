import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntityPage } from "@/components/entity-page";
import { Aside, Facts } from "@/components/fact-list";
import { MapView } from "@/components/map-view";
import { eventCard } from "@/lib/site";
import { assetUrl, loadWorld, regionName } from "@/lib/world";
import Link from "next/link";

export const dynamicParams = false;
export const generateStaticParams = () => loadWorld().places.map((p) => ({ slug: p.slug }));
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = loadWorld().place.get((await params).slug);
  return p ? { title: p.name, description: p.text.slice(0, 160) } : {};
}

export default async function PlacePage({ params }: { params: Promise<{ slug: string }> }) {
  const w = loadWorld();
  const p = w.place.get((await params).slug);
  if (!p) notFound();
  const events = p.events.map((s) => w.event.get(s)!).sort((a, b) => a.sort - b.sort);
  return (
    <EntityPage
      eyebrow={p.placeKind || "Place"}
      name={p.name}
      detail={regionName(w, p.region)}
      image={p.image}
      imageAlt={p.imageAlt}
      html={p.html}
      events={events.map((e) => eventCard(w, e))}
      eventsTitle="What happened here"
      aside={
        <>
          <Aside title="At a glance">
            <Facts items={[["Kind", p.placeKind], ["Region", <Link key="r" className="link" href={`/region/${p.region}/`}>{regionName(w, p.region)}</Link>], ["Also called", p.aliases.length ? p.aliases.join(", ") : null]]} />
          </Aside>
          {w.config.map && p.map ? (
            <MapView src={assetUrl(w.config.map.image)!} width={w.config.map.width} height={w.config.map.height} alt={w.config.map.alt} pins={[{ slug: p.slug, name: p.name, x: p.map[0], y: p.map[1] }]} highlight={[p.slug]} />
          ) : null}
        </>
      }
    />
  );
}
