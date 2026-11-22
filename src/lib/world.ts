/**
 * Reads everything in world/ at build time and turns it into one connected,
 * checked record: every link resolved, every date parsed, every reverse link
 * ("caused by", "appears in") worked out for you.
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import type { z } from "zod";
import { DEFAULT_MONTHS, axisYear, parseDate, sortKey, type Calendar, type WorldDate } from "./calendar";
import {
  RELATION_KINDS,
  eventSchema,
  factionSchema,
  personSchema,
  placeSchema,
  worldSchema,
  type RelationKind,
  type WorldConfig,
} from "./schema";

export type Kind = "event" | "person" | "place" | "faction";

export interface Issue {
  file: string;
  message: string;
  level: "error" | "warning";
}

interface Base {
  slug: string;
  name: string;
  aliases: string[];
  tags: string[];
  image: string | null;
  imageAlt: string;
  imageCredit: string | null;
  featured: boolean;
  html: string;
  /** Body as plain text, for search and descriptions. */
  text: string;
  file: string;
}

export interface Era {
  slug: string;
  name: string;
  start: WorldDate;
  end: WorldDate | null;
  startKey: number;
  endKey: number;
  summary: string;
}

export interface WorldEvent extends Base {
  kind: "event";
  start: WorldDate;
  end: WorldDate | null;
  sort: number;
  /** Sort key of the last moment of the event (its end, or its start). */
  until: number;
  era: string | null;
  region: string;
  category: string;
  location: string;
  summary: string;
  places: string[];
  people: { slug: string; role: string | null }[];
  factions: string[];
}

export interface Person extends Base {
  kind: "person";
  title: string;
  born: WorldDate | null;
  died: WorldDate | null;
  region: string | null;
  factions: string[];
  events: string[];
}

export interface Place extends Base {
  kind: "place";
  placeKind: string;
  region: string;
  map: [number, number] | null;
  events: string[];
}

export interface Faction extends Base {
  kind: "faction";
  factionKind: string;
  founded: WorldDate | null;
  dissolved: WorldDate | null;
  region: string | null;
  color: string | null;
  members: string[];
  events: string[];
}

export interface Relation {
  from: string;
  to: string;
  type: RelationKind;
  note: string | null;
}

export interface World {
  config: WorldConfig;
  calendar: Calendar;
  introHtml: string;
  eras: Era[];
  regions: WorldConfig["regions"];
  categories: WorldConfig["categories"];
  events: WorldEvent[];
  people: Person[];
  places: Place[];
  factions: Faction[];
  relations: Relation[];
  event: Map<string, WorldEvent>;
  person: Map<string, Person>;
  place: Map<string, Place>;
  faction: Map<string, Faction>;
  issues: Issue[];
  /** First and last year on the timeline. */
  span: { from: number; to: number };
}

const ROOT = process.env.LORELINE_WORLD_DIR ? path.resolve(process.env.LORELINE_WORLD_DIR) : path.join(process.cwd(), "world");
const base = () => process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const hrefFor = (kind: Kind, slug: string) => `/${kind}/${slug}/`;

