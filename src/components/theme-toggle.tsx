"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
const KEY = "loreline-theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  useEffect(() => {
    try {
      const t = localStorage.getItem(KEY) as Theme | null;
      if (t === "light" || t === "dark") setTheme(t);
    } catch {}
  }, []);
  const apply = (t: Theme) => {
    setTheme(t);
    try {
      if (t === "system") {
        localStorage.removeItem(KEY);
        document.documentElement.removeAttribute("data-theme");
      } else {
        localStorage.setItem(KEY, t);
        document.documentElement.setAttribute("data-theme", t);
      }
    } catch {
      if (t === "system") document.documentElement.removeAttribute("data-theme");
      else document.documentElement.setAttribute("data-theme", t);
    }
  };
  const next: Theme = theme === "system" ? "dark" : theme === "dark" ? "light" : "system";
  const label = theme === "system" ? "Theme: match system" : theme === "dark" ? "Theme: dark" : "Theme: light";
  return (
    <button type="button" onClick={() => apply(next)} className="inline-flex h-10 w-10 items-center justify-center rounded-sm text-ink-2 hover:bg-sunken hover:text-ink" aria-label={`${label}. Switch theme`} title={label}>
      <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" aria-hidden="true">
        {theme === "dark" ? (
          <path d="M15.5 12.6A6.5 6.5 0 0 1 7.4 4.5a6.5 6.5 0 1 0 8.1 8.1Z" fill="currentColor" />
        ) : theme === "light" ? (
          <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <circle cx="10" cy="10" r="3.4" />
            <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M4.3 15.7l1.4-1.4M14.3 5.7l1.4-1.4" />
          </g>
        ) : (
          <g fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="10" cy="10" r="6.5" />
            <path d="M10 3.5v13a6.5 6.5 0 0 0 0-13Z" fill="currentColor" />
          </g>
        )}
      </svg>
    </button>
  );
}

export const themeScript = `try{var t=localStorage.getItem('${KEY}');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}`;
