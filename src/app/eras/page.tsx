import Link from "next/link";
import { EraStrip } from "@/components/era-strip";
import { IndexPage } from "@/components/index-page";
import { loadWorld } from "@/lib/world";

export const metadata = { title: "Eras" };

export default function Eras() {
  const w = loadWorld();
  return (
    <IndexPage title="Eras" intro="The ages of the world, in order.">
      <EraStrip world={w} />
      <ol className="mt-10 grid max-w-3xl gap-6">
        {w.eras.map((e) => (
          <li key={e.slug}>
            <h2 className="text-xl"><Link className="hover:underline" href={`/era/${e.slug}/`}>{e.name}</Link></h2>
            <p className="mt-1 text-ink-2">{e.summary}</p>
          </li>
        ))}
      </ol>
    </IndexPage>
  );
}