export function assetUrl(p: string | null | undefined): string | null {
  if (!p) return null;
  if (/^https?:\/\//.test(p)) return p;
  return `${base()}/${p.replace(/^\/+/, "").replace(/^public\//, "")}`;
}

/* ------------------------------------------------------------------ */

function levenshtein(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

function didYouMean(word: string, options: Iterable<string>) {
  let best: string | null = null;
  let score = Infinity;
  for (const o of options) {
    const s = levenshtein(word, o);
    if (s < score) [best, score] = [o, s];
  }
  return best && score <= Math.max(2, Math.floor(word.length / 3)) ? ` Did you mean "${best}"?` : "";
}

function zodMessage(err: z.ZodError) {
  return err.issues.map((i) => {
    const field = i.path.join(".");
    let msg = i.message;
    if (i.code === "invalid_type" && /received undefined/.test(i.message)) msg = "is missing";
    else if (i.code === "invalid_type") msg = `has the wrong type (${i.message.replace(/^Invalid input: /, "")})`;
    return field ? `\`${field}\` ${msg}` : msg;
  });
}

function readFolder(dir: string) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .sort()
    .map((f) => {
      const file = `world/${dir}/${f}`;
      const raw = fs.readFileSync(path.join(full, f), "utf8");
      return { file, slug: f.replace(/\.md$/, ""), raw };
    });
}

const plain = (md: string) =>
  md
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/* ------------------------------------------------------------------ */

let cached: World | null = null;

export function loadWorld({ fresh = false } = {}): World {
  if (cached && !fresh && process.env.NODE_ENV === "production") return cached;
  const issues: Issue[] = [];
  const error = (file: string, message: string) => issues.push({ file, message, level: "error" });
  const warn = (file: string, message: string) => issues.push({ file, message, level: "warning" });

  /* world.yml ------------------------------------------------------- */
  const configFile = "world/world.yml";
  let config: WorldConfig;
  try {
    const raw = fs.readFileSync(path.join(ROOT, "world.yml"), "utf8");
    const parsed = worldSchema.safeParse(matter(`---\n${raw}\n---\n`).data);
    if (!parsed.success) {
      zodMessage(parsed.error).forEach((m) => error(configFile, m));
      throw new Error("invalid");
    }
    config = parsed.data;
  } catch (e) {
    if ((e as Error).message !== "invalid") error(configFile, `couldn't be read: ${(e as Error).message}`);
    throw new WorldError(issues);
  }

  const calendar: Calendar = {
    after: config.calendar.after,
    before: config.calendar.before,
    position: config.calendar.position,
    months: config.calendar.months ?? DEFAULT_MONTHS,
  };
  const date = (file: string, field: string, v: string | undefined): WorldDate | null => {
    if (v === undefined) return null;
    try {
      return parseDate(v, calendar);
    } catch (e) {
      error(file, `\`${field}\`: ${(e as Error).message}`);
      return null;
    }
  };

  const eras: Era[] = [];
  for (const e of config.eras) {
    const start = date(configFile, `eras.${e.slug}.start`, e.start);
    const end = date(configFile, `eras.${e.slug}.end`, e.end);
    if (!start) continue;
    eras.push({
      slug: e.slug,
      name: e.name,
      start,
      end,
      startKey: sortKey(start, calendar),
      endKey: end ? axisYear(end.year) + 1 - 1e-9 : Infinity,
      summary: e.summary,
    });
  }
  eras.sort((a, b) => a.startKey - b.startKey);
  const regionSlugs = new Set(config.regions.map((r) => r.slug));
  const categorySlugs = new Set(config.categories.map((c) => c.slug));

  /* Parse every file ------------------------------------------------ */
  type Parsed<T> = { slug: string; file: string; data: T; body: string };
  function parseAll<S extends z.ZodTypeAny>(dir: string, schema: S): Parsed<z.infer<S>>[] {
    const out: Parsed<z.infer<S>>[] = [];
    for (const f of readFolder(dir)) {
      if (!/^[a-z0-9][a-z0-9-]*$/.test(f.slug)) {
        error(f.file, `file names become web addresses, so use lowercase letters, numbers and dashes (rename it to "${f.slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.md")`);
        continue;
      }
      let fm: matter.GrayMatterFile<string>;
      try {
        fm = matter(f.raw);
      } catch (e) {
        error(f.file, `the block between the --- lines isn't valid YAML: ${(e as Error).message.split("\n")[0]}`);
        continue;
      }
      const r = schema.safeParse(fm.data);
      if (!r.success) {
        zodMessage(r.error).forEach((m) => error(f.file, m));
        continue;
      }
      if ((r.data as { draft?: boolean }).draft) continue;
      out.push({ slug: f.slug, file: f.file, data: r.data, body: fm.content });
    }
    return out;
  }
  const rawEvents = parseAll("events", eventSchema);
  const rawPeople = parseAll("people", personSchema);
  const rawPlaces = parseAll("places", placeSchema);
  const rawFactions = parseAll("factions", factionSchema);

  /* Names for [[wiki links]] ---------------------------------------- */
  const names = new Map<string, { kind: Kind; slug: string }>();
  const key = (n: string) => n.trim().toLowerCase().replace(/^the\s+/, "");
  const addName = (n: string, kind: Kind, slug: string) => {
    const k = key(n);
    if (!names.has(k)) names.set(k, { kind, slug });
  };
  for (const [list, kind] of [[rawEvents, "event"], [rawPeople, "person"], [rawPlaces, "place"], [rawFactions, "faction"]] as const) {
    for (const r of list as Parsed<{ aliases: string[]; title?: string; name?: string }>[]) {
      addName(r.slug, kind, r.slug);
      addName((kind === "event" ? r.data.title : r.data.name)!, kind, r.slug);
      r.data.aliases.forEach((a) => addName(a, kind, r.slug));
    }
  }
  const render = (file: string, md: string) => {
    const linked = md.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target: string, label?: string) => {
      const hit = names.get(key(target));
      const text = escapeHtml((label ?? target).trim());
      if (!hit) {
        warn(file, `[[${target}]] doesn't match any page yet.${didYouMean(key(target), names.keys())}`);
        return `<span class="wikilink-missing" title="No page for this yet">${text}</span>`;
      }
      return `<a class="wikilink" href="${base()}${hrefFor(hit.kind, hit.slug)}">${text}</a>`;
    });
    return marked.parse(linked, { async: false }) as string;
  };
  const baseFields = (r: Parsed<{ aliases: string[]; tags: string[]; image?: string; image_alt?: string; image_credit?: string; featured: boolean }>, name: string): Base => ({
    slug: r.slug,
    name,
    aliases: r.data.aliases,
    tags: r.data.tags,
    image: assetUrl(r.data.image),
    imageAlt: r.data.image_alt ?? "",
    imageCredit: r.data.image_credit ?? null,
    featured: r.data.featured,
    html: render(r.file, r.body),
    text: plain(r.body),
    file: r.file,
  });

  if (config.map && !fs.existsSync(path.join(process.cwd(), "public", config.map.image.replace(/^\/+/, ""))))
    error(configFile, `\`map.image\`: public/${config.map.image} doesn't exist. Put your map in the public folder.`);
  const checkImage = (file: string, p: string | undefined) => {
    if (p && !/^https?:\/\//.test(p) && !fs.existsSync(path.join(process.cwd(), "public", p.replace(/^\/+/, "").replace(/^public\//, ""))))
      error(file, `\`image\`: public/${p.replace(/^\/+/, "")} doesn't exist.`);
  };

  /* People, places, factions --------------------------------------- */
  const people = rawPeople.map((r): Person => {
    checkImage(r.file, r.data.image);
    return {
      ...baseFields(r, r.data.name),
      kind: "person",
      title: r.data.title,
      born: date(r.file, "born", r.data.born),
      died: date(r.file, "died", r.data.died),
      region: r.data.region ?? null,
      factions: r.data.factions,
      events: [],
    };
  });
  const places = rawPlaces.map((r): Place => {
    checkImage(r.file, r.data.image);
    return { ...baseFields(r, r.data.name), kind: "place", placeKind: r.data.kind, region: r.data.region, map: r.data.map ?? null, events: [] };
  });
  const factions = rawFactions.map((r): Faction => {
    checkImage(r.file, r.data.image);
    return {
      ...baseFields(r, r.data.name),
      kind: "faction",
      factionKind: r.data.kind,
      founded: date(r.file, "founded", r.data.founded),
      dissolved: date(r.file, "dissolved", r.data.dissolved),
      region: r.data.region ?? null,
      color: r.data.color ?? null,
      members: [],
      events: [],
    };
  });
  const person = new Map(people.map((p) => [p.slug, p]));
  const place = new Map(places.map((p) => [p.slug, p]));
  const faction = new Map(factions.map((f) => [f.slug, f]));

  const refCheck = (file: string, field: string, value: string, map: Map<string, unknown>, folder: string) => {
    if (map.has(value)) return true;
    error(file, `\`${field}\`: there's no ${folder.replace(/s$/, "")} called "${value}" (looked for world/${folder}/${value}.md).${didYouMean(value, map.keys())}`);
    return false;
  };
  const configCheck = (file: string, field: string, value: string | null | undefined, set: Set<string>, what: string) => {
    if (!value || set.has(value)) return true;
    error(file, `\`${field}\`: "${value}" isn't one of the ${what} in world/world.yml.${didYouMean(value, set)}`);
    return false;
  };

  for (const p of people) {
    configCheck(p.file, "region", p.region, regionSlugs, "regions");
    p.factions = p.factions.filter((f) => refCheck(p.file, "factions", f, faction, "factions"));
    p.factions.forEach((f) => faction.get(f)!.members.push(p.slug));
  }
  for (const f of factions) configCheck(f.file, "region", f.region, regionSlugs, "regions");
  for (const p of places) configCheck(p.file, "region", p.region, regionSlugs, "regions");

  /* Events ----------------------------------------------------------- */
  const events: WorldEvent[] = [];
  const relationsRaw: (Relation & { file: string })[] = [];
  const eraSlugs = new Set(eras.map((e) => e.slug));
  for (const r of rawEvents) {
    const d = r.data;
    checkImage(r.file, d.image);
    // A bad date is already reported; carry on with a stand-in so the file's other problems are reported too.
    const start = date(r.file, "date", d.date) ?? { year: 1, month: null, day: null, precision: "year" as const };
    const end = date(r.file, "end", d.end);
    const sort = sortKey(start, calendar);
    const until = end ? sortKey(end, calendar) : sort;
    if (end && until < sort) error(r.file, `\`end\` (${d.end}) is before \`date\` (${d.date}).`);
    configCheck(r.file, "region", d.region, regionSlugs, "regions");
    configCheck(r.file, "category", d.category, categorySlugs, "categories");
    let era = d.era ?? null;
    if (era && !eraSlugs.has(era)) {
      error(r.file, `\`era\`: "${era}" isn't one of the eras in world/world.yml.${didYouMean(era, eraSlugs)}`);
      era = null;
    }
    era ??= eras.find((e) => sort >= e.startKey && sort <= e.endKey)?.slug ?? null;

    const ev: WorldEvent = {
      ...baseFields(r, d.title),
      kind: "event",
      start,
      end,
      sort,
      until: Math.max(sort, until),
      era,
      region: d.region,
      category: d.category,
      location: d.location ?? "",
      summary: d.summary,
      places: d.places.filter((p) => refCheck(r.file, "places", p, place, "places")),
      people: d.people.filter((p) => refCheck(r.file, "people", p.slug, person, "people")).map((p) => ({ slug: p.slug, role: p.role ?? null })),
      factions: d.factions.filter((f) => refCheck(r.file, "factions", f, faction, "factions")),
    };
    if (!ev.location && ev.places.length) ev.location = place.get(ev.places[0])!.name;
    events.push(ev);
    for (const kind of RELATION_KINDS) for (const t of d[kind]) relationsRaw.push({ from: r.slug, to: t.to, type: kind, note: t.note ?? null, file: r.file });
  }
  events.sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name));
  const event = new Map(events.map((e) => [e.slug, e]));

  const relations: Relation[] = [];
  for (const rel of relationsRaw) {
    if (rel.to === rel.from) {
      error(rel.file, `\`${rel.type}\`: an event can't link to itself.`);
      continue;
    }
    if (!refCheck(rel.file, rel.type, rel.to, event, "events")) continue;
    const { file, ...clean } = rel;
    const a = event.get(rel.from)!;
    const b = event.get(rel.to)!;
    if ((rel.type === "led_to" || rel.type === "contributed_to" || rel.type === "followed_by") && b.until < a.sort)
      warn(file, `\`${rel.type}\`: "${b.name}" ends before "${a.name}" begins. Check the dates or the direction of the link.`);
    relations.push(clean);
  }

  for (const e of events) {
    e.people.forEach((p) => person.get(p.slug)!.events.push(e.slug));
    e.places.forEach((p) => place.get(p)!.events.push(e.slug));
    e.factions.forEach((f) => faction.get(f)!.events.push(e.slug));
  }

  if (!events.length) warn("world/events", "there are no events yet. Run `npm run new event \"My first event\"` to add one.");
  if (config.start_here && !event.has(config.start_here)) error(configFile, `\`start_here\`: there's no event called "${config.start_here}".${didYouMean(config.start_here, event.keys())}`);

  const years = events.flatMap((e) => [e.start.year, (e.end ?? e.start).year]).concat(eras.flatMap((e) => [e.start.year, ...(e.end ? [e.end.year] : [])]));
  const from = years.length ? Math.min(...years) : 1;
  const to = years.length ? Math.max(...years) : 100;

  const world: World = {
    config,
    calendar,
    introHtml: config.intro ? render(configFile, config.intro) : "",
    eras,
    regions: config.regions,
    categories: config.categories,
    events,
    people: people.sort((a, b) => a.name.localeCompare(b.name)),
    places: places.sort((a, b) => a.name.localeCompare(b.name)),
    factions: factions.sort((a, b) => a.name.localeCompare(b.name)),
    relations,
    event,
    person,
    place,
    faction,
    issues,
    span: { from, to },
  };
  if (issues.some((i) => i.level === "error")) throw new WorldError(issues);
  cached = world;
  return world;
}

