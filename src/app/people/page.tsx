import { EntityCard } from "@/components/cards";
import { IndexPage } from "@/components/index-page";
import { loadWorld } from "@/lib/world";

export const metadata = { title: "People" };

export default function People() {
  const w = loadWorld();
  return (
    <IndexPage title="People" intro={`${w.people.length} people, from the earliest records to the present day.`}>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {w.people.map((p) => <li key={p.slug}><EntityCard href={`/person/${p.slug}/`} name={p.name} detail={p.title} image={p.image} color={w.faction.get(p.factions[0])?.color} rounded /></li>)}
      </ul>
    </IndexPage>
  );
}
