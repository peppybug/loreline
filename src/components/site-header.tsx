import Link from "next/link";
import { DesktopNav, MobileNav } from "./site-nav";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader({ name, hasMap }: { name: string; hasMap: boolean }) {
  return (
    <header className="relative z-30 border-b border-line bg-paper">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 text-ink">
          <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" aria-hidden="true">
            <path d="M2 12h20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="6" cy="12" r="2" fill="currentColor" />
            <circle cx="18" cy="12" r="2" fill="currentColor" />
            <circle cx="12" cy="12" r="3.4" fill="var(--thread)" stroke="var(--paper)" strokeWidth="1.4" />
          </svg>
          <span className="truncate font-display text-[1.45rem] font-semibold leading-none">{name}</span>
        </Link>
        <DesktopNav hasMap={hasMap} />
        <div className="flex items-center gap-1">
          <Link href="/search/" className="hidden h-10 items-center gap-2 rounded-sm px-3 text-sm font-medium text-ink-2 hover:bg-sunken hover:text-ink sm:inline-flex">
            <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="m13 13 4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            Search
          </Link>
          <ThemeToggle />
          <MobileNav hasMap={hasMap} />
        </div>
      </div>
    </header>
  );
}
