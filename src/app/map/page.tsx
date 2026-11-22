import { notFound } from "next/navigation";
import { EntityCard } from "@/components/cards";
import { MapView } from "@/components/map-view";
import { assetUrl, loadWorld, regionName } from "@/lib/world";

export const metadata = { title: "Map" };

export default function MapPage() {
  const w = loadWorld();
  if (!w.config.map) notFound();
  const pinned = w.places.filter((p) => p.map);
  return (
    <div className="container-page pt-10">
      <h1 className="text-3xl">Map</h1>
      <p className="mt-3 max-w-2xl text-lg text-ink-2">{pinned.length} places. Select one to see what happened there.</p>
      <div className="mt-8">
        <MapView src={assetUrl(w.config.map.image)!} width={w.config.map.width} height={w.config.map.height} alt={w.config.map.alt} pins={pinned.map((p) => ({ slug: p.slug, name: p.name, x: p.map![0], y: p.map![1], detail: p.placeKind }))} />
      </div>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {pinned.map((p) => <li key={p.slug}><EntityCard href={`/place/${p.slug}/`} name={p.name} detail={`${p.placeKind} · ${regionName(w, p.region)}`} image={p.image} /></li>)}
      </ul>
    </div>
  );
}
