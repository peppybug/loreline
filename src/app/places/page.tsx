import Link from "next/link";
import { EntityCard } from "@/components/cards";
import { IndexPage } from "@/components/index-page";
import { loadWorld } from "@/lib/world";

export const metadata = { title: "Places" };

export default function Places() {
  const w = loadWorld();
  return (
    <IndexPage title="Places" intro="Every place in the record, by region.">
      {w.config.map ? <p className="-mt-4 mb-8"><Link className="link" href="/map/">See them on the map</Link></p> : null}
      {w.regions.map((r) => {
        const list = w.places.filter((p) => p.region === r.slug);
        if (!list.length) return null;
        return (
          <section key={r.slug} className="mb-10">
            <h2 className="border-b border-line pb-2 text-xl"><Link href={`/region/${r.slug}/`} className="hover:underline">{r.name}</Link></h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((p) => <li key={p.slug}><EntityCard href={`/place/${p.slug}/`} name={p.name} detail={[p.placeKind, `${p.events.length} events`].filter(Boolean).join(" · ")} image={p.image} /></li>)}
            </ul>
          </section>
        );
      })}
    </IndexPage>
  );
}
