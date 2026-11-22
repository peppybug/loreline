import { EntityCard } from "@/components/cards";
import { IndexPage } from "@/components/index-page";
import { loadWorld } from "@/lib/world";

export const metadata = { title: "Factions" };

export default function Factions() {
  const w = loadWorld();
  return (
    <IndexPage title="Factions" intro="Houses, orders, leagues and movements.">
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {w.factions.map((f) => <li key={f.slug}><EntityCard href={`/faction/${f.slug}/`} name={f.name} detail={[f.factionKind, `${f.members.length} members`, `${f.events.length} events`].filter(Boolean).join(" · ")} image={f.image} color={f.color} /></li>)}
      </ul>
    </IndexPage>
  );
}
