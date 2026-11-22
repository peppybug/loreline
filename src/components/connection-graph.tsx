"use client";

import Link from "next/link";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

export interface GraphNode {
  id: string;
  slug: string;
  title: string;
  sortKey: number;
  years: string;
}
type Node = GraphNode;
interface Edge {
  from: string;
  to: string;
  type: string;
  note: string | null;
}

const DIRECTED: Set<string> = new Set(["led_to", "contributed_to", "followed_by"]);
const VERB: Record<string, string> = {
  led_to: "led to",
  contributed_to: "contributed to",
  followed_by: "was followed by",
  part_of: "was part of",
  occurred_during: "occurred during",
  related_to: "is related to",
};

function stroke(type: string) {
  if (type === "led_to") return { color: "var(--thread)", width: 2.5, dash: undefined };
  if (type === "contributed_to") return { color: "var(--thread)", width: 2, dash: "7 5" };
  return { color: "var(--line-strong)", width: 2, dash: "2 5" };
}

/**
 * Layered layout: the selected event sits in the centre column; events it
 * (directly or indirectly) caused or preceded go to the right, causes to the
 * left. Thematic links (part of, related) are listed separately so that
 * they are never drawn as if they were causal.
 */
export function ConnectionGraph({ nodes, edges, rootId }: { nodes: Node[]; edges: Edge[]; rootId: string }) {
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const { columns, contextEdges, layerOf } = useMemo(() => {
    const layer = new Map<string, number>([[rootId, 0]]);
    const queue = [rootId];
    while (queue.length) {
      const id = queue.shift()!;
      const l = layer.get(id)!;
      for (const e of edges) {
        if (!DIRECTED.has(e.type)) continue;
        if (e.from === id && !layer.has(e.to)) {
          layer.set(e.to, l + 1);
          queue.push(e.to);
        } else if (e.to === id && !layer.has(e.from)) {
          layer.set(e.from, l - 1);
          queue.push(e.from);
        }
      }
    }
    // Enforce a clean left-to-right reading: every directed link points to a
    // later column, and only the selected event sits in column 0.
    const directed = edges.filter((e) => DIRECTED.has(e.type) && layer.has(e.from) && layer.has(e.to));
    const rootKey = byId.get(rootId)?.sortKey ?? 0;
    for (const [id, l] of layer) if (id !== rootId && l === 0) layer.set(id, (byId.get(id)?.sortKey ?? 0) < rootKey ? -1 : 1);
    for (let pass = 0; pass < nodes.length + 2; pass++) {
      let changed = false;
      for (const e of directed) {
        const lu = layer.get(e.from)!;
        const lv = layer.get(e.to)!;
        if (lv > lu) continue;
        changed = true;
        if (e.to === rootId || (e.from !== rootId && lu < 0)) {
          let n = lv - 1;
          if (n === 0 && e.from !== rootId) n = -1;
          layer.set(e.from, n);
        } else {
          let n = lu + 1;
          if (n === 0 && e.to !== rootId) n = 1;
          layer.set(e.to, n);
        }
      }
      if (!changed) break;
    }
    // Close gaps so columns are consecutive on each side of the root.
    const used = [...new Set(layer.values())].sort((a, b) => a - b);
    const before = used.filter((l) => l < 0).reverse();
    const after = used.filter((l) => l > 0);
    const remap = new Map<number, number>([[0, 0]]);
    before.forEach((l, i) => remap.set(l, -(i + 1)));
    after.forEach((l, i) => remap.set(l, i + 1));
    for (const [id, l] of layer) layer.set(id, remap.get(l)!);

    const cols = new Map<number, Node[]>();
    for (const [id, l] of layer) {
      const n = byId.get(id);
      if (n) cols.set(l, [...(cols.get(l) ?? []), n]);
    }
    const sorted = [...cols.entries()].sort((a, b) => a[0] - b[0]).map(([l, list]) => ({ layer: l, nodes: list.sort((a, b) => a.sortKey - b.sortKey) }));
    const ctx = edges.filter((e) => !DIRECTED.has(e.type) && (e.from === rootId || e.to === rootId));
    return { columns: sorted, contextEdges: ctx, layerOf: layer };
  }, [edges, rootId, byId, nodes.length]);

  const drawn = edges.filter((e) => DIRECTED.has(e.type) && layerOf.has(e.from) && layerOf.has(e.to));

  /* Measure card positions to draw connectors ------------------------ */
  const wrap = useRef<HTMLDivElement>(null);
  const scrollBox = useRef<HTMLDivElement>(null);
  // Start with the selected event in view, centred when the map is wider than the screen.
  useLayoutEffect(() => {
    const box = scrollBox.current;
    const node = box?.querySelector<HTMLElement>(`[data-node="${rootId}"]`);
    if (!box || !node) return;
    const b = box.getBoundingClientRect();
    const n = node.getBoundingClientRect();
    box.scrollLeft += n.left + n.width / 2 - (b.left + b.width / 2);
  }, [rootId]);
  const [paths, setPaths] = useState<{ d: string; type: string; key: string; mid: [number, number] }[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const measure = () => {
      const base = el.getBoundingClientRect();
      const box = (id: string) => el.querySelector<HTMLElement>(`[data-node="${id}"]`)?.getBoundingClientRect();
      const out: typeof paths = [];
      for (const e of drawn) {
        const a = box(e.from);
        const b = box(e.to);
        if (!a || !b) continue;
        const forward = (layerOf.get(e.to) ?? 0) > (layerOf.get(e.from) ?? 0);
        const x1 = (forward ? a.right : a.left) - base.left;
        const y1 = a.top + a.height / 2 - base.top;
        const x2 = (forward ? b.left : b.right) - base.left;
        const y2 = b.top + b.height / 2 - base.top;
        const dx = Math.max(30, Math.abs(x2 - x1) / 2);
        const d = forward
          ? `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`
          : `M${x1},${y1} C${x1 - dx},${y1} ${x2 + dx},${y2} ${x2},${y2}`;
        out.push({ d, type: e.type, key: `${e.from}-${e.to}-${e.type}`, mid: [(x1 + x2) / 2, (y1 + y2) / 2] });
      }
      setPaths(out);
      setSize({ w: el.scrollWidth, h: el.scrollHeight });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, edges]);

  const root = byId.get(rootId)!;
  const isolated = columns.length <= 1;

  return (
    <div>
      {isolated ? (
        <p className="rounded-sm border border-line bg-surface p-5 text-ink-2">
          {root.title} has no cause-and-effect links yet. Add `led_to`, `contributed_to` or `followed_by` to its file to connect it. {contextEdges.length ? "Its thematic links are listed below." : ""}
        </p>
      ) : (
        <div ref={scrollBox} className="overflow-x-auto rounded-sm border border-line bg-surface">
          <div ref={wrap} className="relative flex min-w-max gap-16 p-6">
            <svg className="pointer-events-none absolute left-0 top-0" width={size.w} height={size.h} aria-hidden="true">
              <defs>
                <marker id="arrow-red" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0,0 L10,5 L0,10 z" fill="var(--thread)" />
                </marker>
                <marker id="arrow-grey" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0,0 L10,5 L0,10 z" fill="var(--line-strong)" />
                </marker>
              </defs>
              {paths.map((p) => {
                const s = stroke(p.type);
                return (
                  <path
                    key={p.key}
                    d={p.d}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={s.width}
                    strokeDasharray={s.dash}
                    strokeLinecap="round"
                    markerEnd={p.type === "followed_by" ? "url(#arrow-grey)" : "url(#arrow-red)"}
                  />
                );
              })}
            </svg>
            {columns.map((col) => (
              <div key={col.layer} className="relative z-10 flex w-60 flex-col justify-center gap-4">
                <p className="text-center text-xs font-semibold text-muted">
                  {col.layer === 0 ? "Selected event" : col.layer < 0 ? "Earlier" : "Later"}
                </p>
                {col.nodes.map((n) => (
                  <Link
                    key={n.id}
                    data-node={n.id}
                    href={n.id === rootId ? `/event/${n.slug}/` : `/connections/${n.slug}/`}
                    className={`group block rounded-sm border bg-surface p-3 transition-[border-color,box-shadow] duration-150 hover:shadow-lift ${
                      n.id === rootId ? "border-2 border-ink" : "border-line hover:border-line-strong"
                    }`}
                  >
                    <span className="flex gap-2.5">
                      <span className="min-w-0">
                        <span className="block text-xs text-muted tabular">{n.years}</span>
                        <span className="block font-display text-[1.15rem] font-semibold leading-snug group-hover:underline group-hover:decoration-thread group-hover:underline-offset-4">{n.title}</span>
                      </span>
                    </span>
                    {n.id === rootId ? <span className="mt-2 block text-xs font-medium text-ink-2">Open the full record</span> : null}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="links-h">
          <h2 id="links-h" className="font-sans text-base font-semibold">Every link shown, in words</h2>
          <ul className="mt-3 grid gap-2.5 text-sm">
            {drawn.map((e) => {
              const a = byId.get(e.from);
              const b = byId.get(e.to);
              if (!a || !b) return null;
              const causal = e.type === "led_to" || e.type === "contributed_to";
              return (
                <li key={`${e.from}-${e.to}-${e.type}`} className="border-b border-line pb-2.5">
                  <Link className="link" href={`/connections/${a.slug}/`}>{a.title}</Link>{" "}
                  <span className={causal ? "font-semibold text-thread-ink" : "text-muted"}>{VERB[e.type]}</span>{" "}
                  <Link className="link" href={`/connections/${b.slug}/`}>{b.title}</Link>
                  {e.note ? <span className="mt-0.5 block text-xs text-ink-2">{e.note}</span> : null}
                </li>
              );
            })}
          </ul>
        </section>
        {contextEdges.length ? (
          <section aria-labelledby="ctx-h">
            <h2 id="ctx-h" className="font-sans text-base font-semibold">Other links</h2>
            <ul className="mt-3 grid gap-2.5 text-sm">
              {contextEdges.map((e) => {
                const a = byId.get(e.from);
                const b = byId.get(e.to);
                if (!a || !b) return null;
                return (
                  <li key={`${e.from}-${e.to}-${e.type}`} className="border-b border-line pb-2.5">
                    <Link className="link" href={`/event/${a.slug}/`}>{a.title}</Link> <span className="text-muted">{VERB[e.type]}</span>{" "}
                    <Link className="link" href={`/event/${b.slug}/`}>{b.title}</Link>
                    {e.note ? <span className="mt-0.5 block text-xs text-ink-2">{e.note}</span> : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
