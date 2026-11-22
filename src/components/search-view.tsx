"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { TYPE_LABEL, highlight, hrefFor, loadEngine, search, type Engine } from "@/lib/client-search";
import type { SearchDoc } from "@/lib/search-index";
import { SearchBox } from "./search-box";

const TYPES = ["all", "event", "person", "faction", "place", "era"] as const;

function Marked({ text, terms }: { text: string; terms: string[] }) {
  return <>{highlight(text, terms).map((p, i) => (p.mark ? <mark key={i}>{p.text}</mark> : <span key={i}>{p.text}</span>))}</>;
}

export function SearchView({ placeholder }: { placeholder: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const q = params.get("q") ?? "";
  const type = (params.get("type") ?? "all") as (typeof TYPES)[number];
  const [engine, setEngine] = useState<Engine | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    loadEngine().then(setEngine).catch(() => setFailed(true));
  }, []);

  const result = useMemo(() => (engine ? search(engine, q, 200) : null), [engine, q]);
  const counts = useMemo(() => {
    const c = new Map<string, number>();
    for (const h of result?.hits ?? []) c.set(h.type, (c.get(h.type) ?? 0) + 1);
    return c;
  }, [result]);
  const hits = (result?.hits ?? []).filter((h) => type === "all" || h.type === type);
  const setType = (t: string) => router.replace(`/search/?q=${encodeURIComponent(q)}${t === "all" ? "" : `&type=${t}`}`, { scroll: false });

  return (
    <div>
      <SearchBox key={q} defaultValue={q} placeholder={placeholder} autoFocus={!q} />
      {failed ? <p className="mt-8 text-ink-2">Search couldn&apos;t load. Check your connection and reload the page.</p> : null}
      {q && result ? (
        <>
          <div className="mt-6 flex flex-wrap gap-1.5" role="group" aria-label="Filter results">
            {TYPES.map((t) => {
              const n = t === "all" ? result.hits.length : counts.get(t) ?? 0;
              if (t !== "all" && !n) return null;
              return (
                <button key={t} type="button" aria-pressed={type === t} onClick={() => setType(t)} className={`rounded-full border px-3 py-1 text-sm ${type === t ? "border-ink bg-ink text-paper" : "border-line-strong bg-surface text-ink-2 hover:border-ink"}`}>
                  {t === "all" ? "All" : `${TYPE_LABEL[t as SearchDoc["type"]]}s`.replace("Persons", "People")} <span className="tabular opacity-70">{n}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-5 text-sm text-muted" role="status">
            {result.year !== null
              ? `${hits.length} result${hits.length === 1 ? "" : "s"} under way in that year`
              : result.approximate
                ? `No exact matches for “${q}”. Showing close spellings.`
                : `${hits.length} result${hits.length === 1 ? "" : "s"} for “${q}”`}
          </p>
          {hits.length ? (
            <ol className="mt-4 divide-y divide-line border-y border-line">
              {hits.map((h) => (
                <li key={h.id}>
                  <Link href={hrefFor(h)} className="group block py-4">
                    <span className="eyebrow">{TYPE_LABEL[h.type]}</span>
                    <span className="mt-0.5 block font-display text-[1.45rem] font-semibold leading-tight group-hover:underline group-hover:decoration-thread group-hover:decoration-1 group-hover:underline-offset-4">
                      <Marked text={h.title} terms={h.terms} />
                    </span>
                    <span className="mt-1 block max-w-3xl text-sm text-ink-2"><Marked text={h.detail} terms={h.terms} /></span>
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-6 text-ink-2">Nothing matches. Try a name, a place, or a year.</p>
          )}
        </>
      ) : null}
    </div>
  );
}
