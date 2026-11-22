import { formatRange, yearLabel, type Calendar } from "./calendar";
import { categoryName, regionName, type World } from "./world";

export interface SearchDoc {
  id: string;
  type: "event" | "person" | "place" | "faction" | "era";
  slug: string;
  title: string;
  aliases: string[];
  detail: string;
  /** Names of linked people, places and factions. */
  links: string[];
  tags: string[];
  body: string;
  sy: number | null;
  ey: number | null;
  sort: number;
  region: string | null;
  category: string | null;
  image: string | null;
}

export interface SearchIndex {
  calendar: Calendar;
  regions: { slug: string; name: string }[];
  categories: { slug: string; name: string }[];
  docs: SearchDoc[];
}

export function buildSearchIndex(w: World): SearchIndex {
  const docs: SearchDoc[] = [];
  const names = (slugs: string[], map: Map<string, { name: string }>) => slugs.map((s) => map.get(s)?.name ?? "").filter(Boolean);
  for (const e of w.events) {
    docs.push({
      id: `event:${e.slug}`,
      type: "event",
      slug: e.slug,
      title: e.name,
      aliases: e.aliases,
      detail: `${yearLabel(e.start, e.end, w.calendar)} · ${e.summary}`,
      links: [...names(e.people.map((p) => p.slug), w.person), ...names(e.places, w.place), ...names(e.factions, w.faction), e.location, regionName(w, e.region), categoryName(w, e.category)],
      tags: e.tags,
      body: e.text.slice(0, 1200),
      sy: e.start.year,
      ey: (e.end ?? e.start).year,
      sort: e.sort,
      region: e.region,
      category: e.category,
      image: e.image,
    });
  }
  for (const p of w.people) {
    const life = p.born || p.died ? formatRange(p.born ?? p.died!, p.born && p.died ? p.died : null, w.calendar) : "";
    docs.push({
      id: `person:${p.slug}`, type: "person", slug: p.slug, title: p.name, aliases: p.aliases,
      detail: [p.title, life].filter(Boolean).join(" · "),
      links: names(p.factions, w.faction), tags: p.tags, body: p.text.slice(0, 800),
      sy: p.born?.year ?? null, ey: p.died?.year ?? null, sort: p.born ? p.born.year : 0, region: p.region, category: null, image: p.image,
    });
  }
  for (const p of w.places)
    docs.push({
      id: `place:${p.slug}`, type: "place", slug: p.slug, title: p.name, aliases: p.aliases,
      detail: [p.placeKind, regionName(w, p.region)].filter(Boolean).join(" · "),
      links: [], tags: p.tags, body: p.text.slice(0, 800), sy: null, ey: null, sort: 0, region: p.region, category: null, image: p.image,
    });
  for (const f of w.factions)
    docs.push({
      id: `faction:${f.slug}`, type: "faction", slug: f.slug, title: f.name, aliases: f.aliases,
      detail: f.factionKind, links: names(f.members, w.person), tags: f.tags, body: f.text.slice(0, 800),
      sy: f.founded?.year ?? null, ey: f.dissolved?.year ?? null, sort: 0, region: f.region, category: null, image: f.image,
    });
  for (const e of w.eras)
    docs.push({
      id: `era:${e.slug}`, type: "era", slug: e.slug, title: e.name, aliases: [],
      detail: `${formatRange(e.start, e.end, w.calendar)}${e.end ? "" : " onwards"}`,
      links: [], tags: [], body: e.summary, sy: e.start.year, ey: e.end?.year ?? null, sort: e.startKey, region: null, category: null, image: null,
    });
  return { calendar: w.calendar, regions: w.regions.map(({ slug, name }) => ({ slug, name })), categories: w.categories, docs };
}