export class WorldError extends Error {
  constructor(public issues: Issue[]) {
    super(
      "Your world has problems that stop it from building:\n\n" +
        issues
          .filter((i) => i.level === "error")
          .map((i) => `  ${i.file}\n    ${i.message}`)
          .join("\n") +
        "\n\nRun `npm run check` to see them all.",
    );
  }
}

/* Queries used by pages --------------------------------------------- */

export const regionName = (w: World, slug: string | null) => w.regions.find((r) => r.slug === slug)?.name ?? "";
export const categoryName = (w: World, slug: string) => w.categories.find((c) => c.slug === slug)?.name ?? "";
export const eraOf = (w: World, slug: string | null) => w.eras.find((e) => e.slug === slug) ?? null;

export function relationsOf(w: World, slug: string) {
  const out = w.relations.filter((r) => r.from === slug);
  const inc = w.relations.filter((r) => r.to === slug);
  const pick = (list: Relation[], type: RelationKind, side: "from" | "to") =>
    list.filter((r) => r.type === type).map((r) => ({ event: w.event.get(r[side])!, note: r.note }));
  return {
    causedBy: pick(inc, "led_to", "from"),
    contributing: pick(inc, "contributed_to", "from"),
    precededBy: pick(inc, "followed_by", "from"),
    ledTo: pick(out, "led_to", "to"),
    contributedTo: pick(out, "contributed_to", "to"),
    followedBy: pick(out, "followed_by", "to"),
    partOf: pick(out, "part_of", "to"),
    parts: pick(inc, "part_of", "from"),
    related: [...pick(out, "related_to", "to"), ...pick(inc, "related_to", "from")],
  };
}

