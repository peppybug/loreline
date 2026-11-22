import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page max-w-2xl pt-20">
      <p className="eyebrow">Not found</p>
      <h1 className="mt-2 text-3xl">This page is lost to history</h1>
      <p className="mt-4 text-lg text-ink-2">It may have been renamed, or it hasn&apos;t been written yet.</p>
      <p className="mt-6 flex gap-5"><Link className="link" href="/">Home</Link><Link className="link" href="/search/">Search</Link><Link className="link" href="/timeline/">Timeline</Link></p>
    </div>
  );
}
