"use client";

import MiniSearch from "minisearch";
import { parseYearQuery } from "./calendar";
import type { SearchDoc, SearchIndex } from "./search-index";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export interface Engine {
  index: SearchIndex;
  ms: MiniSearch<SearchDoc>;
  byId: Map<string, SearchDoc>;
}

let pending: Promise<Engine> | null = null;

export function loadEngine(): Promise<Engine> {
  pending ??= fetch(`${base}/data/search-index.json`)
    .then((r) => {
      if (!r.ok) throw new Error(`Search index unavailable (HTTP ${r.status})`);
      return r.json() as Promise<SearchIndex>;
    })
    .then((index) => {
      const ms = new MiniSearch<SearchDoc>({
        fields: ["title", "aliases", "links", "tags", "detail", "body"],
        storeFields: [],
        tokenize: (t) => normalise(t).split(/[^a-z0-9]+/).filter((w) => w && !STOP.has(w)),
        processTerm: (t) => t,
        extractField: (doc, field) => {
          const v = (doc as unknown as Record<string, unknown>)[field];
          return Array.isArray(v) ? v.join(" ") : ((v as string) ?? "");
        },
      });
      ms.addAll(index.docs);
      return { index, ms, byId: new Map(index.docs.map((d) => [d.id, d])) };
    })
    .catch((e) => {
      pending = null;
      throw e;
    });
  return pending;
}

const normalise = (t: string) => t.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
const STOP = new Set(["the", "of", "and", "a", "an", "in", "on", "at", "to", "for"]);
const BOOST = { title: 6, aliases: 4, links: 2, tags: 2, detail: 1, body: 0.5 };
const TYPE_WEIGHT: Record<SearchDoc["type"], number> = { event: 1, person: 1.15, faction: 1.1, place: 1.05, era: 1.2 };

export interface Hit extends SearchDoc {
  score: number;
  terms: string[];
}

/** Text search with prefix matching while typing, falling back to typo-tolerant matching. Years ("412", "88 BT") match events under way then. */
export function search(engine: Engine, raw: string, limit = 50): { hits: Hit[]; approximate: boolean; year: number | null } {
  const q = raw.trim();
  if (!q) return { hits: [], approximate: false, year: null };
  const year = parseYearQuery(q, engine.index.calendar);
  if (year !== null) {
    const hits = engine.index.docs
      .filter((d) => d.sy !== null && d.sy <= year && (d.ey ?? d.sy) >= year && (d.type === "event" || d.type === "era"))
      .map((d) => ({ ...d, score: d.type === "era" ? 2 : 1 - Math.abs((d.sy ?? 0) - year) / 10000, terms: [] }))
      .sort((a, b) => b.score - a.score);
    return { hits, approximate: false, year };
  }
  const opts = { boost: BOOST, prefix: (t: string, i: number, all: string[]) => i === all.length - 1 && t.length >= 2, combineWith: "AND" as const };
  let res = engine.ms.search(q, opts);
  let approximate = false;
  if (!res.length) {
    res = engine.ms.search(q, { ...opts, fields: ["title", "aliases", "links", "tags"], fuzzy: (t) => (t.length >= 6 ? 0.34 : t.length >= 4 ? 0.25 : false) });
    approximate = res.length > 0;
  }
  const hits = res
    .map((r) => {
      const d = engine.byId.get(String(r.id))!;
      return { ...d, score: r.score * TYPE_WEIGHT[d.type], terms: r.terms };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return { hits, approximate, year: null };
}

export const hrefFor = (d: Pick<SearchDoc, "type" | "slug">) => `/${d.type}/${d.slug}/`;
export const TYPE_LABEL: Record<SearchDoc["type"], string> = { event: "Event", person: "Person", place: "Place", faction: "Faction", era: "Era" };

export function highlight(text: string, terms: string[]): { text: string; mark: boolean }[] {
  if (!terms.length) return [{ text, mark: false }];
  const out: { text: string; mark: boolean }[] = [];
  for (const token of text.split(/(\s+|[.,;:!?()"“”'’\-–·])/)) {
    if (!token) continue;
    const n = normalise(token);
    const mark = n.length > 1 && terms.some((t) => t.length > 1 && n.startsWith(t));
    const last = out[out.length - 1];
    if (last && last.mark === mark) last.text += token;
    else out.push({ text: token, mark });
  }
  return out;
}
