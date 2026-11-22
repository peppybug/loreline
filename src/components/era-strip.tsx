import Link from "next/link";
import { formatYear } from "@/lib/calendar";
import type { World } from "@/lib/world";

/** The eras as proportional bands, with event counts. */
export function EraStrip({ world: w }: { world: World }) {
  if (!w.eras.length) return null;
  return (
    <ol className="grid gap-2 sm:grid-cols-2 lg:flex lg:[&>li]:flex-1">
      {w.eras.map((e) => {
        const n = w.events.filter((ev) => ev.era === e.slug).length;
        return (
          <li key={e.slug}>
            <Link href={`/era/${e.slug}/`} className="card-link group block h-full rounded-sm border border-line bg-surface p-4">
              <span className="block text-xs text-muted tabular">
                {formatYear(e.start.year, w.calendar)} – {e.end ? formatYear(e.end.year, w.calendar) : "now"}
              </span>
              <span className="card-title mt-1 block font-display text-xl font-semibold leading-tight">{e.name}</span>
              <span className="mt-1 block text-xs text-muted">{n} event{n === 1 ? "" : "s"}</span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
