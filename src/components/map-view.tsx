import Link from "next/link";

export interface Pin {
  slug: string;
  name: string;
  x: number;
  y: number;
  detail?: string;
}

/** Your map image with a labelled pin for every place that has `map: [x, y]`. */
export function MapView({ src, width, height, alt, pins, highlight }: { src: string; width: number; height: number; alt: string; pins: Pin[]; highlight?: string[] }) {
  const lit = new Set(highlight ?? []);
  return (
    <figure className="overflow-hidden rounded-sm border border-line bg-surface">
      <div className="relative" style={{ aspectRatio: `${width} / ${height}` }}>
        <img src={src} alt={alt} width={width} height={height} className="absolute inset-0 h-full w-full" />
        <ul>
          {pins.map((p) => {
            const on = lit.size === 0 || lit.has(p.slug);
            const right = p.x > 78;
            return (
              <li key={p.slug} className="absolute" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
                <Link
                  href={`/place/${p.slug}/`}
                  className={`group absolute flex -translate-y-1/2 items-center gap-1.5 ${right ? "right-0 flex-row-reverse translate-x-[7px]" : "-translate-x-[7px]"} ${on ? "" : "opacity-45"}`}
                  aria-label={`${p.name}${p.detail ? `, ${p.detail}` : ""}`}
                >
                  <span className={`block h-3.5 w-3.5 shrink-0 rounded-full border-2 border-white shadow ${lit.has(p.slug) ? "bg-thread" : "bg-[#3b3428] group-hover:bg-thread"}`} />
                  <span className="whitespace-nowrap rounded-xs bg-[#fbf7ee]/90 px-1.5 py-0.5 text-[0.7rem] font-semibold text-[#2b251c] shadow-sm group-hover:underline sm:text-xs">{p.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </figure>
  );
}