/** Events that overlap in time with this one, elsewhere in the world. */
export function meanwhile(w: World, ev: WorldEvent, limit = 4) {
  const linked = new Set(w.relations.filter((r) => r.from === ev.slug || r.to === ev.slug).flatMap((r) => [r.from, r.to]));
  const pad = Math.max(1, (ev.until - ev.sort) * 0.1);
  return w.events
    .filter((e) => e.slug !== ev.slug && !linked.has(e.slug) && e.sort <= ev.until + pad && e.until >= ev.sort - pad)
    .sort((a, b) => Number(b.region !== ev.region) - Number(a.region !== ev.region) || Math.abs(a.sort - ev.sort) - Math.abs(b.sort - ev.sort))
    .slice(0, limit);
}

/** The event with the most cause-and-effect links, used as a starting point. */
export function hubEvent(w: World) {
  if (w.config.start_here) return w.event.get(w.config.start_here)!;
  const count = new Map<string, number>();
  for (const r of w.relations) for (const s of [r.from, r.to]) count.set(s, (count.get(s) ?? 0) + 1);
  return [...w.events].sort((a, b) => (count.get(b.slug) ?? 0) - (count.get(a.slug) ?? 0))[0] ?? null;
}

/** Longest chain of "led to" links, for the home page. */
export function longestChain(w: World, max = 6) {
  const next = new Map<string, string[]>();
  for (const r of w.relations) if (r.type === "led_to") next.set(r.from, [...(next.get(r.from) ?? []), r.to]);
  const memo = new Map<string, string[]>();
  const walk = (s: string, seen: Set<string>): string[] => {
    if (memo.has(s)) return memo.get(s)!;
    let best: string[] = [];
    for (const n of next.get(s) ?? []) {
      if (seen.has(n)) continue;
      const c = walk(n, new Set([...seen, n]));
      if (c.length > best.length) best = c;
    }
    const res = [s, ...best];
    memo.set(s, res);
    return res;
  };
  let best: string[] = [];
  for (const e of w.events) {
    const c = walk(e.slug, new Set([e.slug]));
    if (c.length > best.length) best = c;
  }
  return best.slice(0, max).map((s) => w.event.get(s)!);
}
