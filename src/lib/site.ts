import { formatRange, yearLabel } from "./calendar";
import { categoryName, regionName, type World, type WorldEvent } from "./world";

export const siteUrl = (process.env.SITE_URL ?? "").replace(/\/$/, "");

/** Everything a card or the timeline needs about an event, ready to send to the browser. */
export function eventCard(w: World, e: WorldEvent) {
  return {
    slug: e.slug,
    title: e.name,
    summary: e.summary,
    years: yearLabel(e.start, e.end, w.calendar),
    when: formatRange(e.start, e.end, w.calendar),
    startYear: e.start.year,
    endYear: (e.end ?? e.start).year,
    sort: e.sort,
    until: e.until,
    region: e.region,
    regionName: regionName(w, e.region),
    category: e.category,
    categoryName: categoryName(w, e.category),
    location: e.location,
    image: e.image,
  };
}
export type EventCardData = ReturnType<typeof eventCard>;

/** Lighter version of the accent for dark mode. */
export function accentPair(hex: string | undefined) {
  if (!hex) return null;
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255];
  const mix = (c: number) => Math.round(c + (255 - c) * 0.38);
  const light = `#${[mix(r), mix(g), mix(b)].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
  return { light: hex, dark: light };
}

export const initials = (name: string) =>
  name
    .replace(/^the\s+/i, "")
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w) && !/^(of|the|and|at|in)$/i.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
