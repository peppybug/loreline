import { Suspense } from "react";
import { Timeline } from "@/components/timeline";
import { eventCard } from "@/lib/site";
import { loadWorld } from "@/lib/world";

export const metadata = { title: "Timeline" };

export default function TimelinePage() {
  const w = loadWorld();
  return (
    <div className="container-page pt-10">
      <h1 className="text-3xl">Timeline</h1>
      <p className="mt-3 max-w-2xl text-lg text-ink-2">All {w.events.length} events on one scale, a row for each region, so you can see what was happening across the world at the same moment.</p>
      <div className="mt-8">
        <Suspense fallback={<p className="text-muted">Loading the timeline…</p>}>
          <Timeline
            events={w.events.map((e) => eventCard(w, e))}
            regions={w.regions.map(({ slug, name }) => ({ slug, name }))}
            categories={w.categories}
            eras={w.eras.map((e) => ({ slug: e.slug, name: e.name, startKey: e.startKey, endKey: Number.isFinite(e.endKey) ? e.endKey : null }))}
            calendar={w.calendar}
            span={w.span}
          />
        </Suspense>
      </div>
    </div>
  );
}
