"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { axisYear, formatYear, parseYearQuery, yearFromAxis, type Calendar } from "@/lib/calendar";
import type { EventCardData } from "@/lib/site";

const LABEL_COL = 168;
const ROW_H = 30;
const LANE_PAD = 10;
const ERA_H = 22;
/** Room on the right so the last labels aren't cut off. */
const TAIL = 240;

function tickStep(ppy: number) {
  const steps = [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
  return steps.find((s) => s * ppy >= 90) ?? 10000;
}

export interface TimelineEra {
  slug: string;
  name: string;
  startKey: number;
  endKey: number | null;
}

export function Timeline({
  events,
  regions,
  categories,
  eras,
  calendar,
  span,
}: {
  events: EventCardData[];
  regions: { slug: string; name: string }[];
  categories: { slug: string; name: string }[];
  eras: TimelineEra[];
  calendar: Calendar;
  span: { from: number; to: number };
}) {
  const router = useRouter();
  const params = useSearchParams();
  const scroller = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1000);
  const [ppy, setPpy] = useState(1);
  const [view, setView] = useState<"chart" | "list">("chart");
  const [cursor, setCursor] = useState<number | null>(null);
  const [hover, setHover] = useState<{ e: EventCardData; x: number; y: number } | null>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const pendingCenter = useRef<number | null>(null);

  // Axis runs a little past the first and last year.
  const pad = Math.max(5, Math.round((span.to - span.from) * 0.03));
  const MIN = axisYear(span.from) - pad;
  const MAX = axisYear(span.to) + pad + 1;
  const SPAN = MAX - MIN;

  const activeRegions = useMemo(() => new Set((params.get("regions") ?? "").split(",").filter(Boolean)), [params]);
  const category = params.get("category") ?? "";
  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params.toString());
    if (v) next.set(k, v);
    else next.delete(k);
    router.replace(`/timeline/?${next.toString()}`, { scroll: false });
  };

  const filtered = useMemo(
    () => events.filter((e) => (activeRegions.size === 0 || activeRegions.has(e.region)) && (!category || e.category === category)),
    [events, activeRegions, category],
  );

  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) setView("list");
  }, []);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, [view]);

  const fitPpy = Math.max(0.01, (width - LABEL_COL - TAIL) / SPAN);
  const effPpy = Math.max(ppy, fitPpy);
  const x = useCallback((a: number) => LABEL_COL + (a - MIN) * effPpy, [effPpy, MIN]);
  const totalW = LABEL_COL + SPAN * effPpy + TAIL;
  const levels = [
    { id: "all", label: "Everything", ppy: 0 },
    { id: "centuries", label: "Centuries", ppy: 4 },
    { id: "decades", label: "Decades", ppy: 30 },
    { id: "years", label: "Years", ppy: 220 },
  ].filter((l) => l.ppy === 0 || l.ppy > fitPpy * 1.3);

  const centerAxis = () => {
    const el = scroller.current;
    if (!el) return (MIN + MAX) / 2;
    return MIN + (el.scrollLeft + (el.clientWidth - LABEL_COL) / 2) / effPpy;
  };
  const zoomTo = (next: number, around?: number) => {
    pendingCenter.current = around ?? centerAxis();
    setPpy(Math.min(400, Math.max(fitPpy, next)));
  };
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && pendingCenter.current !== null) {
      el.scrollLeft = (pendingCenter.current - MIN) * effPpy - (el.clientWidth - LABEL_COL) / 2;
      pendingCenter.current = null;
      setScrollLeft(el.scrollLeft);
    }
  }, [effPpy, MIN]);

  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current || view !== "chart" || width < 200) return;
    didInit.current = true;
    const from = Number(params.get("from"));
    const to = Number(params.get("to"));
    if (params.get("from") && Number.isFinite(from) && Number.isFinite(to) && to > from) {
      zoomTo((width - LABEL_COL - 40) / (axisYear(to) - axisYear(from) + 1), (axisYear(from) + axisYear(to)) / 2);
    } else zoomTo(fitPpy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, width]);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const onWheel = (ev: WheelEvent) => {
      if (!ev.ctrlKey && !ev.metaKey) return;
      ev.preventDefault();
      const rect = el.getBoundingClientRect();
      const at = MIN + (el.scrollLeft + ev.clientX - rect.left - LABEL_COL) / effPpy;
      const nextPpy = Math.min(400, Math.max(fitPpy, effPpy * Math.exp(-ev.deltaY * 0.0025)));
      const offset = ev.clientX - rect.left - LABEL_COL;
      setPpy(nextPpy);
      requestAnimationFrame(() => (el.scrollLeft = (at - MIN) * nextPpy - offset));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [effPpy, fitPpy, MIN]);

  /* Lanes ----------------------------------------------------------- */
  const lanes = useMemo(() => {
    return regions
      .filter((r) => filtered.some((e) => e.region === r.slug))
      .map((r) => {
        const list = filtered.filter((e) => e.region === r.slug).sort((a, b) => a.sort - b.sort);
        const rowsEnd: number[] = [];
        const placed = list.map((e) => {
          const x0 = x(e.sort);
          const x1 = e.endYear > e.startYear ? Math.max(x(e.until + 1), x0 + 8) : x0 + 8;
          const end = Math.max(x1, x0 + 14 + Math.min(e.title.length * 6.8, 240)) + 8;
          let row = rowsEnd.findIndex((v) => v <= x0);
          if (row === -1) {
            row = rowsEnd.length;
            rowsEnd.push(end);
          } else rowsEnd[row] = end;
          return { e, x0, x1, row };
        });
        return { region: r, placed, rows: Math.max(1, rowsEnd.length) };
      });
  }, [filtered, regions, x]);

  const laneTops = useMemo(() => {
    let y = 0;
    return lanes.map((l) => {
      const top = y;
      y += l.rows * ROW_H + LANE_PAD * 2;
      return top;
    });
  }, [lanes]);
  const top0 = 36 + (eras.length ? ERA_H : 0);
  const chartH = laneTops.length ? laneTops[laneTops.length - 1] + lanes[lanes.length - 1].rows * ROW_H + LANE_PAD * 2 : 120;

  /* Ticks at round years ------------------------------------------ */
  const step = tickStep(effPpy);
  const visFrom = yearFromAxis(MIN + (scrollLeft - 200) / effPpy);
  const visTo = yearFromAxis(MIN + (scrollLeft + width + 200) / effPpy);
  const ticks: number[] = [];
  for (let t = Math.ceil(Math.max(yearFromAxis(MIN), visFrom) / step) * step; t <= Math.min(yearFromAxis(MAX), visTo); t += step) ticks.push(t === 0 ? 1 : t);

  const atCursor = useMemo(() => {
    if (cursor === null) return [];
    const tol = Math.max(0.5, 6 / effPpy);
    return filtered.filter((e) => e.sort - tol <= cursor && e.until + 1 + tol >= cursor);
  }, [cursor, filtered, effPpy]);

  const levelId = levels.slice().reverse().find((l) => (l.ppy === 0 ? true : effPpy >= l.ppy * 0.8))?.id;
  const fmt = (y: number) => formatYear(y, calendar);
  const cursorYear = cursor !== null ? yearFromAxis(cursor) : null;
  const example = fmt(Math.round((span.from + span.to) / 2) || 1);

  return (
    <div>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-4 border-b border-line pb-5">
        <div>
          <span className="text-xs font-semibold" id="view-label">View</span>
          <div role="radiogroup" aria-labelledby="view-label" className="mt-1 flex rounded-sm border border-line-strong bg-surface p-1 text-sm">
            {(["chart", "list"] as const).map((v) => (
              <button key={v} type="button" role="radio" aria-checked={view === v} onClick={() => setView(v)} className={`rounded-xs px-3 py-1.5 ${view === v ? "bg-ink text-paper" : "text-ink-2 hover:bg-sunken"}`}>
                {v === "chart" ? "Chart" : "List"}
              </button>
            ))}
          </div>
        </div>
        {view === "chart" ? (
          <div>
            <span className="text-xs font-semibold" id="zoom-label">Zoom</span>
            <div role="group" aria-labelledby="zoom-label" className="mt-1 flex flex-wrap rounded-sm border border-line-strong bg-surface p-1 text-sm">
              <button type="button" onClick={() => zoomTo(effPpy / 2)} className="rounded-xs px-2.5 py-1.5 text-ink-2 hover:bg-sunken" aria-label="Zoom out">−</button>
              {levels.map((l) => (
                <button key={l.id} type="button" aria-pressed={levelId === l.id} onClick={() => zoomTo(l.ppy || fitPpy)} className={`rounded-xs px-2.5 py-1.5 ${levelId === l.id ? "bg-ink text-paper" : "text-ink-2 hover:bg-sunken"}`}>
                  {l.label}
                </button>
              ))}
              <button type="button" onClick={() => zoomTo(effPpy * 2)} className="rounded-xs px-2.5 py-1.5 text-ink-2 hover:bg-sunken" aria-label="Zoom in">+</button>
            </div>
          </div>
        ) : null}
        <div>
          <label htmlFor="tl-cat" className="text-xs font-semibold">Kind</label>
          <select id="tl-cat" value={category} onChange={(e) => setParam("category", e.target.value)} className="mt-1 block rounded-sm border border-line-strong bg-surface px-2.5 py-2 text-sm">
            <option value="">Everything</option>
            {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </div>
        {view === "chart" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const y = parseYearQuery(String(new FormData(e.currentTarget).get("year") ?? ""), calendar);
              if (y !== null) zoomTo(Math.max(effPpy, 30), axisYear(y) + 0.5);
            }}
          >
            <label htmlFor="tl-year" className="text-xs font-semibold">Go to year</label>
            <div className="mt-1 flex gap-1">
              <input id="tl-year" name="year" placeholder={`e.g. ${example}`} className="w-36 rounded-sm border border-line-strong bg-surface px-2.5 py-2 text-sm" />
              <button className="rounded-sm border border-line-strong px-3 text-sm font-medium hover:border-ink">Go</button>
            </div>
          </form>
        ) : null}
        <p className="text-sm text-muted tabular" role="status">{filtered.length} of {events.length} events</p>
      </div>

      <fieldset className="mt-4">
        <legend className="text-xs font-semibold">Regions</legend>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {regions.map((r) => {
            const on = activeRegions.has(r.slug);
            return (
              <button
                key={r.slug}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  const next = new Set(activeRegions);
                  if (on) next.delete(r.slug);
                  else next.add(r.slug);
                  setParam("regions", [...next].join(","));
                }}
                className={`rounded-full border px-3 py-1 text-sm ${on ? "border-ink bg-ink text-paper" : "border-line-strong bg-surface text-ink-2 hover:border-ink"}`}
              >
                {r.name}
              </button>
            );
          })}
          {activeRegions.size ? <button type="button" onClick={() => setParam("regions", "")} className="link px-2 text-sm">Show all</button> : null}
        </div>
      </fieldset>

      {view === "chart" ? (
        <>
          <p className="mt-4 text-xs text-muted">Scroll sideways to move through time. Hold Ctrl (or ⌘) and scroll, or pinch, to zoom. Point at the chart to see everything under way in a given year.</p>
          <div
            ref={scroller}
            onScroll={(e) => setScrollLeft(e.currentTarget.scrollLeft)}
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const px = e.clientX - r.left + e.currentTarget.scrollLeft;
              setCursor(px < LABEL_COL + e.currentTarget.scrollLeft ? null : MIN + (px - LABEL_COL) / effPpy);
            }}
            onMouseLeave={() => { setCursor(null); setHover(null); }}
            className="relative mt-3 overflow-x-auto overflow-y-hidden rounded-sm border border-line bg-surface"
            tabIndex={0}
            aria-label="Timeline chart. Use the zoom buttons, or the arrow keys to scroll."
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") e.currentTarget.scrollLeft += 120;
              if (e.key === "ArrowLeft") e.currentTarget.scrollLeft -= 120;
              if (e.key === "+" || e.key === "=") zoomTo(effPpy * 1.6);
              if (e.key === "-") zoomTo(effPpy / 1.6);
            }}
          >
            <div style={{ width: totalW, height: chartH + top0 }} className="relative">
              <div className="sticky top-0 z-20 h-9 border-b border-line bg-surface" style={{ width: totalW }}>
                <span aria-hidden="true" className="sticky left-0 z-10 block h-full border-r border-line bg-surface" style={{ width: LABEL_COL }} />
                {ticks.map((t) => (
                  <span key={t} className="absolute top-0 h-full whitespace-nowrap border-l border-line pl-1.5 pt-2 text-xs text-muted tabular" style={{ left: x(axisYear(t)) }}>{fmt(t)}</span>
                ))}
              </div>
              {eras.length ? (
                <div className="absolute inset-x-0 top-9 border-b border-line" style={{ height: ERA_H }}>
                  {eras.map((er, i) => {
                    const l = x(Math.max(MIN, er.startKey));
                    const r = x(Math.min(MAX, er.endKey ?? MAX));
                    const w = Math.max(0, r - l);
                    // Show the name only when at least a few letters fit; the full name is always in the tooltip.
                    const showName = w >= 48;
                    return (
                      <Link
                        key={er.slug}
                        href={`/era/${er.slug}/`}
                        title={er.name}
                        aria-label={er.name}
                        className={`absolute top-0 flex h-full items-center border-l border-line px-2 text-xs font-semibold text-ink-2 hover:text-ink`}
                        style={{ left: l, width: w, background: `color-mix(in srgb, var(--thread) ${i % 2 ? 20 : 9}%, var(--surface))` }}
                      >
                        {showName ? <span className="min-w-0 truncate">{er.name}</span> : null}
                      </Link>
                    );
                  })}
                  <span aria-hidden="true" className="sticky left-0 z-10 flex h-full items-center border-r border-line bg-surface px-3 text-xs text-muted" style={{ width: LABEL_COL }}>Eras</span>
                </div>
              ) : null}
              {ticks.map((t) => <span key={`g${t}`} aria-hidden="true" className="absolute w-px bg-line/60" style={{ left: x(axisYear(t)), top: top0, height: chartH }} />)}

              {lanes.map((lane, i) => (
                <div key={lane.region.slug} className={`absolute inset-x-0 ${i ? "border-t border-line" : ""}`} style={{ top: top0 + laneTops[i], height: lane.rows * ROW_H + LANE_PAD * 2 }}>
                  <div className="sticky left-0 z-20 flex h-full items-start border-r border-line bg-surface px-3 pt-3 text-sm font-medium" style={{ width: LABEL_COL }}>{lane.region.name}</div>
                  {lane.placed.map(({ e, x0, x1, row }) => {
                    const isRange = x1 - x0 > 9;
                    const lit = cursor !== null && atCursor.includes(e);
                    return (
                      <Link
                        key={e.slug}
                        href={`/event/${e.slug}/`}
                        className="group absolute flex items-center gap-1.5 focus-visible:z-30"
                        style={{ left: x0, top: LANE_PAD + row * ROW_H, height: ROW_H - 6 }}
                        aria-label={`${e.title}, ${e.years}, ${e.regionName}`}
                        onMouseEnter={(ev) => {
                          const r = scroller.current!.getBoundingClientRect();
                          setHover({ e, x: ev.clientX - r.left, y: ev.clientY - r.top });
                        }}
                        onFocus={() => setHover({ e, x: x0 - scrollLeft + 10, y: top0 + laneTops[i] + LANE_PAD + row * ROW_H + 30 })}
                        onBlur={() => setHover(null)}
                      >
                        {isRange ? (
                          <span className={`block h-2 rounded-full ${lit ? "bg-thread" : "bg-ink-2/70 group-hover:bg-thread"}`} style={{ width: x1 - x0 }} />
                        ) : (
                          <span className={`block h-3 w-3 shrink-0 rounded-full border-2 border-surface ${lit ? "bg-thread" : "bg-ink group-hover:bg-thread"}`} />
                        )}
                        <span className={`whitespace-nowrap text-[0.8rem] leading-none ${lit ? "font-semibold text-ink" : "text-ink-2 group-hover:text-ink"} ${isRange ? "absolute left-0 top-[18px]" : ""}`}>{e.title}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}

              {cursor !== null ? (
                <span aria-hidden="true" className="pointer-events-none absolute top-0 z-20 w-px bg-thread" style={{ left: x(cursor), height: chartH + top0 }}>
                  <span className="absolute left-1 top-1 whitespace-nowrap rounded-xs bg-thread px-1.5 py-0.5 text-xs font-semibold text-white tabular">{fmt(cursorYear!)}</span>
                </span>
              ) : null}
            </div>

            {hover ? (
              <div
                className="pointer-events-none fixed z-40 w-72 rounded-sm border border-line bg-surface p-3 shadow-lift"
                style={{
                  left: Math.min((scroller.current?.getBoundingClientRect().left ?? 0) + hover.x + 14, (typeof window !== "undefined" ? window.innerWidth : 1200) - 300),
                  top: (scroller.current?.getBoundingClientRect().top ?? 0) + hover.y + 14,
                }}
                role="tooltip"
              >
                <p className="text-xs text-muted tabular">{hover.e.when}</p>
                <p className="font-display text-lg font-semibold leading-snug">{hover.e.title}</p>
                {hover.e.location ? <p className="text-xs text-muted">{hover.e.location}</p> : null}
                <p className="mt-2 line-clamp-3 text-xs text-ink-2">{hover.e.summary}</p>
              </div>
            ) : null}
          </div>

          <div className="mt-4 min-h-[4.5rem] rounded-sm border border-line bg-surface p-4" aria-live="polite">
            {cursorYear !== null ? (
              atCursor.length ? (
                <>
                  <p className="text-sm font-semibold tabular">Around {fmt(cursorYear)}: {atCursor.length} event{atCursor.length === 1 ? "" : "s"} under way</p>
                  <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                    {atCursor.slice(0, 10).map((e) => <li key={e.slug}><span className="font-medium">{e.title}</span> <span className="text-muted">· {e.regionName}</span></li>)}
                  </ul>
                </>
              ) : (
                <p className="text-sm text-muted">Nothing recorded around {fmt(cursorYear)}.</p>
              )
            ) : (
              <p className="text-sm text-muted">Point at the chart to see which events overlap. Long events are bars; single dates are dots.</p>
            )}
          </div>
        </>
      ) : (
        <ListView events={filtered} eras={eras} />
      )}
    </div>
  );
}

function ListView({ events, eras }: { events: EventCardData[]; eras: TimelineEra[] }) {
  if (!events.length) return <p className="mt-8 text-ink-2">No events match these filters.</p>;
  const groups = new Map<string, EventCardData[]>();
  for (const e of events) {
    const era = eras.find((er) => e.sort >= er.startKey && e.sort <= (er.endKey ?? Infinity));
    const k = era?.name ?? "Other";
    groups.set(k, [...(groups.get(k) ?? []), e]);
  }
  return (
    <div className="mt-6">
      {[...groups].map(([label, list]) => (
        <section key={label} aria-label={label}>
          <h2 className="sticky top-0 z-10 border-b border-line bg-paper py-2 text-xl">{label} <span className="font-sans text-sm text-muted tabular">{list.length}</span></h2>
          <ol className="border-l-2 border-line py-3 pl-5">
            {list.map((e) => (
              <li key={e.slug} className="relative py-2">
                <span aria-hidden="true" className="absolute -left-[27px] top-4 h-3 w-3 rounded-full border-2 border-paper bg-ink" />
                <Link href={`/event/${e.slug}/`} className="group block">
                  <span className="block text-xs text-muted tabular">{e.when} · {e.regionName}</span>
                  <span className="block font-display text-xl font-semibold leading-snug group-hover:underline group-hover:decoration-thread group-hover:decoration-1 group-hover:underline-offset-4">{e.title}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
