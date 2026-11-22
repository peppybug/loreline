"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { TYPE_LABEL, hrefFor, loadEngine, search, type Hit } from "@/lib/client-search";

/** Typeahead search (WAI-ARIA combobox). Enter without a highlighted option opens the full results. */
export function SearchBox({ placeholder, defaultValue = "", size = "lg", autoFocus = false }: { placeholder: string; defaultValue?: string; size?: "lg" | "sm"; autoFocus?: boolean }) {
  const router = useRouter();
  const id = useId();
  const [value, setValue] = useState(defaultValue);
  const [items, setItems] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let live = true;
    const q = value.trim();
    if (q.length < 2) {
      setItems([]);
      return;
    }
    const t = setTimeout(() => {
      loadEngine()
        .then((engine) => live && setItems(search(engine, q, 7).hits))
        .catch(() => live && setItems([]));
    }, 90);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [value]);

  useEffect(() => {
    const close = (e: MouseEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };
  const submit = () => (active >= 0 && items[active] ? go(hrefFor(items[active])) : value.trim() && go(`/search/?q=${encodeURIComponent(value.trim())}`));
  const show = open && items.length > 0;
  const lg = size === "lg";

  return (
    <div ref={wrap} className="relative">
      <form role="search" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <label htmlFor={`${id}-input`} className="sr-only">Search</label>
        <div className={`flex items-center rounded-sm border border-line-strong bg-surface focus-within:border-ink ${lg ? "h-14" : "h-11"}`}>
          <svg viewBox="0 0 20 20" className={`ml-4 shrink-0 text-muted ${lg ? "h-5 w-5" : "h-4 w-4"}`} aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="m13 13 4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          <input
            id={`${id}-input`}
            role="combobox"
            aria-expanded={show}
            aria-controls={`${id}-list`}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${id}-opt-${active}` : undefined}
            autoComplete="off"
            autoFocus={autoFocus}
            value={value}
            placeholder={placeholder}
            onChange={(e) => { setValue(e.target.value); setOpen(true); setActive(-1); }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(items.length - 1, a + 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(-1, a - 1)); }
              else if (e.key === "Escape") { setOpen(false); setActive(-1); }
            }}
            className={`min-w-0 flex-1 bg-transparent px-3 outline-none placeholder:text-muted ${lg ? "text-lg" : "text-base"}`}
          />
          <button className={`mr-1.5 rounded-sm bg-ink font-medium text-paper hover:opacity-90 ${lg ? "px-5 py-2.5" : "px-3.5 py-1.5 text-sm"}`}>Search</button>
        </div>
      </form>
      {show ? (
        <ul id={`${id}-list`} role="listbox" className="absolute inset-x-0 top-full z-40 mt-1.5 overflow-hidden rounded-sm border border-line bg-surface py-1 shadow-lift">
          {items.map((it, i) => (
            <li
              key={it.id}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => { e.preventDefault(); go(hrefFor(it)); }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-baseline gap-3 px-4 py-2.5 ${i === active ? "bg-sunken" : ""}`}
            >
              <span className="w-16 shrink-0 text-xs font-semibold text-muted">{TYPE_LABEL[it.type]}</span>
              <span className="min-w-0">
                <span className="block font-medium">{it.title}</span>
                <span className="block truncate text-xs text-muted">{it.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
