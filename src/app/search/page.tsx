import { Suspense } from "react";
import { SearchView } from "@/components/search-view";
import { loadWorld } from "@/lib/world";

export const metadata = { title: "Search" };

export default function SearchPage() {
  const w = loadWorld();
  return (
    <div className="container-page max-w-4xl pt-10">
      <h1 className="text-3xl">Search</h1>
      <p className="mt-3 text-lg text-ink-2">Names, places, factions and years. Typos are forgiven.</p>
      <div className="mt-8">
        <Suspense fallback={null}>
          <SearchView placeholder={`Search ${w.config.name}`} />
        </Suspense>
      </div>
    </div>
  );
}
