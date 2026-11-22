import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EntityPage } from "@/components/entity-page";
import { formatRange } from "@/lib/calendar";
import { eventCard } from "@/lib/site";
import { loadWorld } from "@/lib/world";

export const dynamicParams = false;
export const generateStaticParams = () => loadWorld().eras.map((e) => ({ slug: e.slug }));
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const e = loadWorld().eras.find((x) => x.slug === slug);
  return e ? { title: e.name, description: e.summary } : {};
}

export default async function EraPage({ params }: { params: Promise<{ slug: string }> }) {
  const w = loadWorld();
  const { slug } = await params;
  const i = w.eras.findIndex((x) => x.slug === slug);
  if (i < 0) notFound();
  const era = w.eras[i];
  const events = w.events.filter((e) => e.era === era.slug);
  const [prev, next] = [w.eras[i - 1], w.eras[i + 1]];
  return (
    <EntityPage
      eyebrow="Era"
      name={era.name}
      detail={`${formatRange(era.start, era.end, w.calendar)}${era.end ? "" : " onwards"}${era.summary ? `. ${era.summary}` : ""}`}
      events={events.map((e) => eventCard(w, e))}
      eventsTitle="Events"
    >
      <nav aria-label="Other eras" className="mt-2 flex flex-wrap justify-between gap-4 text-sm">
        {prev ? <Link className="link" href={`/era/${prev.slug}/`}>← {prev.name}</Link> : <span />}
        <Link className="link" href={`/timeline/?from=${era.start.year}&to=${era.end?.year ?? w.span.to}`}>See this era on the timeline</Link>
        {next ? <Link className="link" href={`/era/${next.slug}/`}>{next.name} →</Link> : <span />}
      </nav>
    </EntityPage>
  );
}
