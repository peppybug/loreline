import Link from "next/link";
import { yearLabel } from "@/lib/calendar";
import { hubEvent, loadWorld } from "@/lib/world";
import { RelationLegend } from "./cards";
import { ConnectionGraph } from "./connection-graph";
import { EventPicker } from "./event-picker";

/** Events up to `depth` cause-and-effect steps from the chosen one. */
export function ConnectionsView({ slug }: { slug?: string }) {
  const w = loadWorld();
  const root = slug ? w.event.get(slug)! : hubEvent(w);
  if (!root) return <div className="container-page pt-10"><h1 className="text-3xl">Connections</h1><p className="mt-4 text-ink-2">Add some events first.</p></div>;
  const depth = 3;
  const seen = new Set([root.slug]);
  let frontier = [root.slug];
  for (let d = 0; d < depth; d++) {
    const next: string[] = [];
    for (const r of w.relations)
      for (const [a, b] of [[r.from, r.to], [r.to, r.from]])
        if (frontier.includes(a) && !seen.has(b) && (d === 0 || ["led_to", "contributed_to", "followed_by"].includes(r.type))) {
          seen.add(b);
          next.push(b);
        }
    frontier = next;
  }
  const nodes = [...seen].map((s) => w.event.get(s)!).map((e) => ({ id: e.slug, slug: e.slug, title: e.name, sortKey: e.sort, years: yearLabel(e.start, e.end, w.calendar) }));
  const edges = w.relations.filter((r) => seen.has(r.from) && seen.has(r.to)).map((r) => ({ from: r.from, to: r.to, type: r.type, note: r.note }));
  const connected = new Set(w.relations.flatMap((r) => [r.from, r.to]));
  const starts = w.events.filter((e) => e.featured && connected.has(e.slug) && e.slug !== root.slug).slice(0, 6);

  return (
    <div className="container-page pt-10">
      <h1 className="text-3xl">Connections{slug ? <span className="block text-xl text-ink-2 sm:text-2xl">around {root.name}</span> : null}</h1>
      <div className="mt-3 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <p className="max-w-2xl text-lg text-ink-2">What led to an event and what followed, up to three steps away. Select any card to re-centre the map on it.</p>
        <RelationLegend />
      </div>
      <div className="mt-8 flex flex-wrap items-end gap-x-8 gap-y-4">
        <EventPicker options={w.events.map((e) => ({ slug: e.slug, title: e.name }))} value={root.slug} />
        {starts.length ? (
          <p className="text-sm">
            <span className="text-muted">Good starting points: </span>
            {starts.map((e, i) => (
              <span key={e.slug}>{i ? ", " : ""}<Link className="link" href={`/connections/${e.slug}/`}>{e.name}</Link></span>
            ))}
          </p>
        ) : null}
      </div>
      <div className="mt-8">
        <ConnectionGraph key={root.slug} nodes={nodes} edges={edges} rootId={root.slug} />
      </div>
    </div>
  );
}
