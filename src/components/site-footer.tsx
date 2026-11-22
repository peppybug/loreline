import Link from "next/link";
import type { World } from "@/lib/world";

export function SiteFooter({ world: w }: { world: World }) {
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm">
          <p className="font-display text-xl font-semibold">{w.config.name}</p>
          {w.config.tagline ? <p className="mt-2 text-sm text-ink-2">{w.config.tagline}</p> : null}
        </div>
        <nav aria-label="Browse">
          <h2 className="font-sans text-sm font-semibold">Browse</h2>
          <ul className="mt-3 grid gap-2 text-sm text-ink-2">
            <li><Link className="hover:text-ink" href="/timeline/">Timeline</Link></li>
            <li><Link className="hover:text-ink" href="/connections/">Cause and effect</Link></li>
            {w.config.map ? <li><Link className="hover:text-ink" href="/map/">Map</Link></li> : null}
            <li><Link className="hover:text-ink" href="/search/">Search</Link></li>
          </ul>
        </nav>
        <nav aria-label="The world">
          <h2 className="font-sans text-sm font-semibold">The world</h2>
          <ul className="mt-3 grid gap-2 text-sm text-ink-2">
            <li><Link className="hover:text-ink" href="/people/">People</Link></li>
            <li><Link className="hover:text-ink" href="/factions/">Factions</Link></li>
            <li><Link className="hover:text-ink" href="/places/">Places</Link></li>
            <li><Link className="hover:text-ink" href="/eras/">Eras</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-wrap justify-between gap-x-6 gap-y-2 py-5 text-xs text-muted">
          <p>{w.config.footer ?? `© ${w.config.author ?? w.config.name}`}</p>
          {w.config.credit ? <p>Built with Loreline</p> : null}
        </div>
      </div>
    </footer>
  );
}
