import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConnectionsView } from "@/components/connections-view";
import { loadWorld } from "@/lib/world";

export const dynamicParams = false;
export const generateStaticParams = () => loadWorld().events.map((e) => ({ slug: e.slug }));
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const e = loadWorld().event.get((await params).slug);
  return e ? { title: `Connections: ${e.name}` } : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!loadWorld().event.has(slug)) notFound();
  return <ConnectionsView slug={slug} />;
}
